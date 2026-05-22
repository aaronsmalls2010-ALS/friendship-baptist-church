/**
 * Password strength validation utilities.
 *
 * Enforces strong password policies and provides user-friendly
 * feedback for improving password strength.
 */

export interface PasswordStrength {
  /** Strength score from 0 (weakest) to 4 (strongest) */
  score: number;
  /** Human-readable strength label */
  label: 'weak' | 'fair' | 'strong' | 'excellent';
  /** Suggestions for improving password strength */
  suggestions: string[];
  /** Whether the password meets minimum requirements */
  isValid: boolean;
}

/**
 * Human-readable descriptions of password requirements.
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 'Must be at least 12 characters long',
  uppercase: 'Must contain at least one uppercase letter (A-Z)',
  lowercase: 'Must contain at least one lowercase letter (a-z)',
  number: 'Must contain at least one number (0-9)',
  specialChar: 'Must contain at least one special character (!@#$%^&*...)',
  notCommon: 'Must not be a commonly used password',
} as const;

/**
 * List of commonly used passwords that should be rejected.
 * This is a representative subset — in production, consider using
 * a larger dictionary or the Have I Been Pwned API.
 */
const COMMON_PASSWORDS: readonly string[] = [
  'password',
  'password1',
  'password12',
  'password123',
  'password1234',
  'password12345',
  'password123456',
  '123456',
  '1234567',
  '12345678',
  '123456789',
  '1234567890',
  '12345678910',
  'qwerty',
  'qwerty123',
  'qwertyuiop',
  'abc123',
  'abcdef',
  'abcdefg',
  'abcdefgh',
  'letmein',
  'welcome',
  'welcome1',
  'welcome123',
  'monkey',
  'dragon',
  'master',
  'login',
  'admin',
  'admin123',
  'administrator',
  'iloveyou',
  'trustno1',
  'sunshine',
  'princess',
  'football',
  'baseball',
  'soccer',
  'hockey',
  'batman',
  'shadow',
  'michael',
  'jennifer',
  'jessica',
  'ashley',
  'robert',
  'daniel',
  'thomas',
  'charlie',
  'andrew',
  'joshua',
  'william',
  'matthew',
  'superman',
  'starwars',
  'passw0rd',
  'p@ssword',
  'p@ssw0rd',
  'pass1234',
  'passwd',
  'changeme',
  'changeme1',
  'default',
  'guest',
  'access',
  'hello',
  'hello123',
  'secret',
  'nothing',
  'computer',
  'internet',
  'google',
  'facebook',
  'twitter',
  'linkedin',
  'cheese',
  'pepper',
  'ginger',
  'summer',
  'winter',
  'spring',
  'autumn',
  'mustang',
  'corvette',
  'ferrari',
  'porsche',
  'mercedes',
  'freedom',
  'america',
  'diamond',
  'forever',
  'thunder',
  'phoenix',
  'jordan23',
  'hunter',
  'hunter2',
  'killer',
  'zaq1zaq1',
  'qazwsx',
  'asdfgh',
  'zxcvbn',
  'flower',
  'love',
  'lucky',
  'test',
  'test123',
  'test1234',
];

/**
 * Check if a string contains sequential characters (e.g., "abc", "123", "cba").
 */
function hasSequentialChars(str: string, length: number = 3): boolean {
  const lower = str.toLowerCase();
  for (let i = 0; i <= lower.length - length; i++) {
    let isAscending = true;
    let isDescending = true;
    for (let j = 1; j < length; j++) {
      if (lower.charCodeAt(i + j) !== lower.charCodeAt(i + j - 1) + 1) {
        isAscending = false;
      }
      if (lower.charCodeAt(i + j) !== lower.charCodeAt(i + j - 1) - 1) {
        isDescending = false;
      }
    }
    if (isAscending || isDescending) return true;
  }
  return false;
}

/**
 * Check if a string contains repeated characters (e.g., "aaa", "111").
 */
function hasRepeatedChars(str: string, length: number = 3): boolean {
  for (let i = 0; i <= str.length - length; i++) {
    const char = str[i];
    let repeated = true;
    for (let j = 1; j < length; j++) {
      if (str[i + j] !== char) {
        repeated = false;
        break;
      }
    }
    if (repeated) return true;
  }
  return false;
}

/**
 * Validate a password and return its strength assessment.
 *
 * Scoring criteria (0-4):
 * - Meets minimum length (12 chars): +1
 * - Has character variety (upper, lower, number, special): +1
 * - Length 16+ characters: +1
 * - No common patterns (sequential, repeated, dictionary): +1
 *
 * A password is considered valid (isValid: true) only if it meets
 * all base requirements: 12+ chars, uppercase, lowercase, number,
 * special character, and is not a common password.
 */
export function validatePassword(password: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;

  if (!password || typeof password !== 'string') {
    return {
      score: 0,
      label: 'weak',
      suggestions: ['Please enter a password.'],
      isValid: false,
    };
  }

  // --- Base requirement checks ---
  const hasMinLength = password.length >= 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isCommon = COMMON_PASSWORDS.includes(password.toLowerCase());

  // Build suggestions for missing requirements
  if (!hasMinLength) {
    suggestions.push(PASSWORD_REQUIREMENTS.minLength);
  }
  if (!hasUppercase) {
    suggestions.push(PASSWORD_REQUIREMENTS.uppercase);
  }
  if (!hasLowercase) {
    suggestions.push(PASSWORD_REQUIREMENTS.lowercase);
  }
  if (!hasNumber) {
    suggestions.push(PASSWORD_REQUIREMENTS.number);
  }
  if (!hasSpecial) {
    suggestions.push(PASSWORD_REQUIREMENTS.specialChar);
  }
  if (isCommon) {
    suggestions.push(PASSWORD_REQUIREMENTS.notCommon);
  }

  // All base requirements must be met for validity
  const isValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    !isCommon;

  // --- Scoring ---

  // Score 1: Meets minimum length
  if (hasMinLength) {
    score += 1;
  }

  // Score 2: Has character variety (at least 3 of 4 categories)
  const varietyCount = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(
    Boolean
  ).length;
  if (varietyCount >= 3) {
    score += 1;
  }

  // Score 3: Extended length (16+ characters)
  if (password.length >= 16) {
    score += 1;
  } else if (password.length < 16) {
    suggestions.push('Consider using 16 or more characters for added security.');
  }

  // Score 4: No common patterns
  const hasSequential = hasSequentialChars(password, 4);
  const hasRepeated = hasRepeatedChars(password, 3);

  if (!isCommon && !hasSequential && !hasRepeated) {
    score += 1;
  } else {
    if (hasSequential) {
      suggestions.push(
        'Avoid sequential characters like "abcd" or "1234".'
      );
    }
    if (hasRepeated) {
      suggestions.push(
        'Avoid repeated characters like "aaa" or "111".'
      );
    }
  }

  // Determine label from score
  const labels: Record<number, PasswordStrength['label']> = {
    0: 'weak',
    1: 'weak',
    2: 'fair',
    3: 'strong',
    4: 'excellent',
  };

  return {
    score,
    label: labels[score] ?? 'weak',
    suggestions,
    isValid,
  };
}
