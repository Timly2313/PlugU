/**
 * PlugU Authentication Module
 * Shared authentication utilities for Supabase Edge Functions
 * Provides JWT validation, user context, and permission checking
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { jwtVerify, importSPKI } from 'https://esm.sh/jose@5.2.0';

// Environment configuration
const SUPABASE_URL = Deno.env.get('CLIENT_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const JWT_SECRET = Deno.env.get('JWT_SECRET')!;

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 60000, // 1 minute
  maxRequests: 100, // requests per window
};

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * User context from JWT
 */
export interface UserContext {
  id: string;
  email?: string;
  role?: string;
  isAnonymous: boolean;
  metadata?: Record<string, any>;
}

/**
 * Authentication result
 */
export interface AuthResult {
  user: UserContext | null;
  error?: string;
  statusCode: number;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Extract JWT from request headers
 */
export function extractJWT(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}

/**
 * Verify JWT token and extract user context
 */
export async function verifyJWT(token: string): Promise<AuthResult> {
  try {
    // Create service client to verify token
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        user: null,
        error: 'Invalid or expired token',
        statusCode: 401,
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isAnonymous: user.is_anonymous || false,
        metadata: user.user_metadata,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return {
      user: null,
      error: 'Token verification failed',
      statusCode: 401,
    };
  }
}

/**
 * Authenticate request and return user context
 */
export async function authenticate(req: Request): Promise<AuthResult> {
  const token = extractJWT(req);
  
  if (!token) {
    return {
      user: null,
      error: 'Authorization header required',
      statusCode: 401,
    };
  }

  return verifyJWT(token);
}

/**
 * Optional authentication - returns user if available but doesn't require it
 */
export async function optionalAuth(req: Request): Promise<UserContext | null> {
  const token = extractJWT(req);
  if (!token) return null;
  
  const result = await verifyJWT(token);
  return result.user;
}

/**
 * Check rate limit for a key (IP address or user ID)
 */
export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Clean up expired entries
  if (record && record.resetTime <= now) {
    rateLimitStore.delete(key);
  }

  // Get or create rate limit record
  const current = rateLimitStore.get(key);
  if (!current) {
    const resetTime = now + RATE_LIMIT_CONFIG.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
      resetTime,
    };
  }

  // Check if limit exceeded
  if (current.count >= RATE_LIMIT_CONFIG.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
      retryAfter: Math.ceil((current.resetTime - now) / 1000),
    };
  }

  // Increment count
  current.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_CONFIG.maxRequests - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * Rate limit middleware
 */
export function rateLimit(req: Request): RateLimitResult | null {
  // Get client IP or use a fallback
  const clientIP = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown';
  
  const result = checkRateLimit(clientIP);
  
  if (!result.allowed) {
    return result;
  }
  
  return null; // No rate limit hit
}

/**
 * Permission check helpers
 */
export class Permissions {
  /**
   * Check if user owns a resource
   */
  static isOwner(userId: string, resourceOwnerId: string): boolean {
    return userId === resourceOwnerId;
  }

  /**
   * Check if user is admin
   */
  static isAdmin(user: UserContext): boolean {
    return user.role === 'admin' || user.role === 'service_role';
  }

  /**
   * Check if user is moderator
   */
  static isModerator(user: UserContext): boolean {
    return this.isAdmin(user) || user.role === 'moderator';
  }

  /**
   * Check if user can modify resource
   */
  static canModify(user: UserContext, resourceOwnerId: string): boolean {
    return this.isOwner(user.id, resourceOwnerId) || this.isAdmin(user);
  }

  /**
   * Check if user can delete resource
   */
  static canDelete(user: UserContext, resourceOwnerId: string): boolean {
    return this.isOwner(user.id, resourceOwnerId) || this.isAdmin(user);
  }

  /**
   * Check if user can moderate content
   */
  static canModerate(user: UserContext): boolean {
    return this.isModerator(user);
  }
}

/**
 * Authorization middleware factory
 * Creates middleware that checks specific permissions
 */
export function requireAuth(
  options: {
    requireVerified?: boolean;
    requirePremium?: boolean;
    allowedRoles?: string[];
  } = {}
) {
  return async (req: Request): Promise<AuthResult> => {
    const result = await authenticate(req);
    
    if (!result.user) {
      return result;
    }

    const user = result.user;

    // Check verification requirement
    if (options.requireVerified && !user.metadata?.verified) {
      return {
        user: null,
        error: 'Account verification required',
        statusCode: 403,
      };
    }

    // Check premium requirement
    if (options.requirePremium && !user.metadata?.is_premium) {
      return {
        user: null,
        error: 'Premium subscription required',
        statusCode: 403,
      };
    }

    // Check role requirements
    if (options.allowedRoles && !options.allowedRoles.includes(user.role || '')) {
      return {
        user: null,
        error: 'Insufficient permissions',
        statusCode: 403,
      };
    }

    return result;
  };
}

/**
 * Get user profile with extended information
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Record<string, any> | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Check if user is blocked by another user
 */
export async function isUserBlocked(
  supabase: SupabaseClient,
  userId: string,
  blockedById: string
): Promise<boolean> {
  // Implementation depends on your block system
  // This is a placeholder
  const { data } = await supabase
    .from('user_blocks')
    .select('id')
    .eq('blocker_id', blockedById)
    .eq('blocked_id', userId)
    .maybeSingle();

  return !!data;
}

/**
 * Authentication middleware for Edge Functions
 * Usage: const { user, error } = await authMiddleware(req);
 */
export async function authMiddleware(req: Request): Promise<{
  user: UserContext | null;
  error?: string;
  statusCode: number;
  headers: Record<string, string>;
}> {
  // Check rate limit first
  const rateLimitResult = rateLimit(req);
  if (rateLimitResult) {
    return {
      user: null,
      error: 'Rate limit exceeded',
      statusCode: 429,
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
      },
    };
  }

  // Authenticate user
  const result = await authenticate(req);
  
  // Get remaining rate limit
  const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitInfo = checkRateLimit(clientIP);

  return {
    user: result.user,
    error: result.error,
    statusCode: result.statusCode,
    headers: {
      'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
      'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
      'X-RateLimit-Reset': rateLimitInfo.resetTime.toString(),
    },
  };
}

/**
 * Create service role client for admin operations
 */
export function createServiceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Generate secure random token
 */
export function generateToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash sensitive data (for comparison, not password hashing)
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Export auth utilities
export const auth = {
  extractJWT,
  verifyJWT,
  authenticate,
  optionalAuth,
  checkRateLimit,
  rateLimit,
  Permissions,
  requireAuth,
  getUserProfile,
  isUserBlocked,
  authMiddleware,
  createServiceClient,
  generateToken,
  hashData,
};

export default auth;
