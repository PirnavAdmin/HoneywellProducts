import React from 'react';
import { useLocation } from 'react-router-dom';
import PolicyLayout from './policies/PolicyLayout';

export default function LegalPage() {
  const { pathname } = useLocation();

  let policyKey = 'privacy-policy';

  if (pathname.includes('terms')) {
    policyKey = 'terms-and-conditions';
  } else if (pathname.includes('cookie')) {
    policyKey = 'cookie-policy';
  } else if (pathname.includes('warranty')) {
    policyKey = 'warranty-policy';
  } else if (pathname.includes('return') || pathname.includes('refund')) {
    policyKey = 'return-refund-policy';
  } else if (pathname.includes('shipping') || pathname.includes('delivery')) {
    policyKey = 'shipping-delivery-policy';
  } else if (pathname.includes('cancellation')) {
    policyKey = 'cancellation-policy';
  } else if (pathname.includes('grievance')) {
    policyKey = 'grievance-redressal';
  }

  return <PolicyLayout policyKey={policyKey} />;
}
