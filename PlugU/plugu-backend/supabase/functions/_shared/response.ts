/**
 * PlugU Response Module
 * Shared response utilities for Supabase Edge Functions
 * Provides standardized JSON responses, error handling, and CORS support
 */

// CORS configuration
const CORS_CONFIG = {
  allowedOrigins: Deno.env.get('ALLOWED_ORIGINS')?.split(',') || ['*'],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Client-Version',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Total-Count',
  ],
  maxAge: 86400, // 24 hours
  credentials: true,
};

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string; // Only in development
}

/**
 * Response metadata for pagination, etc.
 */
export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  nextCursor?: string;
  timestamp: string;
  requestId: string;
  duration?: number;
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Build CORS headers
 */
export function buildCORSHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '*';
  const allowedOrigin = CORS_CONFIG.allowedOrigins.includes('*') 
    ? origin 
    : CORS_CONFIG.allowedOrigins.find(o => o === origin) || CORS_CONFIG.allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': CORS_CONFIG.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': CORS_CONFIG.allowedHeaders.join(', '),
    'Access-Control-Expose-Headers': CORS_CONFIG.exposedHeaders.join(', '),
    'Access-Control-Max-Age': CORS_CONFIG.maxAge.toString(),
    ...(CORS_CONFIG.credentials && { 'Access-Control-Allow-Credentials': 'true' }),
  };
}

/**
 * Build standard response headers
 */
export function buildResponseHeaders(
  req: Request,
  options: {
    contentType?: string;
    additionalHeaders?: Record<string, string>;
    rateLimitHeaders?: Record<string, string>;
  } = {}
): Record<string, string> {
  const requestId = generateRequestId();
  
  return {
    'Content-Type': options.contentType || 'application/json',
    'X-Request-Id': requestId,
    'X-Response-Time': new Date().toISOString(),
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...buildCORSHeaders(req),
    ...(options.rateLimitHeaders || {}),
    ...(options.additionalHeaders || {}),
  };
}

/**
 * Create success response
 */
export function successResponse<T>(
  data: T,
  options: {
    status?: number;
    meta?: Partial<ResponseMeta>;
    headers?: Record<string, string>;
  } = {}
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      ...options.meta,
    },
  };

  return new Response(JSON.stringify(response), {
    status: options.status || 200,
    headers: options.headers,
  });
}

/**
 * Create error response
 */
export function errorResponse(
  code: string,
  message: string,
  options: {
    status?: number;
    details?: Record<string, any>;
    headers?: Record<string, string>;
    includeStack?: boolean;
  } = {}
): Response {
  const error: ApiError = {
    code,
    message,
    ...(options.details && { details: options.details }),
  };

  // Include stack trace in development
  if (options.includeStack && Deno.env.get('ENVIRONMENT') === 'development') {
    error.stack = new Error().stack;
  }

  const response: ApiResponse = {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    },
  };

  return new Response(JSON.stringify(response), {
    status: options.status || 400,
    headers: options.headers,
  });
}

/**
 * Common error response helpers
 */
export const errors = {
  badRequest: (message: string = 'Bad request', details?: Record<string, any>) =>
    errorResponse('BAD_REQUEST', message, { status: 400, details }),

  unauthorized: (message: string = 'Unauthorized') =>
    errorResponse('UNAUTHORIZED', message, { status: 401 }),

  forbidden: (message: string = 'Forbidden') =>
    errorResponse('FORBIDDEN', message, { status: 403 }),

  notFound: (message: string = 'Not found') =>
    errorResponse('NOT_FOUND', message, { status: 404 }),

  conflict: (message: string = 'Conflict') =>
    errorResponse('CONFLICT', message, { status: 409 }),

  validationError: (message: string = 'Validation failed', details?: Record<string, any>) =>
    errorResponse('VALIDATION_ERROR', message, { status: 422, details }),

  rateLimited: (message: string = 'Rate limit exceeded', retryAfter?: number) =>
    errorResponse('RATE_LIMITED', message, { 
      status: 429, 
      headers: retryAfter ? { 'Retry-After': retryAfter.toString() } : undefined 
    }),

  internalError: (message: string = 'Internal server error', includeStack?: boolean) =>
    errorResponse('INTERNAL_ERROR', message, { status: 500, includeStack }),

  serviceUnavailable: (message: string = 'Service temporarily unavailable') =>
    errorResponse('SERVICE_UNAVAILABLE', message, { status: 503 }),
};

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    nextCursor?: string;
  },
  options: {
    headers?: Record<string, string>;
  } = {}
): Response {
  const hasMore = pagination.page * pagination.limit < pagination.total;

  return successResponse(data, {
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      hasMore,
      nextCursor: pagination.nextCursor,
    },
    headers: {
      'X-Total-Count': pagination.total.toString(),
      ...options.headers,
    },
  });
}

/**
 * Handle CORS preflight requests
 */
export function handleCORS(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: buildCORSHeaders(req),
    });
  }
  return null;
}

/**
 * Parse request body with error handling
 */
export async function parseBody<T = any>(req: Request): Promise<{
  data: T | null;
  error?: Response;
}> {
  try {
    const contentType = req.headers.get('Content-Type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await req.json();
      return { data };
    }
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const data: Record<string, any> = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      return { data: data as T };
    }
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      return { data: formData as unknown as T };
    }
    
    // Try JSON as fallback
    const text = await req.text();
    if (text) {
      return { data: JSON.parse(text) };
    }
    
    return { data: null };
  } catch (error) {
    return {
      data: null,
      error: errors.badRequest('Invalid request body', {
        error: error instanceof Error ? error.message : 'Parse error',
      }),
    };
  }
}

/**
 * Parse query parameters
 */
export function parseQueryParams(req: Request): Record<string, string> {
  const url = new URL(req.url);
  const params: Record<string, string> = {};
  
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

/**
 * Parse pagination from query params
 */
export function parsePagination(params: Record<string, string>): {
  page: number;
  limit: number;
  cursor?: string;
} {
  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 20));
  const cursor = params.cursor;
  
  return { page, limit, cursor };
}

/**
 * Response builder for complex responses
 */
export class ResponseBuilder {
  private statusCode: number = 200;
  private headers: Record<string, string> = {};
  private data: any = null;
  private error: ApiError | null = null;
  private meta: Partial<ResponseMeta> = {};

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  setHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  setHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  setData(data: any): this {
    this.data = data;
    return this;
  }

  setError(code: string, message: string, details?: Record<string, any>): this {
    this.error = { code, message, details };
    return this;
  }

  setMeta(meta: Partial<ResponseMeta>): this {
    this.meta = { ...this.meta, ...meta };
    return this;
  }

  build(): Response {
    const response: ApiResponse = {
      success: !this.error,
      ...(this.data && { data: this.data }),
      ...(this.error && { error: this.error }),
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        ...this.meta,
      },
    };

    return new Response(JSON.stringify(response), {
      status: this.statusCode,
      headers: this.headers,
    });
  }
}

/**
 * Streaming response for large data
 */
export function streamingResponse(
  generator: AsyncGenerator<string>,
  options: {
    contentType?: string;
    headers?: Record<string, string>;
  } = {}
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': options.contentType || 'text/plain',
      'Transfer-Encoding': 'chunked',
      ...(options.headers || {}),
    },
  });
}

/**
 * File download response
 */
export function fileResponse(
  data: Blob | Uint8Array,
  filename: string,
  options: {
    contentType?: string;
    headers?: Record<string, string>;
  } = {}
): Response {
  return new Response(data, {
    headers: {
      'Content-Type': options.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      ...(options.headers || {}),
    },
  });
}

/**
 * Redirect response
 */
export function redirectResponse(
  url: string,
  status: 301 | 302 | 307 | 308 = 302
): Response {
  return new Response(null, {
    status,
    headers: {
      Location: url,
    },
  });
}

/**
 * No content response (204)
 */
export function noContentResponse(headers?: Record<string, string>): Response {
  return new Response(null, {
    status: 204,
    headers,
  });
}

/**
 * Log response for debugging
 */
export function logResponse(
  req: Request,
  response: Response,
  startTime: number
): void {
  const duration = Date.now() - startTime;
  const url = new URL(req.url);
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: url.pathname,
    status: response.status,
    duration: `${duration}ms`,
    userAgent: req.headers.get('User-Agent'),
  }));
}

// Export response utilities
export const response = {
  generateRequestId,
  buildCORSHeaders,
  buildResponseHeaders,
  successResponse,
  errorResponse,
  errors,
  paginatedResponse,
  handleCORS,
  parseBody,
  parseQueryParams,
  parsePagination,
  ResponseBuilder,
  streamingResponse,
  fileResponse,
  redirectResponse,
  noContentResponse,
  logResponse,
};

export default response;
