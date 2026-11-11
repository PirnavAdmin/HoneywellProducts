import { validateGstin } from './gstinValidator.js';

/**
 * Detects keyboard-mashed or gibberish text strings (e.g., "gchjhghghggjgjjhgkhggghg",
 * "gjhghkkgygjjgghjghghgfjghggggygjjgjgj", "aytfvuadsgahkhadkjadghgasg", "asdfasdfasdf", etc.)
 * while preserving legitimate Indian, Western, and International company, city, and personal names.
 */
export const isGibberishText = (str, isContactPerson = false) => {
  if (!str) return false;
  const clean = String(str).trim();

  // 1. Triple or more identical consecutive letters (e.g. ggg, aaaa, zzz)
  if (/([a-zA-Z])\1{2,}/i.test(clean)) {
    return true;
  }

  // 2. Repetitive n-grams repeated 3+ times (e.g. ghghgh, asdfasdfasdf, gjgjgj)
  if (/([a-zA-Z]{2,4})\1{2,}/i.test(clean)) {
    return true;
  }

  // Split into words by common delimiters
  const words = clean.split(/[\s\-&'.,()/]+/).filter((w) => w.length > 0);

  for (const word of words) {
    const lettersOnly = word.replace(/[^a-zA-Z\u00C0-\u024F]/g, '');
    if (lettersOnly.length === 0) continue;

    // Single unspaced word too long (real human or company name words rarely exceed 22 letters in a single word)
    if (lettersOnly.length > 22) {
      return true;
    }

    // Acronyms (2 to 5 all-uppercase letters like BHEL, HDFC, TCS, 3M) are allowed
    const isAllUpper = lettersOnly === lettersOnly.toUpperCase() && lettersOnly.length <= 5;
    if (isAllUpper) continue;

    // Words with length >= 5 must have at least one vowel (a, e, i, o, u, y or accented vowels)
    const vowels = lettersOnly.match(/[aeiouyAEIOUY\u00C0-\u024F]/g) || [];
    if (lettersOnly.length >= 5 && vowels.length === 0) {
      return true;
    }

    // Check for excessive consecutive consonants without a vowel (6+ in a row)
    if (/[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{6,}/i.test(lettersOnly)) {
      return true;
    }

    // Check for low character diversity in words of length >= 8
    if (lettersOnly.length >= 8) {
      const charCounts = {};
      for (const ch of lettersOnly.toLowerCase()) {
        charCounts[ch] = (charCounts[ch] || 0) + 1;
      }
      const uniqueCount = Object.keys(charCounts).length;

      // If a single CONSONANT makes up >= 40% of an 8+ character word
      // (Vowels like 'a' naturally repeat in words like Vijayawada, Alabama, Panama)
      const consonants = lettersOnly.toLowerCase().replace(/[aeiouy\u00C0-\u024F]/g, '');
      const consonantCounts = {};
      for (const ch of consonants) {
        consonantCounts[ch] = (consonantCounts[ch] || 0) + 1;
      }
      const maxConsonantFreq = Math.max(0, ...Object.values(consonantCounts));
      if (maxConsonantFreq / lettersOnly.length >= 0.40) {
        return true;
      }

      // If unique characters are very few in an 8+ character word
      if (uniqueCount <= 3) {
        return true;
      }
    }
  }

  // Additional check for Contact Person: if entire name has >= 4 letters, it must contain at least one vowel
  if (isContactPerson) {
    const allLetters = clean.replace(/[^a-zA-Z\u00C0-\u024F]/g, '');
    const vowels = allLetters.match(/[aeiouyAEIOUY\u00C0-\u024F]/g) || [];
    if (allLetters.length >= 4 && vowels.length === 0) {
      return true;
    }
  }

  return false;
};

export const validateSupplierName = (name) => {
  if (name === null || name === undefined) {
    return { isValid: false, error: 'Supplier Name is required.' };
  }
  const trimmed = String(name).trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Supplier Name is required.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Supplier Name must be at least 2 characters.' };
  }
  if (trimmed.length > 150) {
    return { isValid: false, error: 'Supplier Name cannot exceed 150 characters.' };
  }
  // Check for excessive internal consecutive spaces
  if (/\s{3,}/.test(trimmed)) {
    return { isValid: false, error: 'Supplier Name contains excessive consecutive spaces.' };
  }
  if (/^\d+$/.test(trimmed)) {
    return { isValid: false, error: 'Supplier Name cannot consist of numbers only.' };
  }
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid supplier/company name.' };
  }
  const validPattern = /^[a-zA-Z0-9\s&.\-',()/]+$/;
  if (!validPattern.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid supplier/company name.' };
  }
  const alphanumericCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
  if (alphanumericCount < 2) {
    return { isValid: false, error: 'Enter a valid supplier/company name.' };
  }
  // Detect keyboard mashing / gibberish strings
  if (isGibberishText(trimmed, false)) {
    return { isValid: false, error: 'Enter a valid supplier/company name.' };
  }

  return { isValid: true, error: '' };
};

export const validateContactPerson = (name) => {
  if (name === null || name === undefined) {
    return { isValid: false, error: 'Contact Person is required.' };
  }
  const trimmed = String(name).trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Contact Person is required.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Contact Person name must be at least 2 characters.' };
  }
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Contact Person name cannot exceed 100 characters.' };
  }
  // Check for excessive internal consecutive spaces
  if (/\s{2,}/.test(trimmed)) {
    return { isValid: false, error: 'Contact Person name contains excessive consecutive spaces.' };
  }
  if (/\d/.test(trimmed)) {
    return { isValid: false, error: 'Contact Person name cannot contain numbers.' };
  }
  const lettersMatch = trimmed.match(/[a-zA-Z\u00C0-\u024F]/g);
  if (!lettersMatch || lettersMatch.length < 2) {
    return { isValid: false, error: "Enter a valid contact person's name." };
  }
  const validPattern = /^[a-zA-Z\u00C0-\u024F\s.'-]+$/;
  if (!validPattern.test(trimmed)) {
    return { isValid: false, error: "Enter a valid contact person's name." };
  }
  // Detect keyboard mashing / gibberish strings
  if (isGibberishText(trimmed, true)) {
    return { isValid: false, error: "Enter a valid contact person's name." };
  }

  return { isValid: true, error: '' };
};

export const validateProductLines = (productLines) => {
  if (productLines === null || productLines === undefined) {
    return { isValid: false, error: 'Product Lines is required.' };
  }
  const trimmed = String(productLines).trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Product Lines is required.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Product Lines must be at least 2 characters.' };
  }
  if (trimmed.length > 255) {
    return { isValid: false, error: 'Product Lines cannot exceed 255 characters.' };
  }
  return { isValid: true, error: '' };
};

/**
 * Validates Email Address according to RFC 5321 / RFC 5322
 * Enforces maximum 254 chars, single @, no spaces, valid domain labels,
 * legitimate TLD without repeated characters (rejecting commmmmmm, etc.),
 * and checks known webmail domains (e.g. gmail.com only).
 */
export const validateEmail = (email) => {
  if (email === null || email === undefined) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }
  const trimmed = String(email).trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }
  if (trimmed.length > 254) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }
  // Disallow invalid spaces inside email
  if (/\s/.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  // Exactly one @ required
  const atParts = trimmed.split('@');
  if (atParts.length !== 2) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }
  const [localPart, domainPart] = atParts;
  if (!localPart || localPart.length > 64 || !domainPart) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  // Local part characters check
  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  // Domain part must contain at least one dot
  if (!domainPart.includes('.')) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }
  const domainLabels = domainPart.split('.');
  if (domainLabels.some((label) => label.length === 0 || label.length > 63)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }
  for (const label of domainLabels) {
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label)) {
      return { isValid: false, error: 'Enter a valid email address.' };
    }
  }

  // TLD (last domain label)
  const tld = domainLabels[domainLabels.length - 1];
  // TLD must be all letters, between 2 and 10 characters
  if (!/^[a-zA-Z]{2,10}$/.test(tld)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }
  // TLD cannot contain 2 or more identical consecutive letters (rejects commmmmmm, cooom, etc.)
  if (/([a-zA-Z])\1{1,}/i.test(tld)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  // Specific check for well-known email domains
  const domainLower = domainPart.toLowerCase();
  if (domainLower.startsWith('gmail.')) {
    if (domainLower !== 'gmail.com') {
      return { isValid: false, error: 'Enter a valid email address.' };
    }
  }
  if (domainLower.startsWith('yahoo.')) {
    const validYahoo = ['yahoo.com', 'yahoo.in', 'yahoo.co.in', 'yahoo.co.uk', 'yahoo.ca', 'yahoo.com.au'];
    if (!validYahoo.includes(domainLower)) {
      return { isValid: false, error: 'Enter a valid email address.' };
    }
  }
  if (domainLower.startsWith('outlook.') || domainLower.startsWith('hotmail.')) {
    const base = domainLower.split('.')[0];
    const validMs = [`${base}.com`, `${base}.in`, `${base}.co.uk`];
    if (!validMs.includes(domainLower)) {
      return { isValid: false, error: 'Enter a valid email address.' };
    }
  }

  return { isValid: true, error: '', normalized: trimmed.toLowerCase() };
};

/**
 * Validates Phone Number
 * Supports Indian mobile (10 digits starting 6-9, optional +91 prefix)
 * and legitimate E.164 international numbers (7-15 digits starting with +).
 * Rejects letters, all-identical digits (e.g. 0000000000), arbitrary long sequences (e.g. 1234678543234).
 */
export const validatePhone = (phone) => {
  if (phone === null || phone === undefined) {
    return { isValid: false, error: 'Enter a valid phone number.' };
  }
  const str = String(phone).trim();
  if (str.length === 0) {
    return { isValid: false, error: 'Enter a valid phone number.' };
  }

  // Reject alphabetic characters
  if (/[a-zA-Z]/.test(str)) {
    return { isValid: false, error: 'Enter a valid phone number.' };
  }

  // Allow only digits, plus (+), spaces, hyphens, and parentheses
  if (!/^[\d\s+\-()]+$/.test(str)) {
    return { isValid: false, error: 'Enter a valid phone number.' };
  }

  // Only 1 plus sign allowed and must be at the very start
  const plusCount = (str.match(/\+/g) || []).length;
  if (plusCount > 1 || (plusCount === 1 && !str.startsWith('+'))) {
    return { isValid: false, error: 'Enter a valid phone number.' };
  }

  const rawDigits = str.replace(/\D/g, '');
  if (rawDigits.length === 0) {
    return { isValid: false, error: 'Enter a valid phone number.' };
  }

  // Reject all identical digits (e.g. 0000000000, 1111111111, 9999999999)
  if (/^(\d)\1+$/.test(rawDigits)) {
    return { isValid: false, error: 'Enter a valid phone number.' };
  }

  // Indian format with +91 or 91 prefix
  if (str.startsWith('+91') || (str.startsWith('91') && rawDigits.length === 12)) {
    const mobileDigits = rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits;
    if (mobileDigits.length !== 10 || !/^[6-9]\d{9}$/.test(mobileDigits)) {
      return { isValid: false, error: 'Enter a valid phone number.' };
    }
    return { isValid: true, error: '', normalized: '+91' + mobileDigits };
  }

  // Standard Indian 10-digit mobile without country code
  if (!str.startsWith('+')) {
    if (rawDigits.length !== 10 || !/^[6-9]\d{9}$/.test(rawDigits)) {
      return { isValid: false, error: 'Enter a valid phone number.' };
    }
    return { isValid: true, error: '', normalized: rawDigits };
  }

  // Legitimate international phone number (E.164: + followed by 7 to 15 digits)
  if (str.startsWith('+')) {
    if (rawDigits.length < 7 || rawDigits.length > 15 || rawDigits.startsWith('0')) {
      return { isValid: false, error: 'Enter a valid phone number.' };
    }
    return { isValid: true, error: '', normalized: '+' + rawDigits };
  }

  return { isValid: false, error: 'Enter a valid phone number.' };
};

/**
 * Validates City / Region
 * Requires valid city/region name, allows legitimate Unicode, spaces, hyphens, periods,
 * and numeric sectors/districts (e.g. "Sector 5, Hyderabad").
 * Rejects numbers-only, special-character-only strings, repeated spaces, and gibberish.
 */
export const validateCity = (city) => {
  if (city === null || city === undefined) {
    return { isValid: false, error: 'Enter a valid city or region.' };
  }
  const trimmed = String(city).trim();
  if (trimmed.length === 0 || trimmed.length < 2 || trimmed.length > 100) {
    return { isValid: false, error: 'Enter a valid city or region.' };
  }
  // Reject excessive consecutive spaces
  if (/\s{2,}/.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid city or region.' };
  }
  // Reject numbers only
  if (/^\d+$/.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid city or region.' };
  }
  // Must contain at least 2 alphabetic letters
  const letters = trimmed.match(/[a-zA-Z\u00C0-\u024F]/g) || [];
  if (letters.length < 2) {
    return { isValid: false, error: 'Enter a valid city or region.' };
  }
  // Legitimate city characters (alphabets, numbers, spaces, hyphens, apostrophes, commas, periods, slashes)
  const validCityPattern = /^[a-zA-Z0-9\u00C0-\u024F\s.'\-,\/()]+$/;
  if (!validCityPattern.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid city or region.' };
  }
  // Detect keyboard mashing / gibberish
  if (isGibberishText(trimmed, false)) {
    return { isValid: false, error: 'Enter a valid city or region.' };
  }
  return { isValid: true, error: '', normalized: trimmed };
};

/**
 * Validates Average Lead Time
 * Optional field. When populated, must represent a positive integer number of whole days (1 - 365).
 * Rejects alphabets, special characters, negative values, decimals, 0, or excessive values.
 */
export const validateLeadTime = (leadTime) => {
  if (leadTime === null || leadTime === undefined || String(leadTime).trim() === '') {
    return { isValid: true, error: '', normalized: '' };
  }
  const str = String(leadTime).trim();
  if (!/^\d+$/.test(str)) {
    return { isValid: false, error: 'Enter a valid lead time in days.' };
  }
  const days = parseInt(str, 10);
  if (isNaN(days) || days <= 0 || days > 365) {
    return { isValid: false, error: 'Enter a valid lead time in days.' };
  }
  return { isValid: true, error: '', normalized: String(days) };
};

/**
 * Validates Registered Address
 * Required field. Rejects empty, whitespace-only, special-character-only strings,
 * excessively short values (< 5 chars), single unbroken gibberish strings (> 20 chars with no space),
 * and keyboard mashing.
 * Supports building/house numbers, street, locality, city, state, PIN, punctuation.
 */
export const validateAddress = (address) => {
  if (address === null || address === undefined) {
    return { isValid: false, error: 'Enter a valid registered address.' };
  }
  const trimmed = String(address).trim();
  if (trimmed.length < 5 || trimmed.length > 500) {
    return { isValid: false, error: 'Enter a valid registered address.' };
  }
  // Must have at least 3 alphanumeric characters
  const alphaNumCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
  if (alphaNumCount < 3) {
    return { isValid: false, error: 'Enter a valid registered address.' };
  }
  // Reject special-character-only or symbols-only strings
  if (/^[^a-zA-Z0-9]+$/.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid registered address.' };
  }
  // Single unbroken word of length > 20 without any space or punctuation is not a registered address
  if (!/[\s,.\-#\/()':;]/.test(trimmed) && trimmed.length > 20) {
    return { isValid: false, error: 'Enter a valid registered address.' };
  }
  // Allow legitimate characters in addresses
  const validAddressPattern = /^[a-zA-Z0-9\u00C0-\u024F\s,.\-#\/()':;]+$/;
  if (!validAddressPattern.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid registered address.' };
  }
  // Detect keyboard mashing / gibberish strings
  if (isGibberishText(trimmed, false)) {
    return { isValid: false, error: 'Enter a valid registered address.' };
  }

  return { isValid: true, error: '', normalized: trimmed };
};

/**
 * Validates the entire supplier form payload.
 * Returns an errors dictionary where keys are field names.
 */
export const validateSupplierForm = (supplier = {}) => {
  const errors = {};

  const nameRes = validateSupplierName(supplier.name);
  if (!nameRes.isValid) errors.name = nameRes.error;

  const contactRes = validateContactPerson(supplier.contactPerson);
  if (!contactRes.isValid) errors.contactPerson = contactRes.error;

  const productLinesRes = validateProductLines(supplier.productLines);
  if (!productLinesRes.isValid) errors.productLines = productLinesRes.error;

  const phoneRes = validatePhone(supplier.phone);
  if (!phoneRes.isValid) errors.phone = phoneRes.error;

  const emailRes = validateEmail(supplier.email);
  if (!emailRes.isValid) errors.email = emailRes.error;

  const cityRes = validateCity(supplier.city);
  if (!cityRes.isValid) errors.city = cityRes.error;

  const addressRes = validateAddress(supplier.address);
  if (!addressRes.isValid) errors.address = addressRes.error;

  if (supplier.gstin && String(supplier.gstin).trim()) {
    const gstinRes = validateGstin(supplier.gstin, false);
    if (!gstinRes.isValid) errors.gstin = gstinRes.error;
  }

  if (supplier.leadTime && String(supplier.leadTime).trim()) {
    const leadRes = validateLeadTime(supplier.leadTime);
    if (!leadRes.isValid) errors.leadTime = leadRes.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
