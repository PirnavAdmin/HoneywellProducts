/**
 * Utility for Indian GSTIN (Goods and Services Tax Identification Number) validation.
 * GSTIN is a 15-character alphanumeric code structured as:
 * - 2 digits (State Code)
 * - 5 letters (PAN letters)
 * - 4 digits (PAN numbers)
 * - 1 letter (PAN check letter)
 * - 1 entity code character (1-9 or A-Z)
 * - 1 'Z' by default
 * - 1 check digit character (0-9 or A-Z)
 */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/**
 * Validates an optional GSTIN value.
 * @param {string} value
 * @returns {string | null} Returns an error message string if invalid, or null if valid/empty.
 */
export function validateGstin(value) {
  if (!value) return null;
  const trimmed = String(value).trim().toUpperCase();
  if (trimmed === '') return null;
  if (!GSTIN_REGEX.test(trimmed)) {
    return 'Please enter a valid 15-character GSTIN.';
  }
  return null;
}
