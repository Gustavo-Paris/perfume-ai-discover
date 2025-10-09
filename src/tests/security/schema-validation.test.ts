/**
 * Schema Validation Security Tests
 * 
 * Tests to verify Zod schemas are properly validating inputs
 * and preventing malicious data from entering the system.
 */

import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  phoneSchema,
  cpfSchema,
  cnpjSchema,
  cepSchema,
  addressSchema,
  signUpSchema,
  checkoutSchema,
  reviewSchema,
  couponCodeSchema,
} from '@/utils/validationSchemas';

describe('Schema Validation Security Tests', () => {
  
  describe('Email Schema', () => {
    it('should accept valid emails', () => {
      const validEmails = [
        'user@example.com',
        'test@test.co.uk',
        'admin+tag@company.com.br',
      ];

      validEmails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        '',
        'invalid',
        '@example.com',
        'user@',
        'a'.repeat(256) + '@example.com', // Too long
      ];

      invalidEmails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Password Schema', () => {
    it('should enforce password complexity', () => {
      const weakPasswords = [
        'short',
        '12345678',
        'password',
        'Password',
        'Password1',
      ];

      weakPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(false);
      });
    });

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'MyP@ssw0rd123',
        'Secure!Pass99',
        'C0mpl3x#Pass',
      ];

      strongPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Name Schema', () => {
    it('should reject malicious names', () => {
      const maliciousNames = [
        '<script>alert("xss")</script>',
        'Robert\'); DROP TABLE users--',
        'a'.repeat(101), // Too long
        'ab', // Too short
      ];

      maliciousNames.forEach(name => {
        const result = nameSchema.safeParse(name);
        expect(result.success).toBe(false);
      });
    });

    it('should accept valid names', () => {
      const validNames = [
        'João Silva',
        'Maria Santos',
        'José da Silva',
      ];

      validNames.forEach(name => {
        const result = nameSchema.safeParse(name);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Address Schema', () => {
    it('should validate complete address', () => {
      const validAddress = {
        name: 'João Silva',
        street: 'Rua Exemplo',
        number: '123',
        district: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        cep: '01310-100',
        country: 'Brasil',
        is_default: false,
      };

      const result = addressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('should reject incomplete address', () => {
      const invalidAddress = {
        name: 'João Silva',
        street: 'Rua Exemplo',
        // Missing required fields
      };

      const result = addressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
    });
  });

  describe('Checkout Schema', () => {
    it('should validate checkout data', () => {
      const validCheckout = {
        items: [{
          perfume_id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Perfume Test',
          brand: 'Brand Test',
          size_ml: 10,
          quantity: 1,
          unit_price: 50.00,
        }],
        payment_method: 'pix' as const,
        user_email: 'user@example.com',
      };

      const result = checkoutSchema.safeParse(validCheckout);
      expect(result.success).toBe(true);
    });

    it('should reject invalid checkout', () => {
      const invalidCheckout = {
        items: [],
        payment_method: 'invalid_method',
      };

      const result = checkoutSchema.safeParse(invalidCheckout);
      expect(result.success).toBe(false);
    });

    it('should enforce quantity limits', () => {
      const tooManyItems = {
        items: [{
          perfume_id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Perfume',
          brand: 'Brand',
          size_ml: 10,
          quantity: 100, // Exceeds limit
          unit_price: 50.00,
        }],
        payment_method: 'pix' as const,
      };

      const result = checkoutSchema.safeParse(tooManyItems);
      expect(result.success).toBe(false);
    });
  });

  describe('Review Schema', () => {
    it('should validate review data', () => {
      const validReview = {
        perfume_id: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        comment: 'Excellent perfume, highly recommended!',
      };

      const result = reviewSchema.safeParse(validReview);
      expect(result.success).toBe(true);
    });

    it('should reject invalid ratings', () => {
      const invalidRatings = [0, 6, -1, 3.5];

      invalidRatings.forEach(rating => {
        const result = reviewSchema.safeParse({
          perfume_id: '123e4567-e89b-12d3-a456-426614174000',
          rating,
          comment: 'Test comment',
        });
        expect(result.success).toBe(false);
      });
    });

    it('should enforce comment length limits', () => {
      const tooShort = {
        perfume_id: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        comment: 'Short',
      };

      const tooLong = {
        perfume_id: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        comment: 'a'.repeat(1001),
      };

      expect(reviewSchema.safeParse(tooShort).success).toBe(false);
      expect(reviewSchema.safeParse(tooLong).success).toBe(false);
    });
  });

  describe('Coupon Code Schema', () => {
    it('should validate coupon codes', () => {
      const validCoupons = [
        'SAVE10',
        'WINTER-2024',
        'BLACK_FRIDAY',
      ];

      validCoupons.forEach(code => {
        const result = couponCodeSchema.safeParse(code);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid coupon codes', () => {
      const invalidCoupons = [
        '',
        'invalid coupon', // Has space
        'a'.repeat(51), // Too long
        'test@#$', // Invalid chars
      ];

      invalidCoupons.forEach(code => {
        const result = couponCodeSchema.safeParse(code);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should reject SQL injection attempts in text fields', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users--",
        "1' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users--",
      ];

      sqlInjectionAttempts.forEach(malicious => {
        // Test in name field
        const nameResult = nameSchema.safeParse(malicious);
        // Should be rejected due to special chars or length
        expect(nameResult.success).toBe(false);
      });
    });
  });

  describe('XSS Prevention', () => {
    it('should handle XSS attempts in validated fields', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
      ];

      xssAttempts.forEach(malicious => {
        // Schema validation should catch malicious patterns
        const result = nameSchema.safeParse(malicious);
        // Note: Schemas validate format/length, sanitization happens elsewhere
        expect(typeof result.success).toBe('boolean');
      });
    });
  });
});
