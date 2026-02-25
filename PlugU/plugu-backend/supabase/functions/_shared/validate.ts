/**
 * PlugU Validation Module
 * Shared validation utilities for Supabase Edge Functions
 * Provides input validation, sanitization, and schema validation
 */

// Validation result type
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationRule {
  field: string;
  rules: ValidationRuleConfig[];
}

export interface ValidationRuleConfig {
  type: 'required' | 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url' | 'uuid' | 'regex' | 'custom' | 'min' | 'max' | 'length' | 'enum' | 'oneOf';
  message?: string;
  params?: any;
  validator?: (value: any) => boolean;
}

// Email regex pattern (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// URL regex pattern
const URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// UUID regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Phone regex pattern (international)
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

// Username regex (alphanumeric, underscore, hyphen, 3-30 chars)
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

// Password regex (min 8 chars, at least 1 letter, 1 number, 1 special)
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

// Sanitization patterns
const XSS_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const HTML_TAG_PATTERN = /<[^>]*>/g;

/**
 * Validation class for building validation chains
 */
export class Validator {
  private errors: ValidationError[] = [];
  private fieldName: string;
  private value: any;
  private optional: boolean = false;

  constructor(fieldName: string, value: any) {
    this.fieldName = fieldName;
    this.value = value;
  }

  /**
   * Make field optional (skip validation if null/undefined)
   */
  isOptional(): this {
    this.optional = true;
    return this;
  }

  /**
   * Check if value exists
   */
  isRequired(message?: string): this {
    if (this.optional && (this.value === null || this.value === undefined)) {
      return this;
    }

    if (this.value === null || this.value === undefined || this.value === '') {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} is required`,
        code: 'REQUIRED',
        value: this.value,
      });
    }
    return this;
  }

  /**
   * Validate string type
   */
  isString(message?: string): this {
    if (this.shouldSkip()) return this;

    if (typeof this.value !== 'string') {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be a string`,
        code: 'INVALID_TYPE',
        value: this.value,
      });
    }
    return this;
  }

  /**
   * Validate number type
   */
  isNumber(message?: string, options: { integer?: boolean; min?: number; max?: number } = {}): this {
    if (this.shouldSkip()) return this;

    const num = Number(this.value);
    if (isNaN(num) || (options.integer && !Number.isInteger(num))) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be a ${options.integer ? 'whole ' : ''}number`,
        code: 'INVALID_TYPE',
        value: this.value,
      });
      return this;
    }

    if (options.min !== undefined && num < options.min) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be at least ${options.min}`,
        code: 'MIN_VALUE',
        value: this.value,
      });
    }

    if (options.max !== undefined && num > options.max) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be at most ${options.max}`,
        code: 'MAX_VALUE',
        value: this.value,
      });
    }

    return this;
  }

  /**
   * Validate boolean type
   */
  isBoolean(message?: string): this {
    if (this.shouldSkip()) return this;

    if (typeof this.value !== 'boolean') {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be a boolean`,
        code: 'INVALID_TYPE',
        value: this.value,
      });
    }
    return this;
  }

  /**
   * Validate array type
   */
  isArray(message?: string, options: { minLength?: number; maxLength?: number } = {}): this {
    if (this.shouldSkip()) return this;

    if (!Array.isArray(this.value)) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be an array`,
        code: 'INVALID_TYPE',
        value: this.value,
      });
      return this;
    }

    if (options.minLength !== undefined && this.value.length < options.minLength) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must have at least ${options.minLength} items`,
        code: 'MIN_LENGTH',
        value: this.value,
      });
    }

    if (options.maxLength !== undefined && this.value.length > options.maxLength) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must have at most ${options.maxLength} items`,
        code: 'MAX_LENGTH',
        value: this.value,
      });
    }

    return this;
  }

  /**
   * Validate object type
   */
  isObject(message?: string): this {
    if (this.shouldSkip()) return this;

    if (typeof this.value !== 'object' || this.value === null || Array.isArray(this.value)) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be an object`,
        code: 'INVALID_TYPE',
        value: this.value,
      });
    }
    return this;
  }

  /**
   * Validate email format
   */
  isEmail(message?: string): this {
    if (this.shouldSkip()) return this;

    if (!EMAIL_REGEX.test(this.value)) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be a valid email address`,
        code: 'INVALID_EMAIL',
        value: this.value,
      });
    }
    return this;
  }

  /**
   * Validate URL format
   */
  isURL(message?: string): this {
    if (this.shouldSkip()) return this;

    if (!URL_REGEX.test(this.value)) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be a valid URL`,
        code: 'INVALID_URL',
        value: this.value,
      });
    }
    return this;
  }

  /**
   * Validate UUID format
   */
  isUUID(message?: string): this {
    if (this.shouldSkip()) return this;

    if (!UUID_REGEX.test(this.value)) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be a valid UUID`,
        code: 'INVALID_UUID',
        value: this.value,
      });
    }
    return this;
  }

  /**
   * Validate phone number format
   */
  isPhone(message?: string): this {
    if (this.shouldSkip()) return this;

    // Remove common formatting characters
    const cleaned = String(this.value).replace(/[\s\-\(\)\.]/g, '');
    if (!PHONE_REGEX.test(cleaned)) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be a valid phone number`,
        code: 'INVALID_PHONE',
        value: this.value,
      });
    }
    return this;
  }

  /**
   * Validate username format
   */
  isUsername(message?: string): this {
    if (this.shouldSkip()) return this;

    if (!USERNAME_REGEX.test(this.value)) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be 3-30 characters, alphanumeric, underscore, or hyphen`,
        code: 'INVALID_USERNAME',
        value: this.value,
      });
    }
    return this;
  }

  /**
   * Validate password strength
   */
  isStrongPassword(message?: string): this {
    if (this.shouldSkip()) return this;

    if (!PASSWORD_REGEX.test(this.value)) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be at least 8 characters with 1 letter, 1 number, and 1 special character`,
        code: 'WEAK_PASSWORD',
        value: '***',
      });
    }
    return this;
  }

  /**
   * Validate minimum length
   */
  minLength(min: number, message?: string): this {
    if (this.shouldSkip()) return this;

    const length = typeof this.value === 'string' ? this.value.length : 
                   Array.isArray(this.value) ? this.value.length : 0;
    
    if (length < min) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be at least ${min} characters`,
        code: 'MIN_LENGTH',
        value: this.value,
      });
    }
    return this;
  }

  /**
   * Validate maximum length
   */
  maxLength(max: number, message?: string): this {
    if (this.shouldSkip()) return this;

    const length = typeof this.value === 'string' ? this.value.length : 
                   Array.isArray(this.value) ? this.value.length : 0;
    
    if (length > max) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be at most ${max} characters`,
        code: 'MAX_LENGTH',
        value: this.value,
      });
    }
    return this;
  }

  /**
   * Validate exact length
   */
  length(exact: number, message?: string): this {
    if (this.shouldSkip()) return this;

    const length = typeof this.value === 'string' ? this.value.length : 
                   Array.isArray(this.value) ? this.value.length : 0;
    
    if (length !== exact) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be exactly ${exact} characters`,
        code: 'EXACT_LENGTH',
        value: this.value,
      });
    }
    return this;
  }

  /**
   * Validate enum values
   */
  isIn(values: any[], message?: string): this {
    if (this.shouldSkip()) return this;

    if (!values.includes(this.value)) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} must be one of: ${values.join(', ')}`,
        code: 'INVALID_VALUE',
        value: this.value,
      });
    }
    return this;
  }

  /**
   * Validate with custom regex
   */
  matches(pattern: RegExp, message?: string): this {
    if (this.shouldSkip()) return this;

    if (!pattern.test(this.value)) {
      this.errors.push({
        field: this.fieldName,
        message: message || `${this.fieldName} format is invalid`,
        code: 'PATTERN_MISMATCH',
        value: this.value,
      });
    }
    return this;
  }

  /**
   * Custom validation function
   */
  custom(validator: (value: any) => boolean | string, message?: string): this {
    if (this.shouldSkip()) return this;

    const result = validator(this.value);
    if (result !== true) {
      this.errors.push({
        field: this.fieldName,
        message: typeof result === 'string' ? result : (message || `${this.fieldName} is invalid`),
        code: 'CUSTOM_VALIDATION',
        value: this.value,
      });
    }
    return this;
  }

  /**
   * Check if validation should be skipped
   */
  private shouldSkip(): boolean {
    return this.optional && (this.value === null || this.value === undefined);
  }

  /**
   * Get validation errors
   */
  getErrors(): ValidationError[] {
    return this.errors;
  }

  /**
   * Check if validation passed
   */
  isValid(): boolean {
    return this.errors.length === 0;
  }
}

/**
 * Schema validator for validating object structures
 */
export class SchemaValidator {
  private schema: Record<string, (validator: Validator) => Validator>;

  constructor(schema: Record<string, (validator: Validator) => Validator>) {
    this.schema = schema;
  }

  /**
   * Validate data against schema
   */
  validate(data: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [field, validatorFn] of Object.entries(this.schema)) {
      const validator = new Validator(field, data[field]);
      validatorFn(validator);
      errors.push(...validator.getErrors());
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Sanitization utilities
 */
export const sanitize = {
  /**
   * Remove HTML tags from string
   */
  stripHtml(input: string): string {
    return input.replace(HTML_TAG_PATTERN, '');
  },

  /**
   * Remove script tags and event handlers
   */
  stripScripts(input: string): string {
    return input
      .replace(XSS_PATTERN, '')
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  },

  /**
   * Escape HTML special characters
   */
  escapeHtml(input: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return input.replace(/[&<>"'\/]/g, (char) => htmlEscapes[char]);
  },

  /**
   * Trim whitespace
   */
  trim(input: string): string {
    return input.trim();
  },

  /**
   * Normalize whitespace
   */
  normalizeWhitespace(input: string): string {
    return input.replace(/\s+/g, ' ').trim();
  },

  /**
   * Remove non-numeric characters
   */
  numericOnly(input: string): string {
    return input.replace(/[^0-9]/g, '');
  },

  /**
   * Clean phone number
   */
  phone(input: string): string {
    return input.replace(/[\s\-\(\)\.]/g, '');
  },

  /**
   * Sanitize object recursively
   */
  object<T extends Record<string, any>>(
    obj: T,
    options: {
      stripHtml?: boolean;
      trim?: boolean;
      allowedFields?: string[];
    } = {}
  ): T {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip non-allowed fields
      if (options.allowedFields && !options.allowedFields.includes(key)) {
        continue;
      }

      if (typeof value === 'string') {
        let sanitized = value;
        if (options.stripHtml) {
          sanitized = sanitize.stripHtml(sanitized);
        }
        if (options.trim) {
          sanitized = sanitize.trim(sanitized);
        }
        result[key] = sanitized;
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = sanitize.object(value, options);
      } else {
        result[key] = value;
      }
    }

    return result as T;
  },
};

/**
 * Convenience function to create validator
 */
export function validate(fieldName: string, value: any): Validator {
  return new Validator(fieldName, value);
}

/**
 * Validate multiple fields at once
 */
export function validateAll(
  validations: Array<{ field: string; value: any; rules: (v: Validator) => Validator }>
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const { field, value, rules } of validations) {
    const validator = new Validator(field, value);
    rules(validator);
    errors.push(...validator.getErrors());
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Common validation schemas
 */
export const schemas = {
  /**
   * User registration schema
   */
  userRegistration: new SchemaValidator({
    email: (v) => v.isRequired().isString().isEmail(),
    password: (v) => v.isRequired().isString().isStrongPassword(),
    username: (v) => v.isRequired().isString().isUsername(),
    displayName: (v) => v.isOptional().isString().maxLength(100),
  }),

  /**
   * Login schema
   */
  login: new SchemaValidator({
    email: (v) => v.isRequired().isString().isEmail(),
    password: (v) => v.isRequired().isString().minLength(6),
  }),

  /**
   * Post creation schema
   */
  createPost: new SchemaValidator({
    content: (v) => v.isRequired().isString().minLength(1).maxLength(5000),
    mediaUrls: (v) => v.isOptional().isArray({}, { maxLength: 10 }),
    location: (v) => v.isOptional().isString().maxLength(255),
    tagIds: (v) => v.isOptional().isArray({}, { maxLength: 10 }),
  }),

  /**
   * Comment creation schema
   */
  createComment: new SchemaValidator({
    postId: (v) => v.isRequired().isString().isUUID(),
    content: (v) => v.isRequired().isString().minLength(1).maxLength(2000),
    parentId: (v) => v.isOptional().isString().isUUID(),
  }),

  /**
   * Listing creation schema
   */
  createListing: new SchemaValidator({
    title: (v) => v.isRequired().isString().minLength(3).maxLength(255),
    description: (v) => v.isRequired().isString().minLength(10).maxLength(5000),
    price: (v) => v.isOptional().isNumber({}, { min: 0 }),
    category: (v) => v.isRequired().isString().maxLength(100),
    condition: (v) => v.isOptional().isIn(['new', 'like_new', 'good', 'fair', 'poor']),
    images: (v) => v.isOptional().isArray({}, { maxLength: 20 }),
    location: (v) => v.isOptional().isString().maxLength(255),
  }),

  /**
   * Message creation schema
   */
  createMessage: new SchemaValidator({
    conversationId: (v) => v.isRequired().isString().isUUID(),
    content: (v) => v.isRequired().isString().minLength(1).maxLength(4000),
    mediaUrls: (v) => v.isOptional().isArray({}, { maxLength: 10 }),
    replyToId: (v) => v.isOptional().isString().isUUID(),
  }),

  /**
   * Pagination schema
   */
  pagination: new SchemaValidator({
    page: (v) => v.isOptional().isNumber({ integer: true, min: 1 }),
    limit: (v) => v.isOptional().isNumber({ integer: true, min: 1, max: 100 }),
    cursor: (v) => v.isOptional().isString(),
  }),
};

// Export validation utilities
export const validation = {
  Validator,
  SchemaValidator,
  validate,
  validateAll,
  sanitize,
  schemas,
  // Regex patterns for external use
  patterns: {
    EMAIL: EMAIL_REGEX,
    URL: URL_REGEX,
    UUID: UUID_REGEX,
    PHONE: PHONE_REGEX,
    USERNAME: USERNAME_REGEX,
    PASSWORD: PASSWORD_REGEX,
  },
};

export default validation;
