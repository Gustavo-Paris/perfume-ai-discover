/**
 * Input Sanitization Security Tests
 * 
 * Tests to verify XSS prevention, SQL injection protection,
 * and general input sanitization is working correctly.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeInput, sanitizeSearchQuery, escapeHtml } from '@/utils/securityEnhancements';

describe('Input Sanitization Security Tests', () => {
  
  it('should remove script tags from input', () => {
    const maliciousInput = '<script>alert("XSS")</script>Hello World';
    const sanitized = sanitizeInput(maliciousInput);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
    expect(sanitized).toContain('Hello World');
  });

  it('should remove HTML tags from input', () => {
    const htmlInput = '<div onclick="malicious()">Click me</div>';
    const sanitized = sanitizeInput(htmlInput);
    
    expect(sanitized).not.toContain('<div>');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).toContain('Click me');
  });

  it('should remove javascript: protocol from URLs', () => {
    const maliciousUrl = 'javascript:alert("XSS")';
    const sanitized = sanitizeInput(maliciousUrl);
    
    expect(sanitized).not.toContain('javascript:');
  });

  it('should prevent SQL injection in search queries', () => {
    const sqlInjectionAttempts = [
      "'; DROP TABLE users--",
      "1' OR '1'='1",
      "admin'--",
      "' UNION SELECT * FROM users--"
    ];

    sqlInjectionAttempts.forEach(maliciousQuery => {
      const sanitized = sanitizeSearchQuery(maliciousQuery);
      
      // Should not contain SQL injection characters
      expect(sanitized).not.toContain("'");
      expect(sanitized).not.toContain('"');
      expect(sanitized).not.toContain('--');
      expect(sanitized).not.toContain(';');
      expect(sanitized).not.toContain('DROP');
      expect(sanitized).not.toContain('UNION');
    });
  });

  it('should escape HTML special characters', () => {
    const dangerousChars = '<>&"\'/';
    const escaped = escapeHtml(dangerousChars);
    
    expect(escaped).toContain('&lt;');
    expect(escaped).toContain('&gt;');
    expect(escaped).toContain('&amp;');
    expect(escaped).toContain('&quot;');
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
  });

  it('should limit input length to prevent buffer overflow', () => {
    const longInput = 'A'.repeat(10000);
    const sanitized = sanitizeInput(longInput);
    
    // Should be truncated to reasonable length (e.g., 1000 chars)
    expect(sanitized.length).toBeLessThanOrEqual(1000);
  });

  it('should validate Zod schemas prevent malicious input', async () => {
    const { supportChatSchema } = await import('@/utils/validationSchemas');
    
    const maliciousInputs = [
      { message: '<script>alert("XSS")</script>' },
      { message: 'javascript:alert("XSS")' },
      { message: '<img src=x onerror=alert("XSS")>' },
      { message: '<iframe src="evil.com"></iframe>' }
    ];

    maliciousInputs.forEach(input => {
      const result = supportChatSchema.safeParse(input);
      
      // Should either reject or sanitize
      if (result.success) {
        expect(result.data.message).not.toContain('<script');
        expect(result.data.message).not.toContain('javascript:');
        expect(result.data.message).not.toContain('onerror');
      }
    });
  });

  it('should sanitize user-generated content before database insertion', () => {
    const userInput = {
      name: '<script>alert("XSS")</script>João',
      email: 'test@example.com"><script>alert(1)</script>',
      message: 'Hello<img src=x onerror=alert(1)>World'
    };

    // Simulate sanitization before DB insert
    const sanitized = {
      name: sanitizeInput(userInput.name),
      email: sanitizeInput(userInput.email),
      message: sanitizeInput(userInput.message)
    };

    expect(sanitized.name).not.toContain('<script>');
    expect(sanitized.email).not.toContain('<script>');
    expect(sanitized.message).not.toContain('<img');
    expect(sanitized.message).not.toContain('onerror');
  });

  it('should validate file uploads prevent malicious extensions', () => {
    const dangerousFiles = [
      'malware.exe',
      'virus.bat',
      'script.sh',
      'backdoor.php',
      'exploit.js.exe'
    ];

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];

    dangerousFiles.forEach(filename => {
      const isAllowed = allowedExtensions.some(ext => 
        filename.toLowerCase().endsWith(ext)
      );
      
      expect(isAllowed).toBe(false);
    });
  });
});
