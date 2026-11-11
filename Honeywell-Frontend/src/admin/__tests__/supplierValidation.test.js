import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSupplierName,
  validateContactPerson,
  validateProductLines,
  validatePhone,
  validateEmail,
  validateCity,
  validateLeadTime,
  validateAddress,
  validateSupplierForm,
  isGibberishText
} from '../utils/supplierValidation.js';
import { validateGstin, calculateGstinChecksum } from '../utils/gstinValidator.js';

// --- COMPANY DETAILS TESTS ---

test('1. Valid supplier name: Accepts legitimate registered company names', () => {
  const validNames = [
    'Honeywell Technologies',
    'ABC Enterprises',
    'Sri Sai Technologies Pvt Ltd',
    'Honeywell India Pvt. Ltd.',
    '3M India Ltd.',
    'Johnson & Johnson (India)',
    "O'Neil Supplies Ltd.",
    'AT&T Commercial Systems',
    'BHEL',
    'Tata Consultancy Services',
    'Larsen & Toubro'
  ];

  for (const name of validNames) {
    const res = validateSupplierName(name);
    assert.equal(res.isValid, true, `Expected "${name}" to be valid: ${res.error}`);
    assert.equal(res.error, '');
  }
});

test('2. Invalid supplier name: Rejects empty, numbers-only, special-chars-only, repeated spaces, and keyboard gibberish', () => {
  const invalidNames = [
    '',
    '   ',
    null,
    undefined,
    '@@@@!!!!',
    '#######',
    '123456789',
    '---',
    'A', // too short (< 2)
    'Honeywell   Technologies', // 3+ excessive spaces
    'gchjhghghggjgjjhgkhggghg', // Keyboard mashing / gibberish reported by user
    'hvjadgbkbhkabkddaskhjhsgbhghkhaskhbsjgshg', // Gibberish string with 25 consecutive consonants
    'asdfasdfasdf', // Repeated n-gram
    'bcdfghjklmn' // No vowels
  ];

  for (const name of invalidNames) {
    const res = validateSupplierName(name);
    assert.equal(res.isValid, false, `Expected "${name}" to be invalid`);
    assert.ok(res.error.length > 0, `Expected error message for "${name}"`);
  }
});

test('3. Valid contact person: Accepts legitimate international names with spaces, hyphens, periods, apostrophes', () => {
  const validPersons = [
    'Suresh Kumar',
    'John Smith',
    'Mohammed Ali',
    'Anne-Marie',
    "O'Connor",
    'Mary-Jane Watson',
    'Dr. John Smith',
    'J. R. D. Tata',
    'Krzysztof'
  ];

  for (const person of validPersons) {
    const res = validateContactPerson(person);
    assert.equal(res.isValid, true, `Expected "${person}" to be valid: ${res.error}`);
    assert.equal(res.error, '');
  }
});

test('4. Invalid contact person: Rejects numbers, special chars only, empty, digits in name, and keyboard gibberish', () => {
  const invalidPersons = [
    '',
    '   ',
    null,
    undefined,
    '123456',
    'Suresh123',
    '@@@!!!',
    '---',
    'J', // too short
    'John  Doe', // excessive spaces
    'gjhghkkgygjjgghjghghgfjghggggygjjgjgj', // Keyboard mashing / gibberish reported by user
    'hvjadgbkbhkabkddaskhjhsgbhghkhaskhbsjgshg', // 41-char unbroken string
    'asdfasdfasdf', // Repeated pattern
    'bcdfghjklmn' // No vowels
  ];

  for (const person of invalidPersons) {
    const res = validateContactPerson(person);
    assert.equal(res.isValid, false, `Expected "${person}" to be invalid`);
    assert.ok(res.error.length > 0, `Expected error message for "${person}"`);
  }
});

// --- GSTIN VALIDATION TESTS ---

test('5. Valid GSTIN format: Accepts verified registered Indian GSTINs and verifies checksum', () => {
  const validGstins = [
    '27AAACC1173C1Z8', // Honeywell Automation India Ltd (Maharashtra)
    '27AAPFU0939F1ZV', // Maharashtra
    '29AAACB8556L1Z5', // Bharat Electronics Ltd (Karnataka)
    '07AAAAA0000A1Z4'  // Delhi structure
  ];

  for (const gstin of validGstins) {
    const res = validateGstin(gstin);
    assert.equal(res.isValid, true, `Expected "${gstin}" to be valid: ${res.error}`);
    assert.equal(res.error, '');
    assert.equal(res.normalized, gstin);
  }
});

test('6. Invalid GSTIN length: Rejects strings shorter or longer than 15 characters', () => {
  const resShort = validateGstin('27AAACC1173C1');
  assert.equal(resShort.isValid, false);
  assert.equal(resShort.error, 'Enter a valid 15-character GSTIN.');

  const resLong = validateGstin('27AAACC1173C1Z899');
  assert.equal(resLong.isValid, false);
  assert.equal(resLong.error, 'Enter a valid 15-character GSTIN.');
});

test('7. Invalid GSTIN PAN structure: Rejects non-PAN characters in positions 3-12', () => {
  const resBadPan1 = validateGstin('27123CC1173C1Z8');
  assert.equal(resBadPan1.isValid, false);
  assert.ok(/pan structure/i.test(resBadPan1.error));

  const resBadPan2 = validateGstin('27AAACCAAAAC1Z8');
  assert.equal(resBadPan2.isValid, false);
  assert.ok(/pan structure/i.test(resBadPan2.error));
});

test('8. Invalid GSTIN state code: Rejects invalid or unregistered state codes', () => {
  const resBadState1 = validateGstin('98AAACC1173C1Z8');
  assert.equal(resBadState1.isValid, false);
  assert.ok(/state code/i.test(resBadState1.error));

  const resBadState2 = validateGstin('00AAACC1173C1Z8');
  assert.equal(resBadState2.isValid, false);
  assert.ok(/state code/i.test(resBadState2.error));
});

test('9. Invalid GSTIN checksum: Rejects checksum digit mismatch', () => {
  const resBadChecksum = validateGstin('27AAACC1173C1Z9');
  assert.equal(resBadChecksum.isValid, false);
  assert.ok(/checksum/i.test(resBadChecksum.error));
});

// --- CONTACT & LOCATION STRICT TESTS ---

test('10. Email validation: Accepts valid email formats and rejects invalid domains, missing @, spaces, and extreme lengths', () => {
  const validEmails = [
    'supplier@gmail.com',
    'contact@honeywell.com',
    'sales.team@example.in',
    'procurement.apac@honeywell.com.au'
  ];
  for (const email of validEmails) {
    const res = validateEmail(email);
    assert.equal(res.isValid, true, `Expected valid email "${email}": ${res.error}`);
    assert.equal(res.error, '');
  }

  const invalidEmails = [
    '',
    '   ',
    null,
    undefined,
    'shgasgysagg@gmail.commmmmmm', // Repetitive TLD reported by user
    'suppliergmail.com',
    'supplier@',
    '@gmail.com',
    'supplier@@gmail.com',
    'supplier@gmail',
    'supplier gmail@gmail.com',
    'a'.repeat(250) + '@example.com' // > 254 chars
  ];
  for (const email of invalidEmails) {
    const res = validateEmail(email);
    assert.equal(res.isValid, false, `Expected invalid email "${email}"`);
    assert.equal(res.error, 'Enter a valid email address.');
  }
});

test('11. Phone validation: Accepts valid Indian & international phones, rejects letters, invalid prefixes, identical digits, and bad lengths', () => {
  const validPhones = [
    '9876543210',
    '8765432109',
    '+919876543210',
    '+91 98765-43210',
    '+91 63012 34567',
    '+1 202-555-0123' // Legitimate international E.164
  ];
  for (const phone of validPhones) {
    const res = validatePhone(phone);
    assert.equal(res.isValid, true, `Expected valid phone "${phone}": ${res.error}`);
    assert.equal(res.error, '');
  }

  const invalidPhones = [
    '',
    '   ',
    null,
    undefined,
    '1234678543234', // 13-digit sequence reported by user
    '123',
    '987654321012345678',
    '98765ABCDE',
    '0000000000',
    '1111111111',
    '+91',
    '+91 12345',
    '5123456789', // Starts with 5 (not 6,7,8,9)
    '+915123456789'
  ];
  for (const phone of invalidPhones) {
    const res = validatePhone(phone);
    assert.equal(res.isValid, false, `Expected invalid phone "${phone}"`);
    assert.equal(res.error, 'Enter a valid phone number.');
  }
});

test('12. City / Region validation: Accepts legitimate Indian & international cities, rejects numbers-only, special-chars-only, and gibberish', () => {
  const validCities = [
    'Hyderabad',
    'Vijayawada',
    'Eluru',
    'New Delhi',
    'Visakhapatnam',
    'Sector 5, Hyderabad',
    'Bengaluru North',
    'Mumbai Suburban',
    'District 2, Ho Chi Minh City'
  ];
  for (const city of validCities) {
    const res = validateCity(city);
    assert.equal(res.isValid, true, `Expected valid city "${city}": ${res.error}`);
    assert.equal(res.error, '');
  }

  const invalidCities = [
    '',
    '   ',
    null,
    undefined,
    '@@@@@',
    '12345',
    'Sector   5', // 3+ excessive spaces
    'H', // too short (< 2)
    'gchjhghghggjgjjhgkhggghg' // Keyboard mash
  ];
  for (const city of invalidCities) {
    const res = validateCity(city);
    assert.equal(res.isValid, false, `Expected invalid city "${city}"`);
    assert.equal(res.error, 'Enter a valid city or region.');
  }
});

test('13. Average Lead Time validation: Accepts positive whole integer days (1-365) or blank, rejects letters, decimals, negative, 0, or excessive values', () => {
  const validLeadTimes = ['1', '7', '15', '30', '90', '180', '365', '', '   ', null, undefined];
  for (const lt of validLeadTimes) {
    const res = validateLeadTime(lt);
    assert.equal(res.isValid, true, `Expected valid leadTime "${lt}": ${res.error}`);
    assert.equal(res.error, '');
  }

  const invalidLeadTimes = [
    'abc',
    '7days',
    '-10',
    '1.5',
    '@@@',
    '0',
    '366',
    '99999'
  ];
  for (const lt of invalidLeadTimes) {
    const res = validateLeadTime(lt);
    assert.equal(res.isValid, false, `Expected invalid leadTime "${lt}"`);
    assert.equal(res.error, 'Enter a valid lead time in days.');
  }
});

test('14. Registered Address validation: Accepts realistic addresses, rejects empty, special-only, excessively short, and gibberish', () => {
  const validAddresses = [
    'Plot No. 25, Kukatpally, Hyderabad, Telangana, India - 500072',
    'Door 4-12/A, Gandhi Nagar, Vijayawada - 520003',
    'Building 8C, DLF Cyber City, Phase 2, Gurgaon, Haryana 122002',
    'Survey No. 45/1, Outer Ring Road, Devarabisanahalli, Bangalore 560103'
  ];
  for (const addr of validAddresses) {
    const res = validateAddress(addr);
    assert.equal(res.isValid, true, `Expected valid address: ${res.error}`);
    assert.equal(res.error, '');
  }

  const invalidAddresses = [
    '',
    '   ',
    null,
    undefined,
    'aytfvuadsgahkhadkjadghgasg', // Unbroken gibberish string reported by user
    '@@@@@@@',
    '#######',
    'abc', // too short (< 5)
    '1234', // too short
    'gchjhghghggjgjjhgkhggghg' // Gibberish string
  ];
  for (const addr of invalidAddresses) {
    const res = validateAddress(addr);
    assert.equal(res.isValid, false, `Expected invalid address "${addr}"`);
    assert.equal(res.error, 'Enter a valid registered address.');
  }
});

// --- COMPOSITE FORM & API PAYLOAD TESTS ---

test('15. Composite Form Validation: Detects invalid contact & location fields and returns field-specific error messages', () => {
  const invalidForm = {
    name: 'Honeywell India Pvt. Ltd.',
    contactPerson: 'Suresh Kumar',
    productLines: 'Industrial Automation',
    email: 'shgasgysagg@gmail.commmmmmm', // Repetitive TLD reported by user
    phone: '1234678543234', // 13-digit sequence reported by user
    city: '@@@@@', // Special characters only
    leadTime: '7days', // Non-numeric
    address: 'aytfvuadsgahkhadkjadghgasg' // Unbroken gibberish string reported by user
  };

  const res = validateSupplierForm(invalidForm);
  assert.equal(res.isValid, false);
  assert.equal(res.errors.email, 'Enter a valid email address.');
  assert.equal(res.errors.phone, 'Enter a valid phone number.');
  assert.equal(res.errors.city, 'Enter a valid city or region.');
  assert.equal(res.errors.leadTime, 'Enter a valid lead time in days.');
  assert.equal(res.errors.address, 'Enter a valid registered address.');
});

test('16. Valid full supplier creation payload passes all validations cleanly with normalized data', () => {
  const validSupplier = {
    name: 'Honeywell India Pvt. Ltd.',
    contactPerson: 'Suresh Kumar',
    productLines: 'Building Solutions & Fire Safety',
    email: 'contact@honeywell.com',
    phone: '+919876543210',
    city: 'Sector 5, Hyderabad',
    leadTime: '15',
    address: 'Plot No. 25, Kukatpally, Hyderabad, Telangana, India - 500072',
    gstin: '29AAACB8556L1Z5'
  };

  const res = validateSupplierForm(validSupplier);
  assert.equal(res.isValid, true);
  assert.deepEqual(res.errors, {});
});
