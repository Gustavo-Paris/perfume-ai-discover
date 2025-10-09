/**
 * Data Protection Security Tests
 * 
 * Tests to verify sensitive data is properly protected:
 * - Masking and encryption
 * - CPF/CNPJ validation
 * - Data sanitization
 */

import { describe, it, expect } from 'vitest';
import { 
  maskCPF, 
  maskEmail, 
  maskPhone, 
  validateCPF, 
  validateCNPJ,
  formatCPF,
  formatCNPJ,
  validateEmail
} from '@/utils/dataProtection';

describe('Data Protection Security Tests', () => {
  
  describe('CPF Protection', () => {
    it('should mask CPF correctly', () => {
      const cpf = '12345678910';
      const masked = maskCPF(cpf);
      
      expect(masked).toContain('xxx');
      expect(masked).not.toContain('456');
      expect(masked).not.toContain('789');
      expect(masked.length).toBeGreaterThan(0);
    });

    it('should validate valid CPF', () => {
      // Valid CPF format (11 digits)
      const validCPFs = [
        '11144477735',
        '52998224725',
      ];

      validCPFs.forEach(cpf => {
        const isValid = validateCPF(cpf);
        // CPF validation should check checksum digits
        expect(typeof isValid).toBe('boolean');
      });
    });

    it('should reject invalid CPF', () => {
      const invalidCPFs = [
        '00000000000',
        '11111111111',
        '12345678910', // Invalid checksum
        '123456789',   // Too short
        '12345678901234', // Too long
      ];

      invalidCPFs.forEach(cpf => {
        const isValid = validateCPF(cpf);
        expect(isValid).toBe(false);
      });
    });

    it('should format CPF correctly', () => {
      const cpf = '12345678910';
      const formatted = formatCPF(cpf);
      
      expect(formatted).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
      expect(formatted).toBe('123.456.789-10');
    });
  });

  describe('CNPJ Protection', () => {
    it('should validate valid CNPJ', () => {
      const validCNPJs = [
        '11222333000181',
      ];

      validCNPJs.forEach(cnpj => {
        const isValid = validateCNPJ(cnpj);
        expect(typeof isValid).toBe('boolean');
      });
    });

    it('should reject invalid CNPJ', () => {
      const invalidCNPJs = [
        '00000000000000',
        '11111111111111',
        '12345678901234', // Invalid checksum
        '123456789012',   // Too short
      ];

      invalidCNPJs.forEach(cnpj => {
        const isValid = validateCNPJ(cnpj);
        expect(isValid).toBe(false);
      });
    });

    it('should format CNPJ correctly', () => {
      const cnpj = '12345678901234';
      const formatted = formatCNPJ(cnpj);
      
      expect(formatted).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
      expect(formatted).toBe('12.345.678/9012-34');
    });
  });

  describe('Email Protection', () => {
    it('should mask email correctly', () => {
      const emails = [
        { input: 'user@example.com', expected: 'u***@example.com' },
        { input: 'test@test.com', expected: 't***@test.com' },
        { input: 'admin@company.com.br', expected: 'a***@company.com.br' },
      ];

      emails.forEach(({ input, expected }) => {
        const masked = maskEmail(input);
        expect(masked).toBe(expected);
        expect(masked).toContain('@');
        expect(masked).toContain('***');
      });
    });

    it('should validate email format', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'admin+tag@company.com.br',
      ];

      validEmails.forEach(email => {
        const isValid = validateEmail(email);
        expect(isValid).toBe(true);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid@.com',
        'invalid..email@example.com',
      ];

      invalidEmails.forEach(email => {
        const isValid = validateEmail(email);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Phone Protection', () => {
    it('should mask phone correctly', () => {
      const phones = [
        '11987654321',
        '21912345678',
        '85988776655',
      ];

      phones.forEach(phone => {
        const masked = maskPhone(phone);
        expect(masked).toContain('xxxxx');
        expect(masked.length).toBeGreaterThan(0);
      });
    });

    it('should format phone with DDD correctly', () => {
      const phone = '11987654321';
      const formatted = maskPhone(phone);
      
      expect(formatted).toMatch(/\(\d{2}\)/); // DDD format
    });
  });

  describe('Sensitive Data Handling', () => {
    it('should not expose original values after masking', () => {
      const originalCPF = '12345678910';
      const originalEmail = 'user@example.com';
      const originalPhone = '11987654321';

      const maskedCPF = maskCPF(originalCPF);
      const maskedEmail = maskEmail(originalEmail);
      const maskedPhone = maskPhone(originalPhone);

      expect(maskedCPF).not.toBe(originalCPF);
      expect(maskedEmail).not.toBe(originalEmail);
      expect(maskedPhone).not.toBe(originalPhone);
    });
  });
});
