/**
 * GSTIN Validation Utility
 * Validates Indian Goods and Services Tax Identification Number (GSTIN)
 * according to official GST Council specifications:
 * - Length: 15 characters
 * - Characters 1-2: State code (01-38, 97, 99)
 * - Characters 3-12: PAN format (5 letters, 4 digits, 1 letter)
 * - Character 13: Entity code (1-9, A-Z)
 * - Character 14: Default 'Z'
 * - Character 15: Mod-36 Checksum verification digit
 */

export const GST_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const GST_STATE_CODES = new Set([
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36', '37', '38', '97', '99'
]);

/**
 * Calculates the 15th character checksum for a 14-character GSTIN prefix
 * using the official Modulo 36 algorithm.
 */
export const calculateGstinChecksum = (gstin14) => {
  if (!gstin14 || gstin14.length < 14) return '0';
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const code = GST_CHARS.indexOf(gstin14[i]);
    if (code < 0) return '0';
    const factor = (i % 2 === 0) ? 1 : 2;
    const prod = code * factor;
    const digit = Math.floor(prod / 36) + (prod % 36);
    sum += digit;
  }
  const checkCode = (36 - (sum % 36)) % 36;
  return GST_CHARS[checkCode];
};

/**
 * Validates a GSTIN string.
 * @param {string} gstin - The GSTIN string to validate.
 * @param {boolean} [isRequired=false] - Whether a blank value should fail.
 * @returns {{ isValid: boolean, error: string, normalized: string }}
 */
export const validateGstin = (gstin, isRequired = false) => {
  if (!gstin || typeof gstin !== 'string' || !gstin.trim()) {
    if (isRequired) {
      return { isValid: false, error: 'GSTIN is required.', normalized: '' };
    }
    return { isValid: true, error: '', normalized: '' };
  }

  const clean = gstin.trim().toUpperCase();

  if (clean.length !== 15) {
    return { isValid: false, error: 'Enter a valid 15-character GSTIN.', normalized: clean };
  }

  const stateCode = clean.slice(0, 2);
  if (!GST_STATE_CODES.has(stateCode)) {
    return { isValid: false, error: 'Enter a valid 15-character GSTIN. Invalid state code.', normalized: clean };
  }

  const pan = clean.slice(2, 12);
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    return { isValid: false, error: 'Enter a valid 15-character GSTIN. Invalid PAN structure.', normalized: clean };
  }

  if (!/^[1-9A-Z]$/.test(clean[12])) {
    return { isValid: false, error: 'Enter a valid 15-character GSTIN.', normalized: clean };
  }

  if (clean[13] !== 'Z') {
    return { isValid: false, error: 'Enter a valid 15-character GSTIN. Character 14 must be Z.', normalized: clean };
  }

  const expectedChecksum = calculateGstinChecksum(clean.slice(0, 14));
  if (clean[14] !== expectedChecksum) {
    return { isValid: false, error: 'Enter a valid 15-character GSTIN. Checksum verification failed.', normalized: clean };
  }

  return { isValid: true, error: '', normalized: clean };
};
