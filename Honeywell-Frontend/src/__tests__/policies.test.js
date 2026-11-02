import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  legalPoliciesData,
  policyNavigationList,
  LEGAL_VERIFICATION_NOTICE
} from '../data/legalPolicies.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendSrc = path.resolve(__dirname, '..');

describe('Policy & Legal Routes Verification', () => {
  const expectedSlugs = [
    'privacy-policy',
    'terms-and-conditions',
    'return-refund-policy',
    'shipping-delivery-policy',
    'cancellation-policy',
    'warranty-policy',
    'cookie-policy',
    'grievance-redressal'
  ];

  test('Policy navigation list contains all 8 expected policies', () => {
    assert.equal(policyNavigationList.length, 8);
    const navSlugs = policyNavigationList.map(item => item.slug);
    for (const slug of expectedSlugs) {
      assert.ok(navSlugs.includes(slug), `Missing ${slug} in policyNavigationList`);
    }
  });

  test('All 8 policy data objects are present and fully populated', () => {
    for (const slug of expectedSlugs) {
      const policy = legalPoliciesData[slug];
      assert.ok(policy, `Policy data missing for slug: ${slug}`);
      assert.ok(policy.title && policy.title.trim().length > 0, `Title missing for ${slug}`);
      assert.ok(policy.eyebrow && policy.eyebrow.trim().length > 0, `Eyebrow missing for ${slug}`);
      assert.ok(policy.lastUpdated && policy.lastUpdated.trim().length > 0, `LastUpdated missing for ${slug}`);
      assert.ok(policy.effectiveDate && policy.effectiveDate.trim().length > 0, `EffectiveDate missing for ${slug}`);
      assert.ok(policy.summary && policy.summary.trim().length > 0, `Summary missing for ${slug}`);
      assert.ok(Array.isArray(policy.keyHighlights) && policy.keyHighlights.length > 0, `Key highlights missing for ${slug}`);
      assert.ok(Array.isArray(policy.sections) && policy.sections.length >= 7, `Sections insufficient for ${slug}`);

      // Verify each section has id, number, title, content
      for (const section of policy.sections) {
        assert.ok(section.id, `Section id missing in ${slug}`);
        assert.ok(section.number, `Section number missing in ${slug}`);
        assert.ok(section.title, `Section title missing in ${slug}`);
        assert.ok(Array.isArray(section.content) && section.content.length > 0, `Section content missing in ${slug} section ${section.id}`);
      }
    }
  });

  test('Verification flags are present to ensure no invented legal identities or guarantees', () => {
    let totalConfirmations = 0;
    for (const slug of expectedSlugs) {
      const policy = legalPoliciesData[slug];
      const allText = policy.sections.flatMap(s => s.content).join(' ');
      const matches = allText.match(/\[(Requires Business Confirmation|Requires Legal Confirmation):/g);
      assert.ok(matches && matches.length > 0, `Policy ${slug} must mark unverified business info`);
      totalConfirmations += matches.length;
    }
    assert.ok(totalConfirmations >= 15, `Expected at least 15 verified items across policies, got ${totalConfirmations}`);
  });

  test('All 8 dedicated page component files exist', () => {
    const policyFiles = [
      'PrivacyPolicy.jsx',
      'TermsAndConditions.jsx',
      'ReturnRefundPolicy.jsx',
      'ShippingDeliveryPolicy.jsx',
      'CancellationPolicy.jsx',
      'WarrantyPolicy.jsx',
      'CookiePolicy.jsx',
      'GrievanceRedressal.jsx'
    ];

    for (const file of policyFiles) {
      const filePath = path.join(frontendSrc, 'pages', 'policies', file);
      assert.ok(fs.existsSync(filePath), `Policy file missing: ${file}`);
    }
  });

  test('App.jsx registers all 8 policy routes and canonical alias redirects', () => {
    const appPath = path.join(frontendSrc, 'App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    for (const slug of expectedSlugs) {
      assert.ok(appContent.includes(`path="${slug}"`), `App.jsx missing route for ${slug}`);
    }

    // Verify alias redirects
    assert.ok(appContent.includes('path="terms"'), 'Missing /terms alias');
    assert.ok(appContent.includes('path="returns-and-refunds"'), 'Missing /returns-and-refunds alias');
    assert.ok(appContent.includes('path="refund-policy"'), 'Missing /refund-policy alias');
    assert.ok(appContent.includes('path="shipping-policy"'), 'Missing /shipping-policy alias');
    assert.ok(appContent.includes('path="cancellation"'), 'Missing /cancellation alias');
    assert.ok(appContent.includes('path="cookies"'), 'Missing /cookies alias');
    assert.ok(appContent.includes('path="grievance"'), 'Missing /grievance alias');
  });

  test('Footer.jsx renders selected policy links and hides specific secondary policies', () => {
    const footerPath = path.join(frontendSrc, 'components', 'layout', 'Footer.jsx');
    const footerContent = fs.readFileSync(footerPath, 'utf-8');

    // Expected visible footer policy links
    const visibleSlugs = ['privacy-policy', 'terms-and-conditions', 'return-refund-policy', 'warranty-policy', 'cookie-policy'];
    for (const slug of visibleSlugs) {
      assert.ok(footerContent.includes(`/${slug}`), `Footer.jsx missing visible link to /${slug}`);
    }

    // Verify contact items use dedicated link classes
    assert.ok(footerContent.includes('footer-contact-link email'), 'Missing email contact class');
    assert.ok(footerContent.includes('footer-contact-link phone'), 'Missing phone contact class');
    assert.ok(footerContent.includes('footer-contact-link address'), 'Missing address contact class');
  });

  test('globals.css includes safe floating clearance and text wrapping rules', () => {
    const cssPath = path.join(frontendSrc, 'styles', 'globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(cssContent.includes('.site-shell.footer-in-view'), 'Missing footer collision elevation styles');
    assert.ok(cssContent.includes('.footer-contact-link.phone span { white-space: nowrap;'), 'Missing phone nowrap rule');
    assert.ok(cssContent.includes('.footer-policy-links'), 'Missing footer-policy-links styles');
  });
});
