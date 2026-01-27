import bcrypt from 'bcrypt';
import { config } from '@/config/env';

export class PasswordService {
  /**
   * Hash password using bcrypt
   * @param password - plain password
   * @returns password hash
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10; // number of rounds (higher = more secure, but slower)
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   * @param password - plain password
   * @param hash - password hash
   * @returns true if password matches
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password requirements
   * @param password - password to check
   * @returns object with result and errors
   */
  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Minimum length
    if (password.length < config.passwordMinLength) {
      errors.push(`Password must be at least ${config.passwordMinLength} characters long`);
    }

    // Uppercase letters
    if (config.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Numbers
    if (config.passwordRequireNumber && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Special characters
    if (config.passwordRequireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*...)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
