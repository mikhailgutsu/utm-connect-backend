// src/services/PasswordService.ts
import bcrypt from 'bcrypt';
import { config } from '@/config/env';

export class PasswordService {
  /**
   * Хеширует пароль с использованием bcrypt
   * @param password - открытый пароль
   * @returns хеш пароля
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10; // количество раундов (выше = безопаснее, но медленнее)
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Проверяет пароль против хеша
   * @param password - открытый пароль
   * @param hash - хеш пароля
   * @returns true если пароль совпадает
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Валидирует требования к паролю
   * @param password - пароль для проверки
   * @returns объект с результатом и ошибками
   */
  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Минимальная длина
    if (password.length < config.passwordMinLength) {
      errors.push(`Password must be at least ${config.passwordMinLength} characters long`);
    }

    // Заглавные буквы
    if (config.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Цифры
    if (config.passwordRequireNumber && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Специальные символы
    if (config.passwordRequireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*...)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
