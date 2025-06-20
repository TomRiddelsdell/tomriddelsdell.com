import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  usernameSchema,
  signUpSchema,
  signInSchema,
  contactFormSchema
} from '../../../domains/shared-kernel/src/validation';

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should accept valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];
      
      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user name@domain.com'
      ];
      
      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow();
      });
    });
  });

  describe('passwordSchema', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'password123',
        'SecurePass1!',
        'longerpassword'
      ];
      
      validPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).not.toThrow();
      });
    });

    it('should reject invalid passwords', () => {
      const invalidPasswords = [
        'short',
        '',
        'a'.repeat(129) // Too long
      ];
      
      invalidPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).toThrow();
      });
    });
  });

  describe('usernameSchema', () => {
    it('should accept valid usernames', () => {
      const validUsernames = [
        'user123',
        'test_user',
        'user-name'
      ];
      
      validUsernames.forEach(username => {
        expect(() => usernameSchema.parse(username)).not.toThrow();
      });
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        'ab', // Too short
        'user name', // Contains space
        'user@name', // Contains @
        'a'.repeat(51) // Too long
      ];
      
      invalidUsernames.forEach(username => {
        expect(() => usernameSchema.parse(username)).toThrow();
      });
    });
  });

  describe('signUpSchema', () => {
    it('should accept valid signup data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        displayName: 'Test User'
      };
      
      expect(() => signUpSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid signup data', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'short'
      };
      
      expect(() => signUpSchema.parse(invalidData)).toThrow();
    });
  });

  describe('contactFormSchema', () => {
    it('should accept valid contact form data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message that is long enough.'
      };
      
      expect(() => contactFormSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid contact form data', () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        message: 'Short'
      };
      
      expect(() => contactFormSchema.parse(invalidData)).toThrow();
    });
  });
});