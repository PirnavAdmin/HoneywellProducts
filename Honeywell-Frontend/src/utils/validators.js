/**
 * Enterprise Validation Engine for Honeywell Products Portal
 * Comprehensive, dynamic, strict validation rules for Email, Password, Name, Mobile, and Employee ID.
 */

// Strict RFC 5322-compliant email regex ensuring valid domain structure and TLD of at least 2 chars
export const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

// Standard Indian mobile number regex (10 digits starting with 6, 7, 8, or 9)
export const MOBILE_REGEX = /^[6-9]\d{9}$/;

// Human name regex: letters, single spaces between words, hyphens, and apostrophes (min 2, max 50)
export const NAME_REGEX = /^[a-zA-Z]+(?:[' -][a-zA-Z]+)*$/;

// Corporate Employee / Staff ID: 3-15 chars, alphanumeric with optional hyphens/underscores, must include both letters and digits
export const EMPLOYEE_ID_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9_-]{3,15}$/;

/**
 * Validates human name / full name / contact person
 * Rejects keyboard mashing (e.g., 'gjghgjjfhhfhddhdhgfhdd'), numbers, and invalid symbols
 */
export const validateName = (name, fieldLabel = 'Full Name') => {
  const val = (name ?? '').trim();
  if (!val) {
    return `${fieldLabel} is required.`;
  }
  if (val.length < 2) {
    return `${fieldLabel} must be at least 2 characters long.`;
  }
  if (val.length > 50) {
    return `${fieldLabel} cannot exceed 50 characters.`;
  }
  if (!NAME_REGEX.test(val)) {
    return `${fieldLabel} must contain only letters and single spaces (e.g. John Doe). Numbers and special characters are not permitted.`;
  }
  // Check for consecutive repetitive characters like 'aaaaa'
  if (/(.)\1{3,}/i.test(val)) {
    return `${fieldLabel} contains unnatural repetitive characters.`;
  }
  // Check for gibberish keyboard mashing: words longer than 4 chars with no vowels
  const words = val.split(/[\s-]+/);
  for (const word of words) {
    if (word.length >= 5 && !/[aeiouyAEIOUY]/.test(word)) {
      return `Please enter a valid ${fieldLabel.toLowerCase()} (e.g. Suresh Kumar).`;
    }
  }
  return '';
};

/**
 * Validates email address with strict format, TLD, and anti-garbage checks
 * Rejects invalid formats like 'gjghgjjfhhfhddhdhgfhdd', 'jkhhkkhkh@ggghjghkh,com', etc.
 */
export const validateEmail = (email, fieldLabel = 'Email address') => {
  const val = (email ?? '').trim();
  if (!val) {
    return `${fieldLabel} is required.`;
  }
  if (val.includes(' ')) {
    return `${fieldLabel} cannot contain spaces.`;
  }
  if (val.includes(',')) {
    return `${fieldLabel} cannot contain commas. Use a dot (.) before the domain extension (e.g. .com).`;
  }
  if (!val.includes('@')) {
    return `Please enter a valid ${fieldLabel.toLowerCase()} containing an '@' sign.`;
  }
  const parts = val.split('@');
  if (parts.length !== 2) {
    return `Please enter a valid ${fieldLabel.toLowerCase()} with only one '@' symbol.`;
  }
  const [localPart, domainPart] = parts;
  if (!localPart) {
    return `The username portion before '@' is missing.`;
  }
  if (!domainPart) {
    return `The domain portion after '@' is missing (e.g. honeywell.com).`;
  }
  if (val.includes('..')) {
    return `${fieldLabel} cannot contain consecutive dots ('..').`;
  }
  if (!domainPart.includes('.')) {
    return `The domain portion must include a valid extension like .com, .in, or .org.`;
  }
  const domainParts = domainPart.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return `The domain extension (TLD) must be at least 2 letters (e.g. .com, .org, .net, .in).`;
  }
  if (!STRICT_EMAIL_REGEX.test(val)) {
    return `Please enter a valid ${fieldLabel.toLowerCase()} (e.g. name@honeywell.com).`;
  }
  return '';
};

/**
 * Validates strict enterprise password
 * Requires:
 *  - Minimum 8 characters
 *  - At least 1 uppercase letter (A-Z)
 *  - At least 1 lowercase letter (a-z)
 *  - At least 1 numeric digit (0-9)
 *  - At least 1 special character (!@#$%^&*...)
 *  - No spaces
 */
export const validatePassword = (password, fieldLabel = 'Password') => {
  const val = password ?? '';
  if (!val) {
    return `${fieldLabel} is required.`;
  }
  if (val.trim().length === 0) {
    return `${fieldLabel} cannot consist solely of whitespace.`;
  }
  if (val.length < 8) {
    return `${fieldLabel} must be at least 8 characters long.`;
  }
  if (val.length > 64) {
    return `${fieldLabel} cannot exceed 64 characters.`;
  }
  if (/\s/.test(val)) {
    return `${fieldLabel} cannot contain spaces.`;
  }

  const hasUpper = /[A-Z]/.test(val);
  const hasLower = /[a-z]/.test(val);
  const hasDigit = /[0-9]/.test(val);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(val);

  const missingRules = [];
  if (!hasUpper) missingRules.push('one uppercase letter (A-Z)');
  if (!hasLower) missingRules.push('one lowercase letter (a-z)');
  if (!hasDigit) missingRules.push('one number (0-9)');
  if (!hasSpecial) missingRules.push('one special character (!@#$%^&*)');

  if (missingRules.length > 0) {
    return `${fieldLabel} must contain at least ${missingRules.join(', ')}.`;
  }

  // Reject repeating single characters like 'AAAAAAAA'
  if (/^(.)\1+$/.test(val)) {
    return `${fieldLabel} cannot be repetitive identical characters.`;
  }

  return '';
};

/**
 * Validates confirm password matches password
 */
export const validateConfirmPassword = (password, confirmPassword, fieldLabel = 'Confirm password') => {
  if (!confirmPassword) {
    return `${fieldLabel} is required.`;
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return '';
};

/**
 * Validates 10-digit Indian mobile number
 */
export const validatePhone = (phone, fieldLabel = 'Mobile number') => {
  const raw = (phone ?? '').toString().trim();
  if (!raw) {
    return `${fieldLabel} is required.`;
  }
  const clean = raw.replace(/\D/g, '');
  if (clean.length !== 10) {
    return `${fieldLabel} must be exactly 10 digits.`;
  }
  if (!MOBILE_REGEX.test(clean)) {
    return `${fieldLabel} must begin with 6, 7, 8, or 9 (e.g. 9876543210).`;
  }
  if (/^(\d)\1{9}$/.test(clean)) {
    return `${fieldLabel} cannot be repetitive identical digits.`;
  }
  return '';
};

/**
 * Validates Staff / Employee ID
 */
export const validateEmployeeId = (id, fieldLabel = 'Employee ID') => {
  const val = (id ?? '').trim();
  if (!val) {
    return `${fieldLabel} is required.`;
  }
  if (val.length < 3 || val.length > 15) {
    return `${fieldLabel} must be between 3 and 15 characters long.`;
  }
  if (!/^[A-Za-z0-9_-]+$/.test(val)) {
    return `${fieldLabel} must only contain letters, numbers, hyphens, and underscores.`;
  }
  if (!/[A-Za-z]/.test(val) || !/\d/.test(val)) {
    return `${fieldLabel} must contain both letters and digits (e.g. EMP-101 or HON001).`;
  }
  return '';
};

/**
 * Validates a dual-purpose input that accepts either Email or Mobile Number
 * Used in customer portals and modal sign-ins
 */
export const validateEmailOrPhone = (value, fieldLabel = 'Email or Mobile number') => {
  const val = (value ?? '').trim();
  if (!val) {
    return `${fieldLabel} is required.`;
  }

  // If it contains letters or @, validate as email
  if (/[a-zA-Z@]/.test(val)) {
    return validateEmail(val, 'Email address');
  }

  // Otherwise validate as mobile number
  const cleanDigits = val.replace(/\D/g, '');
  if (cleanDigits.length === 10 || val.startsWith('+')) {
    return validatePhone(cleanDigits, 'Mobile number');
  }

  return 'Please enter a valid email address (e.g. name@honeywell.com) or a 10-digit mobile number.';
};

/**
 * Basic required validator
 */
export const validateRequired = (val, fieldLabel) => {
  const str = (val ?? '').toString().trim();
  if (!str) {
    return `${fieldLabel} is required.`;
  }
  return '';
};

// Convenience boolean checks
export const isValidEmail = (email) => validateEmail(email) === '';
export const isValidPassword = (password) => validatePassword(password) === '';
export const isValidName = (name) => validateName(name) === '';
export const isValidPhone = (phone) => validatePhone(phone) === '';
export const isValidEmployeeId = (id) => validateEmployeeId(id) === '';
