/**
 * PlugU AI Moderation Module
 * Shared content moderation utilities for Supabase Edge Functions
 * Provides text, image, email, and phone moderation using AI services
 */

import { createServiceClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Moderation configuration
const MODERATION_CONFIG = {
  // Text moderation thresholds (0-1, higher = more strict)
  textThresholds: {
    hate: 0.7,
    harassment: 0.7,
    selfHarm: 0.8,
    sexual: 0.8,
    violence: 0.7,
    spam: 0.9,
  },
  // Image moderation thresholds
  imageThresholds: {
    adult: 0.7,
    violence: 0.7,
    racy: 0.8,
    spam: 0.9,
  },
  // Auto-flag thresholds (content is automatically flagged if score exceeds)
  autoFlagThreshold: 0.85,
  // Require manual review threshold
  reviewThreshold: 0.6,
};

// OpenAI API configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1';

// Email validation service configuration
const EMAIL_VALIDATION_API_KEY = Deno.env.get('EMAIL_VALIDATION_API_KEY');
const EMAIL_VALIDATION_URL = 'https://api.emailvalidation.io/v1';

// Phone validation service configuration
const PHONE_VALIDATION_API_KEY = Deno.env.get('PHONE_VALIDATION_API_KEY');
const PHONE_VALIDATION_URL = 'https://phonevalidation.abstractapi.com/v1';

/**
 * Moderation result type
 */
export interface ModerationResult {
  flagged: boolean;
  score: number;
  categories: Record<string, number>;
  reason?: string;
  action: 'allow' | 'flag' | 'block';
}

/**
 * Text moderation result
 */
export interface TextModerationResult extends ModerationResult {
  originalText: string;
  sanitizedText: string;
}

/**
 * Image moderation result
 */
export interface ImageModerationResult extends ModerationResult {
  imageUrl: string;
  nsfwScore: number;
}

/**
 * Email validation result
 */
export interface EmailValidationResult {
  valid: boolean;
  email: string;
  isDisposable: boolean;
  isRoleAccount: boolean;
  score: number;
  reason?: string;
}

/**
 * Phone validation result
 */
export interface PhoneValidationResult {
  valid: boolean;
  phone: string;
  countryCode?: string;
  carrier?: string;
  lineType?: string;
  score: number;
  reason?: string;
}

/**
 * Content type for moderation
 */
export type ContentType = 'post' | 'comment' | 'message' | 'listing' | 'profile';

/**
 * AI Text Moderation using OpenAI Moderation API
 */
export async function moderateText(
  text: string,
  options: {
    contentType?: ContentType;
    useOpenAI?: boolean;
  } = {}
): Promise<TextModerationResult> {
  // Sanitize text first
  const sanitizedText = sanitizeText(text);
  
  // Basic profanity check (fallback when OpenAI is unavailable)
  const basicCheck = basicTextModeration(sanitizedText);
  
  // If OpenAI is configured, use it for advanced moderation
  if (options.useOpenAI !== false && OPENAI_API_KEY) {
    try {
      const openaiResult = await callOpenAIModeration(sanitizedText);
      return {
        ...openaiResult,
        originalText: text,
        sanitizedText,
      };
    } catch (error) {
      console.warn('OpenAI moderation failed, using fallback:', error);
    }
  }
  
  return {
    ...basicCheck,
    originalText: text,
    sanitizedText,
  };
}

/**
 * Call OpenAI Moderation API
 */
async function callOpenAIModeration(text: string): Promise<ModerationResult> {
  const response = await fetch(`${OPENAI_API_URL}/moderations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ input: text }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const result = data.results[0];
  
  const categories = result.category_scores;
  const maxScore = Math.max(...Object.values(categories) as number[]);
  
  // Determine action based on scores
  let action: 'allow' | 'flag' | 'block' = 'allow';
  let flagged = false;
  let reason: string | undefined;
  
  if (maxScore >= MODERATION_CONFIG.autoFlagThreshold) {
    action = 'block';
    flagged = true;
    reason = getTopCategory(categories);
  } else if (maxScore >= MODERATION_CONFIG.reviewThreshold) {
    action = 'flag';
    flagged = true;
    reason = getTopCategory(categories);
  }
  
  return {
    flagged,
    score: maxScore,
    categories,
    reason,
    action,
  };
}

/**
 * Basic text moderation (fallback)
 */
function basicTextModeration(text: string): ModerationResult {
  // List of common profanity patterns (simplified - use a proper library in production)
  const profanityPatterns = [
    /\b(f+u+c+k+|s+h+i+t+|a+s+s+h+o+l+e+|b+i+t+c+h+|d+i+c+k+|p+i+s+s+)\b/gi,
  ];
  
  // Spam patterns
  const spamPatterns = [
    /(http[s]?:\/\/[^\s]+){3,}/gi, // Multiple URLs
    /\b(v+i+a+g+r+a+|c+i+a+l+i+s+|p+h+a+r+m+a+c+y+)\b/gi,
    /\b(c+l+i+c+k+\s+h+e+r+e+|l+i+m+i+t+e+d+\s+t+i+m+e+)\b/gi,
  ];
  
  let score = 0;
  const categories: Record<string, number> = {
    hate: 0,
    harassment: 0,
    selfHarm: 0,
    sexual: 0,
    violence: 0,
    spam: 0,
  };
  
  // Check profanity
  for (const pattern of profanityPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      score = Math.max(score, 0.5 + (matches.length * 0.1));
      categories.harassment = Math.max(categories.harassment, 0.5);
    }
  }
  
  // Check spam
  for (const pattern of spamPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      score = Math.max(score, 0.6 + (matches.length * 0.1));
      categories.spam = Math.max(categories.spam, 0.7);
    }
  }
  
  // Determine action
  let action: 'allow' | 'flag' | 'block' = 'allow';
  let flagged = false;
  let reason: string | undefined;
  
  if (score >= MODERATION_CONFIG.autoFlagThreshold) {
    action = 'block';
    flagged = true;
    reason = getTopCategory(categories);
  } else if (score >= MODERATION_CONFIG.reviewThreshold) {
    action = 'flag';
    flagged = true;
    reason = getTopCategory(categories);
  }
  
  return {
    flagged,
    score,
    categories,
    reason,
    action,
  };
}

/**
 * Get the highest scoring category
 */
function getTopCategory(categories: Record<string, number>): string {
  return Object.entries(categories)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
}

/**
 * Sanitize text content
 */
function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * AI Image Moderation
 * Uses external image moderation service or OpenAI Vision
 */
export async function moderateImage(
  imageUrl: string,
  options: {
    contentType?: ContentType;
  } = {}
): Promise<ImageModerationResult> {
  // For production, integrate with:
  // - AWS Rekognition
  // - Google Cloud Vision
  // - Microsoft Azure Content Moderator
  // - OpenAI Vision API
  
  // Placeholder implementation
  const result = await callImageModerationAPI(imageUrl);
  
  return {
    ...result,
    imageUrl,
    nsfwScore: result.categories.adult || 0,
  };
}

/**
 * Call external image moderation API
 */
async function callImageModerationAPI(imageUrl: string): Promise<ModerationResult> {
  // This is a placeholder - implement with your chosen provider
  // Example with AWS Rekognition or similar service
  
  try {
    // Simulate API call
    // In production, replace with actual API integration
    const response = await fetch(imageUrl, { method: 'HEAD' });
    
    if (!response.ok) {
      throw new Error('Image not accessible');
    }
    
    // Placeholder: In production, analyze image content
    // Return safe result for now
    return {
      flagged: false,
      score: 0.1,
      categories: {
        adult: 0.1,
        violence: 0.05,
        racy: 0.1,
        spam: 0,
      },
      action: 'allow',
    };
  } catch (error) {
    console.error('Image moderation error:', error);
    
    // Fail open - allow but flag for review
    return {
      flagged: true,
      score: 0.5,
      categories: {},
      reason: 'moderation_service_error',
      action: 'flag',
    };
  }
}

/**
 * Batch moderate multiple images
 */
export async function moderateImages(
  imageUrls: string[],
  options: {
    contentType?: ContentType;
  } = {}
): Promise<ImageModerationResult[]> {
  const results = await Promise.all(
    imageUrls.map(url => moderateImage(url, options))
  );
  return results;
}

/**
 * Email Validation
 * Checks if email is valid, not disposable, and not a role account
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      email,
      isDisposable: false,
      isRoleAccount: false,
      score: 0,
      reason: 'invalid_format',
    };
  }
  
  // Check against known disposable email domains
  const disposableDomains = [
    'tempmail.com', 'throwaway.com', 'mailinator.com',
    'guerrillamail.com', '10minutemail.com', 'yopmail.com',
  ];
  
  const domain = email.split('@')[1].toLowerCase();
  const isDisposable = disposableDomains.includes(domain);
  
  // Check for role accounts
  const rolePrefixes = ['admin', 'support', 'info', 'contact', 'sales', 'marketing', 'noreply'];
  const prefix = email.split('@')[0].toLowerCase();
  const isRoleAccount = rolePrefixes.some(role => prefix.startsWith(role));
  
  // Use external validation service if configured
  if (EMAIL_VALIDATION_API_KEY) {
    try {
      const externalResult = await callEmailValidationAPI(email);
      return externalResult;
    } catch (error) {
      console.warn('Email validation API failed, using basic check:', error);
    }
  }
  
  // Calculate score
  let score = 1.0;
  if (isDisposable) score -= 0.5;
  if (isRoleAccount) score -= 0.3;
  
  return {
    valid: score >= 0.5,
    email,
    isDisposable,
    isRoleAccount,
    score,
    reason: isDisposable ? 'disposable_email' : isRoleAccount ? 'role_account' : undefined,
  };
}

/**
 * Call external email validation API
 */
async function callEmailValidationAPI(email: string): Promise<EmailValidationResult> {
  const response = await fetch(
    `${EMAIL_VALIDATION_URL}/validate?email=${encodeURIComponent(email)}&api_key=${EMAIL_VALIDATION_API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error(`Email validation API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    valid: data.is_valid && !data.is_disposable,
    email,
    isDisposable: data.is_disposable,
    isRoleAccount: data.is_role_account,
    score: data.quality_score,
    reason: data.is_disposable ? 'disposable_email' : 
            data.is_role_account ? 'role_account' : 
            !data.is_valid ? 'invalid_email' : undefined,
  };
}

/**
 * Phone Validation
 * Validates phone number format and checks if it's valid
 */
export async function validatePhone(phone: string): Promise<PhoneValidationResult> {
  // Clean the phone number
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Basic format validation (E.164)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(cleaned)) {
    return {
      valid: false,
      phone: cleaned,
      score: 0,
      reason: 'invalid_format',
    };
  }
  
  // Use external validation service if configured
  if (PHONE_VALIDATION_API_KEY) {
    try {
      const externalResult = await callPhoneValidationAPI(cleaned);
      return externalResult;
    } catch (error) {
      console.warn('Phone validation API failed, using basic check:', error);
    }
  }
  
  // Basic validation passed
  return {
    valid: true,
    phone: cleaned,
    score: 0.7,
  };
}

/**
 * Call external phone validation API
 */
async function callPhoneValidationAPI(phone: string): Promise<PhoneValidationResult> {
  const response = await fetch(
    `${PHONE_VALIDATION_URL}/?api_key=${PHONE_VALIDATION_API_KEY}&phone=${encodeURIComponent(phone)}`
  );
  
  if (!response.ok) {
    throw new Error(`Phone validation API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    valid: data.valid,
    phone,
    countryCode: data.country?.code,
    carrier: data.carrier,
    lineType: data.type,
    score: data.valid ? 0.9 : 0,
    reason: data.valid ? undefined : 'invalid_phone_number',
  };
}

/**
 * Flag content in database
 */
export async function flagContent(
  contentType: ContentType,
  contentId: string,
  reason: string,
  score: number
): Promise<void> {
  const supabase = createServiceClient();
  
  const tableMap: Record<ContentType, string> = {
    post: 'posts',
    comment: 'comments',
    message: 'messages',
    listing: 'listings',
    profile: 'profiles',
  };
  
  const table = tableMap[contentType];
  if (!table) {
    throw new Error(`Invalid content type: ${contentType}`);
  }
  
  const updates: Record<string, any> = {
    is_flagged: true,
    moderation_score: score,
  };
  
  if (contentType === 'post' || contentType === 'listing') {
    updates.flag_reason = reason;
    updates.status = 'under_review';
  } else if (contentType === 'comment') {
    updates.status = 'hidden';
  }
  
  const { error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', contentId);
  
  if (error) {
    console.error('Error flagging content:', error);
    throw error;
  }
  
  // Create admin notification for flagged content
  await createModerationNotification(contentType, contentId, reason, score);
}

/**
 * Create moderation notification for admins
 */
async function createModerationNotification(
  contentType: ContentType,
  contentId: string,
  reason: string,
  score: number
): Promise<void> {
  const supabase = createServiceClient();
  
  // Get admin users
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_verified', true)
    .limit(10);
  
  if (!admins || admins.length === 0) return;
  
  // Create notifications
  const notifications = admins.map(admin => ({
    user_id: admin.id,
    type: 'content_flagged',
    title: 'Content Flagged for Review',
    body: `${contentType} flagged: ${reason} (score: ${score.toFixed(2)})`,
    target_type: contentType,
    target_id: contentId,
    data: { content_type: contentType, content_id: contentId, reason, score },
  }));
  
  await supabase.from('notifications').insert(notifications);
}

/**
 * Approve flagged content
 */
export async function approveContent(
  contentType: ContentType,
  contentId: string
): Promise<void> {
  const supabase = createServiceClient();
  
  const tableMap: Record<ContentType, string> = {
    post: 'posts',
    comment: 'comments',
    message: 'messages',
    listing: 'listings',
    profile: 'profiles',
  };
  
  const table = tableMap[contentType];
  if (!table) return;
  
  const updates: Record<string, any> = {
    is_flagged: false,
    moderation_score: null,
  };
  
  if (contentType === 'post' || contentType === 'listing') {
    updates.flag_reason = null;
    updates.status = 'active';
  } else if (contentType === 'comment') {
    updates.status = 'active';
  }
  
  await supabase
    .from(table)
    .update(updates)
    .eq('id', contentId);
}

/**
 * Moderation middleware for Edge Functions
 * Automatically moderates content before processing
 */
export async function moderationMiddleware(
  content: {
    text?: string;
    images?: string[];
  },
  options: {
    contentType: ContentType;
    contentId?: string;
    autoFlag?: boolean;
  }
): Promise<{
  allowed: boolean;
  results: {
    text?: TextModerationResult;
    images?: ImageModerationResult[];
  };
}> {
  const results: {
    text?: TextModerationResult;
    images?: ImageModerationResult[];
  } = {};
  
  // Moderate text
  if (content.text) {
    results.text = await moderateText(content.text, {
      contentType: options.contentType,
    });
  }
  
  // Moderate images
  if (content.images && content.images.length > 0) {
    results.images = await moderateImages(content.images, {
      contentType: options.contentType,
    });
  }
  
  // Determine if content should be allowed
  const textBlocked = results.text?.action === 'block';
  const imagesBlocked = results.images?.some(img => img.action === 'block');
  const allowed = !textBlocked && !imagesBlocked;
  
  // Auto-flag if enabled and content is flagged
  if (options.autoFlag && options.contentId) {
    const shouldFlag = results.text?.action === 'flag' || 
                       results.images?.some(img => img.action === 'flag');
    
    if (shouldFlag) {
      const reason = results.text?.reason || 'image_content_flagged';
      const score = results.text?.score || results.images?.[0]?.score || 0.5;
      await flagContent(options.contentType, options.contentId, reason, score);
    }
  }
  
  return { allowed, results };
}

// Export moderation utilities
export const moderation = {
  moderateText,
  moderateImage,
  moderateImages,
  validateEmail,
  validatePhone,
  flagContent,
  approveContent,
  moderationMiddleware,
  config: MODERATION_CONFIG,
};

export default moderation;
