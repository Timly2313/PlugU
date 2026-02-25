/**
 * PlugU Database Module
 * Shared database utilities for Supabase Edge Functions
 * Provides connection management, query builders, and data access patterns
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Database configuration
const SUPABASE_URL = Deno.env.get('CLIENT_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;

// Connection pool configuration
const POOL_CONFIG = {
  maxConnections: 20,
  connectionTimeoutMs: 10000,
  queryTimeoutMs: 30000,
};

/**
 * Create a new Supabase client with service role
 * Use for admin operations that bypass RLS
 */
export function createServiceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  });
}

/**
 * Create a Supabase client with user JWT
 * Use for user-specific operations that respect RLS
 */
export function createUserClient(jwt: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  });
}

/**
 * Database query builder with pagination support
 */
export class QueryBuilder {
  private client: SupabaseClient;
  private table: string;
  private query: any;

  constructor(client: SupabaseClient, table: string) {
    this.client = client;
    this.table = table;
    this.query = client.from(table);
  }

  select(columns: string = '*'): this {
    this.query = this.query.select(columns);
    return this;
  }

  eq(column: string, value: any): this {
    this.query = this.query.eq(column, value);
    return this;
  }

  neq(column: string, value: any): this {
    this.query = this.query.neq(column, value);
    return this;
  }

  gt(column: string, value: any): this {
    this.query = this.query.gt(column, value);
    return this;
  }

  gte(column: string, value: any): this {
    this.query = this.query.gte(column, value);
    return this;
  }

  lt(column: string, value: any): this {
    this.query = this.query.lt(column, value);
    return this;
  }

  lte(column: string, value: any): this {
    this.query = this.query.lte(column, value);
    return this;
  }

  in(column: string, values: any[]): this {
    this.query = this.query.in(column, values);
    return this;
  }

  is(column: string, value: any): this {
    this.query = this.query.is(column, value);
    return this;
  }

  like(column: string, pattern: string): this {
    this.query = this.query.ilike(column, pattern);
    return this;
  }

  contains(column: string, value: any): this {
    this.query = this.query.contains(column, value);
    return this;
  }

  containedBy(column: string, value: any): this {
    this.query = this.query.containedBy(column, value);
    return this;
  }

  overlaps(column: string, value: any): this {
    this.query = this.query.overlaps(column, value);
    return this;
  }

  textSearch(column: string, query: string): this {
    this.query = this.query.textSearch(column, query);
    return this;
  }

  order(column: string, ascending: boolean = true): this {
    this.query = this.query.order(column, { ascending });
    return this;
  }

  limit(count: number): this {
    this.query = this.query.limit(count);
    return this;
  }

  range(from: number, to: number): this {
    this.query = this.query.range(from, to);
    return this;
  }

  single(): this {
    this.query = this.query.single();
    return this;
  }

  maybeSingle(): this {
    this.query = this.query.maybeSingle();
    return this;
  }

  async execute(): Promise<{ data: any; error: any; count?: number }> {
    const startTime = Date.now();
    try {
      const result = await this.query;
      const duration = Date.now() - startTime;
      
      // Log slow queries in development
      if (duration > 1000) {
        console.warn(`Slow query detected on ${this.table}: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      console.error(`Query error on ${this.table}:`, error);
      throw error;
    }
  }
}

/**
 * Pagination helper for list queries
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

export function getPaginationRange(params: PaginationParams): { from: number; to: number } {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { from, to };
}

/**
 * Database operations for common entities
 */
export class DatabaseOperations {
  constructor(private client: SupabaseClient) {}

  // Profile operations
  async getProfile(userId: string) {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateProfile(userId: string, updates: Record<string, any>) {
    const { data, error } = await this.client
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Post operations
  async getPost(postId: string) {
    const { data, error } = await this.client
      .from('posts')
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url, is_verified)
      `)
      .eq('id', postId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getPosts(options: {
    userId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    let query = this.client
      .from('posts')
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url, is_verified)
      `);

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const { from, to } = getPaginationRange({ 
      page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
      limit: options.limit 
    });

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, count };
  }

  // Listing operations
  async getListing(listingId: string) {
    const { data, error } = await this.client
      .from('listings')
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url, is_verified, reputation_score)
      `)
      .eq('id', listingId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getListings(options: {
    userId?: string;
    category?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
  } = {}) {
    let query = this.client
      .from('listings')
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url, is_verified)
      `);

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options.category) {
      query = query.eq('category', options.category);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.minPrice !== undefined) {
      query = query.gte('price', options.minPrice);
    }

    if (options.maxPrice !== undefined) {
      query = query.lte('price', options.maxPrice);
    }

    const { from, to } = getPaginationRange({
      page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
      limit: options.limit
    });

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, count };
  }

  // Notification operations
  async getNotifications(userId: string, options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    let query = this.client
      .from('notifications')
      .select(`
        *,
        actor:actor_id (username, display_name, avatar_url)
      `)
      .eq('user_id', userId);

    if (options.unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { from, to } = getPaginationRange({
      page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
      limit: options.limit
    });

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return data;
  }

  async markNotificationsRead(userId: string, notificationIds?: string[]) {
    let query = this.client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (notificationIds && notificationIds.length > 0) {
      query = query.in('id', notificationIds);
    }

    const { error } = await query;
    if (error) throw error;
    return true;
  }

  // Message operations
  async getMessages(conversationId: string, options: {
    limit?: number;
    beforeId?: string;
  } = {}) {
    let query = this.client
      .from('messages')
      .select(`
        *,
        sender:sender_id (username, display_name, avatar_url)
      `)
      .eq('conversation_id', conversationId);

    if (options.beforeId) {
      const { data: beforeMsg } = await this.client
        .from('messages')
        .select('created_at')
        .eq('id', options.beforeId)
        .single();
      
      if (beforeMsg) {
        query = query.lt('created_at', beforeMsg.created_at);
      }
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(options.limit || 50);

    if (error) throw error;
    return data;
  }

  async sendMessage(conversationId: string, senderId: string, content: string, options: {
    mediaUrls?: string[];
    replyToId?: string;
  } = {}) {
    const { data, error } = await this.client
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        media_urls: options.mediaUrls || [],
        reply_to_id: options.replyToId,
      })
      .select(`
        *,
        sender:sender_id (username, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // RPC call wrapper
  async callRPC(functionName: string, params: Record<string, any>) {
    const { data, error } = await this.client.rpc(functionName, params);
    if (error) throw error;
    return data;
  }
}

/**
 * Transaction helper for multi-operation transactions
 * Note: Supabase JS client doesn't support true transactions across multiple calls
 * For complex transactions, use database functions (RPC)
 */
export async function withTransaction<T>(
  client: SupabaseClient,
  operations: (db: DatabaseOperations) => Promise<T>
): Promise<T> {
  // In a real implementation, this would use a transaction
  // For now, we just execute operations and handle errors
  try {
    const db = new DatabaseOperations(client);
    return await operations(db);
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
}

/**
 * Cache helper for frequently accessed data
 * Uses Deno KV for caching (if available) or in-memory fallback
 */
export class Cache {
  private memoryCache: Map<string, { value: any; expires: number }> = new Map();
  private defaultTTL: number = 300000; // 5 minutes

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const cached = this.memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.value as T;
    }
    
    // Remove expired entry
    if (cached) {
      this.memoryCache.delete(key);
    }

    return null;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const expires = Date.now() + (ttlMs || this.defaultTTL);
    this.memoryCache.set(key, { value, expires });
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
  }
}

// Export singleton instances
export const db = {
  createServiceClient,
  createUserClient,
  QueryBuilder,
  DatabaseOperations,
  getPaginationRange,
  withTransaction,
  Cache,
};

export default db;
