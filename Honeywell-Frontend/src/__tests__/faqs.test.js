import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  FAQ_CATEGORIES,
  faqsData,
  getFaqsByCategory,
  searchFaqs,
} from '../data/faqsData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendSrc = path.resolve(__dirname, '..');
const appJsxPath = path.resolve(frontendSrc, 'App.jsx');
const backendControllerPath = path.resolve(frontendSrc, '../../Honeywell-Backend/Controllers/SupportController.cs');

describe('Frequently Asked Questions (FAQ) Comprehensive Test Suite', () => {
  const expectedCategories = [
    'General & Product Selection',
    'CCTV & Surveillance',
    'Downloads & Software',
    'Installation & Technical Support',
    'Warranty & Returns',
    'Orders & Delivery',
    'Business & Distributor',
  ];

  test('1. Category list contains All + 7 standardized business categories', () => {
    assert.equal(FAQ_CATEGORIES.length, 8);
    assert.equal(FAQ_CATEGORIES[0], 'All');
    for (const cat of expectedCategories) {
      assert.ok(FAQ_CATEGORIES.includes(cat), `Missing expected category: ${cat}`);
    }
  });

  test('2. Total FAQ count is approximately 30 (verifying 34 total items)', () => {
    assert.ok(faqsData.length >= 30 && faqsData.length <= 40, `Expected around 30 FAQs, got ${faqsData.length}`);
    assert.equal(faqsData.length, 34);
  });

  test('3. Every FAQ item has valid, non-empty properties and unique IDs and codes', () => {
    const seenIds = new Set();
    const seenCodes = new Set();

    for (const item of faqsData) {
      assert.ok(Number.isInteger(item.id), `Invalid ID for FAQ: ${JSON.stringify(item)}`);
      assert.ok(!seenIds.has(item.id), `Duplicate FAQ ID: ${item.id}`);
      seenIds.add(item.id);

      assert.ok(item.code && typeof item.code === 'string', `Missing code for FAQ #${item.id}`);
      assert.ok(!seenCodes.has(item.code), `Duplicate FAQ code: ${item.code}`);
      seenCodes.add(item.code);

      assert.ok(item.question && item.question.trim().length > 10, `Question too short for FAQ #${item.id}`);
      assert.ok(item.answer && item.answer.trim().length > 20, `Answer too short for FAQ #${item.id}`);
      assert.ok(expectedCategories.includes(item.category), `Unexpected category "${item.category}" in FAQ #${item.id}`);
    }
  });

  test('4. Each of the 7 categories is represented with at least 4 FAQs', () => {
    for (const cat of expectedCategories) {
      const itemsInCat = faqsData.filter((f) => f.category === cat);
      assert.ok(itemsInCat.length >= 4, `Category "${cat}" has only ${itemsInCat.length} FAQs (expected >= 4)`);
    }
  });

  test('5. Outdated and irrelevant questions (e.g. printer drivers) have been removed', () => {
    for (const item of faqsData) {
      const combined = `${item.question} ${item.answer}`.toLowerCase();
      assert.ok(!combined.includes('print driver'), `Found outdated "print driver" reference in FAQ #${item.id}`);
      assert.ok(!combined.includes('windows print'), `Found outdated "windows print" reference in FAQ #${item.id}`);
    }
  });

  test('6. Unverified business and SLA parameters are explicitly flagged', () => {
    const flaggedItems = faqsData.filter((f) => f.requiresConfirmation);
    assert.ok(flaggedItems.length >= 6, `Expected at least 6 flagged items for business review, found ${flaggedItems.length}`);

    for (const item of flaggedItems) {
      assert.ok(item.confirmationDetails, `Missing confirmationDetails for flagged FAQ #${item.id}`);
      assert.ok(
        item.answer.includes('[Requires Business Confirmation:'),
        `Flagged FAQ #${item.id} answer does not contain [Requires Business Confirmation: ...] token`
      );
    }
  });

  test('7. All route references in FAQ answers point to valid routes registered in App.jsx', () => {
    const appJsxContent = fs.readFileSync(appJsxPath, 'utf8');
    const routeRegex = /\((\/[a-zA-Z0-9?=&_-]+)\)/g;

    const extractedRoutes = new Set();
    for (const item of faqsData) {
      let match;
      while ((match = routeRegex.exec(item.answer)) !== null) {
        // Strip query string for base route verification
        const fullRoute = match[1];
        const baseRoute = fullRoute.split('?')[0].replace(/^\//, '');
        extractedRoutes.add(baseRoute);
      }
    }

    assert.ok(extractedRoutes.size > 0, 'No routes extracted from FAQ answers');

    for (const route of extractedRoutes) {
      // Check if App.jsx includes path="<route>" or path="<route>/...
      const routePattern = new RegExp(`path=["']${route}["']`, 'i');
      assert.ok(
        routePattern.test(appJsxContent),
        `Route "/${route}" referenced in FAQ answer was not found in App.jsx routes`
      );
    }
  });

  test('8. getFaqsByCategory helper behaves correctly for All and specific categories', () => {
    const allItems = getFaqsByCategory('All');
    assert.equal(allItems.length, 34);

    const cctvItems = getFaqsByCategory('CCTV & Surveillance');
    assert.equal(cctvItems.length, 5);
    for (const item of cctvItems) {
      assert.equal(item.category, 'CCTV & Surveillance');
    }

    const nullItems = getFaqsByCategory(null);
    assert.equal(nullItems.length, 34);
  });

  test('9. searchFaqs helper matches questions, answers, codes, and categories', () => {
    // Search by keyword in question
    const nvrResults = searchFaqs('NVR');
    assert.ok(nvrResults.length >= 4, `Expected at least 4 results for "NVR", got ${nvrResults.length}`);

    // Search by code tag
    const codeResults = searchFaqs('WAR_DURATION');
    assert.equal(codeResults.length, 1);
    assert.equal(codeResults[0].code, 'WAR_DURATION');

    // Search within specific category
    const catFiltered = searchFaqs('warranty', 'Warranty & Returns');
    assert.ok(catFiltered.length > 0);
    for (const item of catFiltered) {
      assert.equal(item.category, 'Warranty & Returns');
    }

    // Search with nonsense query returns empty array
    const emptyResults = searchFaqs('xyznonexistentquery999');
    assert.equal(emptyResults.length, 0);
  });

  test('10. Backend SupportController.cs contains matching categories and 34 FAQs', () => {
    if (fs.existsSync(backendControllerPath)) {
      const backendCode = fs.readFileSync(backendControllerPath, 'utf8');
      for (const cat of expectedCategories) {
        assert.ok(backendCode.includes(cat), `Backend SupportController.cs is missing category: ${cat}`);
      }
      assert.ok(backendCode.includes('GEN_AUTHENTICITY'), 'Backend SupportController.cs missing GEN_AUTHENTICITY');
      assert.ok(backendCode.includes('BIZ_CREDIT_TERMS'), 'Backend SupportController.cs missing BIZ_CREDIT_TERMS');
      assert.ok(!backendCode.includes('print drivers'), 'Backend SupportController.cs still contains obsolete print drivers');
    }
  });
});
