/**
 * Enterprise Validation Engine for Honeywell Products Portal
 * Comprehensive, dynamic, strict validation rules for Email, Password, Name, Mobile, and Employee ID.
 */

// Strict RFC 5322-compliant email regex ensuring valid domain structure and TLD of 2-10 chars
export const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,10})+$/;

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

// Recognized common valid TLDs
export const COMMON_VALID_TLDS = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'info', 'biz', 'name', 'pro',
  'in', 'co', 'io', 'ai', 'me', 'tv', 'cc', 'us', 'uk', 'ca', 'au', 'de', 'fr',
  'jp', 'cn', 'ru', 'br', 'za', 'mx', 'ch', 'se', 'nl', 'es', 'it', 'eu', 'sg',
  'nz', 'app', 'dev', 'tech', 'online', 'store', 'site', 'club', 'global', 'agency',
  'cloud', 'digital', 'design', 'email', 'expert', 'group', 'media', 'network',
  'services', 'solutions', 'support', 'systems', 'team', 'today', 'website', 'world',
  'zone', 'live', 'life', 'space', 'asia', 'mobi', 'tel', 'travel', 'jobs', 'aero',
  'coop', 'museum', 'corp', 'internal', 'local', 'honeywell'
]);

// Known email providers and their exact valid domain suffixes
export const POPULAR_PROVIDERS = {
  gmail: ['gmail.com'],
  yahoo: ['yahoo.com', 'yahoo.in', 'yahoo.co.in', 'yahoo.co.uk', 'ymail.com'],
  outlook: ['outlook.com', 'outlook.in', 'hotmail.com', 'live.com', 'msn.com'],
  hotmail: ['hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'live.com'],
  icloud: ['icloud.com', 'me.com', 'mac.com']
};

/**
 * Validates email address with strict format, TLD, and anti-garbage checks
 * Rejects invalid formats like 'xyz@gmail.commmmmmmmmmmmmm', 'jkhhkkhkh@ggghjghkh,com', etc.
 */
export const validateEmail = (email, fieldLabel = 'Email address') => {
  const val = (email ?? '').trim();
  if (!val) {
    return `${fieldLabel} is required.`;
  }
  if (val.length > 254) {
    return `${fieldLabel} is too long (maximum 254 characters).`;
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
  if (localPart.length > 64) {
    return `The username portion before '@' cannot exceed 64 characters.`;
  }
  if (!domainPart) {
    return `The domain portion after '@' is missing (e.g. honeywell.com).`;
  }
  if (val.includes('..')) {
    return `${fieldLabel} cannot contain consecutive dots ('..').`;
  }
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return `The username portion before '@' cannot start or end with a dot.`;
  }
  if (localPart.startsWith('-') || localPart.endsWith('-')) {
    return `The username portion before '@' cannot start or end with a hyphen.`;
  }

  // Reject local part repetitive characters (e.g. aaaaaaaa@...)
  if (/^(.)\1{5,}$/.test(localPart)) {
    return `The username portion before '@' contains invalid repetitive characters.`;
  }

  if (!domainPart.includes('.')) {
    return `The domain portion must include a valid extension like .com, .in, or .org.`;
  }

  const domainParts = domainPart.split('.');
  const tld = domainParts[domainParts.length - 1].toLowerCase();

  // TLD must be purely alphabetic, between 2 and 10 characters
  if (!/^[a-zA-Z]{2,10}$/.test(tld)) {
    return `The domain extension (.${tld}) is invalid. Extension must be 2 to 10 letters (e.g. .com, .org, .in).`;
  }

  // Reject repetitive characters in TLD (e.g. .commmmmm, .coooom, .aaa)
  if (/(.)\1{2,}/i.test(tld)) {
    return `The domain extension (.${tld}) is invalid and contains repetitive letters. Did you mean .com?`;
  }

  // Common typo extensions for .com
  const typoComExtensions = ['comm', 'commm', 'coom', 'con', 'cpm', 'xom', 'vom', 'comn', 'coi', 'coim'];
  if (typoComExtensions.includes(tld)) {
    return `The domain extension '.${tld}' appears to be a typo for '.com'. Please verify your email.`;
  }

  // Check domain labels (each sub-part of domain)
  for (let i = 0; i < domainParts.length; i++) {
    const part = domainParts[i];
    if (!part) {
      return `Domain cannot have empty segments between dots.`;
    }
    if (part.startsWith('-') || part.endsWith('-')) {
      return `Domain segments cannot start or end with a hyphen.`;
    }
    if (!/^[a-zA-Z0-9-]+$/.test(part)) {
      return `Domain contains invalid characters. Only letters, numbers, and hyphens are allowed.`;
    }
    // Check for repetitive characters in domain name (e.g. gmaaaail or ggghjghkh)
    if (/(.)\1{3,}/i.test(part)) {
      return `Domain contains unnatural repetitive characters (${part}).`;
    }
  }

  // Strict check on popular domains
  const sld = domainParts.length >= 2 ? domainParts[domainParts.length - 2].toLowerCase() : '';
  const fullDomain = domainPart.toLowerCase();

  if (POPULAR_PROVIDERS[sld]) {
    const allowedDomains = POPULAR_PROVIDERS[sld];
    if (!allowedDomains.includes(fullDomain)) {
      return `Invalid email domain '@${domainPart}'. Did you mean '@${allowedDomains[0]}'?`;
    }
  }

  if (tld.length > 6 && !COMMON_VALID_TLDS.has(tld)) {
    return `The domain extension '.${tld}' is not recognized. Please use a valid domain extension.`;
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
