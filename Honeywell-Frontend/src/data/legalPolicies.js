/**
 * Legal Policies Data Store
 * Honeywell Products E-Commerce Platform
 * 
 * Production-ready drafting conforming to Indian Consumer Protection (E-Commerce) Rules, 2020,
 * Information Technology Act, 2000, and Digital Personal Data Protection Act, 2023.
 * 
 * Note: All operational parameters awaiting corporate or legal confirmation are marked
 * with "[Requires Business Confirmation: ...]" or "[Requires Legal Confirmation: ...]" tags.
 */

export const LEGAL_VERIFICATION_NOTICE = {
  title: 'Official Legal & Operational Baseline',
  body: 'Items flagged with [Requires Business Confirmation] or [Requires Legal Confirmation] represent operational baselines proposed in accordance with standard e-commerce practices. They require formal verification and sign-off by authorized company representatives before binding enforcement.',
  effectiveDate: 'November 1, 2026',
  lastUpdated: 'October 30, 2026',
  version: '2026.2'
};

export const policyNavigationList = [
  { slug: 'privacy-policy', label: 'Privacy Policy', path: '/privacy-policy', shortDesc: 'Data collection, processing & DPDP compliance' },
  { slug: 'terms-and-conditions', label: 'Terms & Conditions', path: '/terms-and-conditions', shortDesc: 'Platform access, commercial rules & ordering terms' },
  { slug: 'return-refund-policy', label: 'Return & Refund', path: '/return-refund-policy', shortDesc: 'Return windows, inspection & refund workflows' },
  { slug: 'shipping-delivery-policy', label: 'Shipping & Delivery', path: '/shipping-delivery-policy', shortDesc: 'Transit timelines, freight charges & cargo policies' },
  { slug: 'cancellation-policy', label: 'Cancellation Policy', path: '/cancellation-policy', shortDesc: 'Pre/post-dispatch cancellations & refund rules' },
  { slug: 'warranty-policy', label: 'Warranty Policy', path: '/warranty-policy', shortDesc: 'Hardware limited warranty & RMA procedures' },
  { slug: 'cookie-policy', label: 'Cookie Policy', path: '/cookie-policy', shortDesc: 'Cookies, local storage & tracking controls' },
  { slug: 'grievance-redressal', label: 'Grievance Redressal', path: '/grievance-redressal', shortDesc: 'Statutory officer, escalation matrix & resolution SLA' },
];

export const legalPoliciesData = {
  'privacy-policy': {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    eyebrow: 'DATA PROTECTION & PRIVACY',
    lastUpdated: 'October 30, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'This Privacy Policy sets out how Honeywell Products collects, uses, protects, and handles personal and corporate information when you use our website, storefront, customer accounts, quotation tools, and after-sales support systems.',
    keyHighlights: [
      'Comprehensive adherence to the Digital Personal Data Protection (DPDP) Act, 2023 and Information Technology Act, 2000.',
      'Customer and commercial data is processed solely for order fulfillment, billing, account security, and product support.',
      'Industry-standard encryption (TLS 1.3 in transit and AES-256 at rest) protects transaction records and credentials.',
      'Customers have unequivocal rights to review, rectify, or request deletion of personal information subject to statutory tax record retention rules.'
    ],
    sections: [
      {
        id: 'scope',
        number: '1',
        title: 'Scope & Applicability',
        content: [
          'This Privacy Policy applies to all users, customers, institutional buyers, and channel partners accessing or utilizing the digital platform, e-commerce storefront, quotation engines, and support portals operated by Honeywell Products ("the Platform", "we", "us", or "our").',
          'Operating Entity: [Requires Legal Confirmation: Registered corporate name (e.g., Honeywell International Inc. / Honeywell Automation India Ltd. / Authorized National Distributor Entity), Corporate Identity Number (CIN), and Registered Office Address].',
          'By accessing our Platform, creating a user account, purchasing surveillance hardware, or submitting quotation requests, you acknowledge the terms of this Privacy Policy.'
        ]
      },
      {
        id: 'information-collected',
        number: '2',
        title: 'Information We Collect',
        content: [
          'We collect information necessary to provide commercial products, technical documentation, and fulfillment services:',
          '2.1 Personal & Identity Data: Name, business designation, corporate entity name, billing and shipping addresses, telephone numbers, and email addresses provided during registration or checkout.',
          '2.2 Commercial & Financial Data: GSTIN, PAN (for corporate billing), purchase order references, transaction records, payment transaction identifiers, and banking details required for processing refunds or tax invoices. Note: Full payment card credentials are never stored on our servers and are processed securely via PCI-DSS compliant payment gateways.',
          '2.3 Technical & Telemetry Data: IP addresses, browser specifications, operating system details, device identifiers, referring URLs, and session interaction timestamps gathered automatically for site diagnostics and fraud mitigation.',
          '2.4 Communications Data: Enquiries submitted through contact forms, quotation requests, service tickets, recorded support calls, and chatbot conversations.'
        ]
      },
      {
        id: 'lawful-basis',
        number: '3',
        title: 'Lawful Basis & Purposes of Data Processing',
        content: [
          'We process your data strictly under recognized legal bases including contractual necessity, legitimate business interests, and legal compliance:',
          '• Order Execution & Delivery: Processing shopping carts, validating billing information, generating GST tax invoices, and coordinating courier logistics.',
          '• Warranty & After-Sales Service: Authenticating product serial numbers, validating warranty periods, issuing RMA authorizations, and tracking repair histories.',
          '• Account Management: Facilitating secure login, role-based access for business partners, order history archives, and quotation tracking.',
          '• Regulatory Compliance: Fulfilling statutory tax accounting, audit mandates, and legal disclosures required under Indian commercial and consumer protection laws.',
          '• Security & Fraud Prevention: Detecting anomalous transactions, preventing identity fraud, and safeguarding platform infrastructure.'
        ]
      },
      {
        id: 'data-sharing',
        number: '4',
        title: 'Sharing & Third-Party Disclosures',
        content: [
          'We do not sell, rent, or trade your personal information to third parties. We share data solely with trusted service partners under strict confidentiality agreements:',
          '• Logistics & Courier Partners: Shipping addresses, contact names, and phone numbers are shared with approved courier carriers [Requires Business Confirmation: e.g., Blue Dart, Delhivery, DTDC] strictly for parcel delivery and transit updates.',
          '• Payment Processors: Secure payment gateways process encrypted payment details to authorize charges and execute refunds.',
          '• Authorized Service Centers: Customer and product data is shared with certified technician partners for on-site installations, warranty service, or hardware bench inspections.',
          '• Statutory Authorities: Disclosures made when mandated by law, court order, or official governmental directive.'
        ]
      },
      {
        id: 'security',
        number: '5',
        title: 'Data Security & Storage Protocols',
        content: [
          'We enforce rigorous technical and organizational measures to safeguard your personal data against unauthorized access, alteration, disclosure, or loss:',
          '• Encryption: End-to-end Transport Layer Security (TLS 1.3) protects data in transit across all pages, and AES-256 encryption protects sensitive records at rest.',
          '• Access Controls: Principle of least privilege enforced across internal administrative modules with mandatory Multi-Factor Authentication (MFA) and granular Role-Based Access Control (RBAC).',
          '• Vulnerability Audits: Periodic security assessments, automated dependency scanning, and patch management protocols are maintained.'
        ]
      },
      {
        id: 'retention',
        number: '6',
        title: 'Data Retention & Erasure',
        content: [
          'We retain personal information only for as long as necessary to fulfill the purposes for which it was gathered, or to comply with statutory legal and accounting retention mandates:',
          '• Financial & Order Records: Retained for [Requires Business Confirmation: Minimum 7 Years or 8 Fiscal Years as mandated by the Indian Companies Act and GST regulations].',
          '• Inactive Customer Accounts: Account credentials and profile preferences are archived or anonymized after [Requires Business Confirmation: 36 Months of continuous account inactivity], unless required for active warranty claims.',
          '• Support & Query Logs: Chatbot logs and support enquiries are retained for 12 months for quality assurance before automated purging.'
        ]
      },
      {
        id: 'user-rights',
        number: '7',
        title: 'Your Statutory Data Rights',
        content: [
          'In alignment with the Digital Personal Data Protection Act, 2023, you enjoy comprehensive rights regarding your personal information:',
          '• Right of Access & Summary: Request a copy of your personal data processed on our platform.',
          '• Right to Correction & Erasure: Request immediate rectification of inaccurate profile data or deletion of unnecessary personal records.',
          '• Right to Grievance Redressal: Lodge a grievance regarding our data handling with our designated Grievance Officer, or escalate to the Data Protection Board of India.',
          '• Right to Nominate: Nominate an authorized representative to exercise your rights in the event of death or incapacity.'
        ]
      },
      {
        id: 'cookies',
        number: '8',
        title: 'Cookies & Tracking Technologies',
        content: [
          'Our platform employs cookies and local storage tokens to preserve session states, manage cart items, and collect aggregate diagnostic analytics. Please review our dedicated Cookie Policy for detailed information on managing browser preferences.'
        ]
      },
      {
        id: 'minors',
        number: '9',
        title: 'Minors & Children\'s Data',
        content: [
          'Our e-commerce platform provides commercial security, surveillance, and industrial equipment intended solely for individuals of legal age (18 years or older) and legally established commercial entities. We do not knowingly collect personal information from minors.'
        ]
      },
      {
        id: 'updates',
        number: '10',
        title: 'Amendments & Policy Updates',
        content: [
          'We may update this Privacy Policy periodically to reflect technological changes, statutory amendments, or evolving operational practices. Revisions will be published on this page with an updated "Last Updated" date. Continued use of the platform after updates constitutes acceptance.'
        ]
      },
      {
        id: 'contact',
        number: '11',
        title: 'Contact Information & Grievance Officer',
        content: [
          'For questions regarding privacy, data rights, or statutory compliance, please contact our compliance desk:',
          '• Operating Entity: Honeywell Products',
          '• Address: 101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad - 500081, Telangana.',
          '• Data Privacy Email: info@honeywellproducts.com',
          '• Direct Telephone: 040 4855 5758',
          '• Designated Grievance Officer: [Requires Legal Confirmation: Official Name & Direct Email ID - e.g., grievance@honeywellproducts.com]'
        ]
      }
    ]
  },

  'terms-and-conditions': {
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions',
    eyebrow: 'COMMERCIAL TERMS OF SERVICE',
    lastUpdated: 'October 30, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'These Terms & Conditions govern your access to, browsing of, and commercial transactions on the Honeywell Products platform, covering accounts, quotations, checkout, payment, deliveries, warranty claims, and intellectual property.',
    keyHighlights: [
      'Binding legal contract between the customer/commercial entity and the platform operators.',
      'Clear protocols for purchase orders, GST tax invoicing, price quotations, and payment verification.',
      'Defines risk transfer upon courier dispatch, delivery inspection criteria, and hardware warranty bounds.',
      'Governed by the laws of India with dispute jurisdiction designated in Hyderabad, Telangana.'
    ],
    sections: [
      {
        id: 'agreement',
        number: '1',
        title: 'Agreement to Terms & Legal Capacity',
        content: [
          '1.1 Binding Agreement: By accessing, browsing, registering an account, or placing an order on this website, you agree to be bound by these Terms & Conditions ("Terms"), our Privacy Policy, and all supplemental operational guidelines posted herein.',
          '1.2 Capacity to Contract: You represent that you are at least 18 years of age and possess full legal authority to enter into binding agreements. If acting on behalf of a company, partnership, or proprietary firm, you represent that you hold full corporate authority to bind said entity.'
        ]
      },
      {
        id: 'accounts',
        number: '2',
        title: 'Account Registration, Security & Misuse',
        content: [
          '2.1 Account Credentials: Users are responsible for maintaining the confidentiality of their passwords, OTP credentials, and API tokens. All actions performed under your account are deemed authorized by you.',
          '2.2 Accurate Information: You agree to provide true, accurate, and current information, including valid business GSTIN credentials where applicable.',
          '2.3 Account Suspension: We reserve the right to suspend or terminate accounts that engage in fraudulent behavior, automated bot scraping, unauthorized reverse engineering, or repeated non-payment of commercial indents.'
        ]
      },
      {
        id: 'catalogue',
        number: '3',
        title: 'Product Specifications, Availability & Pricing',
        content: [
          '3.1 Catalogue Accuracy: Product descriptions, technical datasheets, lens specifications, resolution metrics, and application guides are curated to be as precise as possible. Minor dimensional or firmware version variances may occur without diminishing product performance.',
          '3.2 Stock Availability: Products displayed are subject to real-time warehouse inventory. In the event of unforeseen stock exhaustion post-order, our fulfillment team will notify you promptly and issue an immediate full refund or offer an equivalent technical alternative.',
          '3.3 Pricing & Taxes: Prices displayed are in Indian Rupees (INR). Applicable Goods & Services Tax (GST) is computed dynamically at checkout based on HSN classifications. We reserve the right to correct manifest typographical or pricing errors prior to order dispatch.'
        ]
      },
      {
        id: 'orders',
        number: '4',
        title: 'Order Placement, B2B Quotations & Contract Formation',
        content: [
          '4.1 Direct Storefront Orders: An electronic order confirmation constitutes acknowledgment of receipt, not final acceptance. Contract formation occurs upon warehouse dispatch and generation of the GST tax invoice.',
          '4.2 Custom Quotations & Indents: Official quotations issued through our Bulk Quote module are valid for [Requires Business Confirmation: 15 Calendar Days from date of issuance], subject to inventory availability and raw material price stability.',
          '4.3 Order Rejection: We reserve the right to decline or cancel orders suspected of unauthorized reseller arbitrage, fraudulent credit card usage, or export compliance violations.'
        ]
      },
      {
        id: 'payment',
        number: '5',
        title: 'Payment Terms, Invoicing & GST Compliance',
        content: [
          '5.1 Payment Modes: We accept online payments via authorized credit/debit cards, Net Banking, UPI, approved business credit facilities, and direct NEFT/RTGS bank transfers.',
          '5.2 GST Invoicing: Valid GSTIN input during checkout will result in a Tax Invoice reflecting your organization name and state GST registration. GST credit validation is the responsibility of the purchaser.',
          '5.3 Payment Gateways: Online financial transactions are tokenized and processed via licensed Reserve Bank of India (RBI) compliant payment aggregators.'
        ]
      },
      {
        id: 'shipping-risk',
        number: '6',
        title: 'Shipping, Title Transfer & Risk of Loss',
        content: [
          '6.1 Consignment Dispatch: Products are carefully packed and handed over to insured national courier carriers. Refer to our Shipping & Delivery Policy for regional transit timelines.',
          '6.2 Transfer of Risk: Risk of loss or damage passes to the customer upon delivery confirmation by the courier carrier at the designated shipping address.',
          '6.3 Delivery Inspection: Customers are required to inspect package integrity before signing delivery acknowledgments. Damaged or tampered packages must be rejected or reported within 48 hours.'
        ]
      },
      {
        id: 'returns',
        number: '7',
        title: 'Returns, Cancellations & Refunds',
        content: [
          '7.1 Policy Integration: All returns, replacements, and refund claims are governed strictly by our dedicated Return & Refund Policy and Cancellation Policy.',
          '7.2 RMA Authorization: No return package will be accepted without a pre-approved Return Merchandise Authorization (RMA) ticket generated via our customer portal.'
        ]
      },
      {
        id: 'warranty',
        number: '8',
        title: 'Hardware Limited Warranty',
        content: [
          '8.1 Manufacturer Coverage: Hardware supplied through this platform is backed by standard manufacturer warranty coverage against manufacturing defects in materials and workmanship. Refer to our Warranty Policy for duration and claim processes.',
          '8.2 Portal Services: Customers can verify serial numbers, check eligibility, and file claims directly via our interactive Warranty Portal (/warranty).'
        ]
      },
      {
        id: 'ip',
        number: '9',
        title: 'Intellectual Property & Brand Attribution',
        content: [
          '9.1 Copyright: © 2026 Honeywell International Inc. All rights reserved. [Flagged for business-owner verification]. All trademarks, logos, diagrams, product photographs, and software assets are the intellectual property of their respective owners.',
          '9.2 No License: Access to this platform grants no right or license to copy, reproduce, mirror, or commercialize any brand logos or proprietary documentation without prior written authorization.'
        ]
      },
      {
        id: 'liability',
        number: '10',
        title: 'Limitation of Liability & Disclaimers',
        content: [
          '10.1 Disclaimer of Warranties: Except as expressly stated in our written Warranty Policy, the platform and all catalogue items are provided "as is" without implied warranties of merchantability or fitness for a particular custom purpose.',
          '10.2 Liability Cap: To the maximum extent permitted by applicable Indian law, our total aggregate liability arising out of or related to any order shall not exceed the total amount paid by the customer for the specific product giving rise to the claim.'
        ]
      },
      {
        id: 'jurisdiction',
        number: '11',
        title: 'Governing Law & Dispute Resolution',
        content: [
          '11.1 Governing Law: These Terms and all transactions shall be construed in accordance with the laws of the Republic of India.',
          '11.2 Exclusive Jurisdiction: [Requires Legal Confirmation: Subject to prior amicable mediation, all disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts located in Hyderabad, Telangana, India].'
        ]
      },
      {
        id: 'contact',
        number: '12',
        title: 'Commercial Notices & Contact Particulars',
        content: [
          'For formal commercial notices or legal correspondence:',
          '• Platform: Honeywell Products',
          '• Head Office: 101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad - 500081, Telangana.',
          '• Commercial Enquiries: info@honeywellproducts.com',
          '• Contact Phone: 040 4855 5758'
        ]
      }
    ]
  },

  'return-refund-policy': {
    slug: 'return-refund-policy',
    title: 'Return & Refund Policy',
    eyebrow: 'RETURNS, REPLACEMENTS & REFUNDS',
    lastUpdated: 'October 30, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Our transparent Return & Refund Policy details conditions, timeframes, and procedural steps for returning hardware, claiming Dead-on-Arrival (DOA) replacements, undergoing inspection, and receiving refunds.',
    keyHighlights: [
      'Standard return window of [Requires Business Confirmation: 7 Calendar Days] from delivery for eligible uninstalled items.',
      'Prompt Dead-on-Arrival (DOA) replacement window of [Requires Business Confirmation: 48 Hours] from courier delivery.',
      'All returned equipment must be in original condition with intact security seals, original packaging, and serial numbers.',
      'Refunds are processed within [Requires Business Confirmation: 5 to 7 Working Days] post physical quality inspection.'
    ],
    sections: [
      {
        id: 'scope',
        number: '1',
        title: 'Scope of Return Coverage',
        content: [
          'This policy governs all return, exchange, replacement, and refund requests for surveillance cameras, network recorders (NVR/DVR), access control units, solar equipment, and accessories purchased directly through the Honeywell Products website or customer account portal.'
        ]
      },
      {
        id: 'window',
        number: '2',
        title: 'Return Eligibility Window',
        content: [
          '2.1 Standard Eligibility Window: Customers may initiate a return request within [Requires Business Confirmation: 7 Calendar Days (Standard) vs 14 Calendar Days] from the confirmed date of delivery.',
          '2.2 Dead on Arrival (DOA): Any hardware that fails to power on or exhibit fundamental factory functionality upon initial unboxing must be reported within [Requires Business Confirmation: 48 Hours] of delivery to qualify for priority DOA replacement.',
          '2.3 Transit Damage: Consignments arriving with exterior physical damage, crushed cartons, or broken security seals must be reported within 48 hours accompanied by unboxing photographs or video proof.'
        ]
      },
      {
        id: 'conditions',
        number: '3',
        title: 'Condition of Returned Products',
        content: [
          'To qualify for a refund or replacement under this policy, returned items must strictly satisfy the following criteria:',
          '• The product must be brand new, uninstalled, and free from mounting marks, screw scratches, cable trimming, or physical blemishes.',
          '• The product must be returned in its original manufacturer packaging, including all inner trays, anti-static bags, user manuals, mounting brackets, screws, and accessories.',
          '• Factory security holograms, barcode labels, and serial number stickers must be completely intact and matching order invoice records.',
          '• Firmware must remain at factory default; devices with modified, locked, or custom password-protected firmware will not be accepted.'
        ]
      },
      {
        id: 'non-returnable',
        number: '4',
        title: 'Non-Returnable & Non-Refundable Items',
        content: [
          'The following categories cannot be returned or refunded unless certified as Dead-on-Arrival (DOA) by our technical team:',
          '• Digital software licenses, firmware unlock keys, and video management system (VMS) cloud subscriptions once provisioned or downloaded.',
          '• Custom cut cabling, spool drums, optical fiber leads, or customized brackets tailored to project specifications.',
          '• Products damaged due to improper electrical voltages, lightning spikes, improper outdoor grounding, water ingress in non-weatherproof ratings, or unauthorized third-party servicing.',
          '• Consumables and items missing original serial number barcodes.'
        ]
      },
      {
        id: 'rma-procedure',
        number: '5',
        title: 'Return Merchandise Authorization (RMA) Workflow',
        content: [
          'All returns must undergo our formal RMA procedure before dispatching goods to our warehouse:',
          'Step 1: Log in to your Customer Account or visit our Warranty & Returns Portal (/warranty) or submit a ticket at (/service-request).',
          'Step 2: Enter your Order Reference (e.g. ORD-xxxxx) and product Serial Number.',
          'Step 3: State the reason for return and upload clear photographs of the product, packaging, and serial label.',
          'Step 4: Our technical review desk will evaluate your claim and issue an official RMA Number with return shipping instructions within 24-48 business hours.',
          'Important: Packages received at our warehouse without an authorized RMA Number clearly displayed on the outer shipping carton will be refused and returned at the sender\'s expense.'
        ]
      },
      {
        id: 'inspection',
        number: '6',
        title: 'Warehouse Quality Inspection (QC)',
        content: [
          'Upon receipt at our central logistics facility in Hyderabad, every returned unit undergoes bench inspection by certified technical engineers within 2 to 3 business days:',
          '• Verification of serial number integrity against the original invoice.',
          '• Inspection for physical damage, liquid exposure, burnt traces, or tampering.',
          '• Diagnostic operational bench testing for reported defects.',
          'If the inspection passes, your refund or replacement will be initiated immediately. If the product fails inspection due to customer-induced damage or missing parts, the unit will be returned to you with an inspection report.'
        ]
      },
      {
        id: 'refunds',
        number: '7',
        title: 'Refund Calculation, Modes & Processing Timelines',
        content: [
          '7.1 Refund Modes: Approved refunds are credited directly back to the original payment method used during checkout (Credit Card, Debit Card, Net Banking, or UPI). For NEFT/RTGS payments, refunds are remitted to the originating corporate bank account.',
          '7.2 Turnaround Timelines: Once QC approval is granted, refunds are instructed within [Requires Business Confirmation: 5 to 7 Working Days]. Bank processing times may add 2 to 4 business days before the credit reflects on your statement.',
          '7.3 Restocking Deductions: [Requires Business Confirmation: Zero restocking fees apply on DOA, defective, or incorrectly dispatched items. For commercial returns resulting from customer ordering errors or project plan cancellations, a restocking fee of 0% to 10% may be assessed to cover repackaging and reverse freight].'
        ]
      },
      {
        id: 'freight',
        number: '8',
        title: 'Return Shipping Costs',
        content: [
          '8.1 Defective / DOA / Incorrect Shipments: Honeywell Products will provide a prepaid reverse shipping pickup label or arrange courier pickup at our full expense.',
          '8.2 Discretionary / Ordering Error Returns: The customer is responsible for safe, insured reverse courier transit to our designated Hyderabad warehouse facility.'
        ]
      },
      {
        id: 'contact',
        number: '9',
        title: 'Returns Support & Warehouse Dispatch Address',
        content: [
          'For return assistance or dispatch queries:',
          '• Central Return Warehouse: Honeywell Products - RMA Inbound, 101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad - 500081, Telangana.',
          '• RMA Coordination Desk: info@honeywellproducts.com (Subject: ATTN: RMA Desk)',
          '• Telephone Hotline: 040 4855 5758 (Mon - Sat: 9:30 AM to 6:30 PM IST)'
        ]
      }
    ]
  },

  'shipping-delivery-policy': {
    slug: 'shipping-delivery-policy',
    title: 'Shipping & Delivery Policy',
    eyebrow: 'LOGISTICS, FREIGHT & TRANSIT',
    lastUpdated: 'October 30, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Our Shipping & Delivery Policy outlines order dispatch schedules, delivery zone timeframes, courier partnerships, free shipping thresholds, tracking capabilities, and transit damage protocols.',
    keyHighlights: [
      'Nationwide domestic shipping coverage across Tier-1, Tier-2, and regional industrial hubs throughout India.',
      'Orders for in-stock equipment are processed and dispatched within [Requires Business Confirmation: 24 to 48 Business Hours].',
      'Free standard ground shipping available on orders exceeding [Requires Business Confirmation: ₹5,000 (Subject to confirmation)].',
      'End-to-end consignment tracking integrated with our Order Tracking portal (/order-tracking).'
    ],
    sections: [
      {
        id: 'coverage',
        number: '1',
        title: 'Geographic Shipping Coverage',
        content: [
          '1.1 Domestic Pan-India Shipping: We ship commercial surveillance cameras, NVRs, accessories, and solar security solutions to eligible pin-codes across all Indian states and Union Territories.',
          '1.2 Special Economic Zones (SEZ) & Export: Shipments to SEZ zones, bonded warehouses, or international destinations are processed on an indent basis via our Bulk Quote desk.'
        ]
      },
      {
        id: 'processing',
        number: '2',
        title: 'Order Processing & Dispatch Schedules',
        content: [
          '2.1 Processing Timelines: Standard in-stock orders confirmed before 2:00 PM IST on working days (Monday to Friday, excluding national holidays) are prepared for dispatch within [Requires Business Confirmation: 24 to 48 Hours].',
          '2.2 Order Verification: Orders involving specialized commercial configurations, bulk project volume, or customized brackets undergo technical QA verification prior to packing, which may require an additional 24 hours.'
        ]
      },
      {
        id: 'transit-times',
        number: '3',
        title: 'Estimated Transit Times by Zone',
        content: [
          'Estimated transit times from warehouse dispatch to delivery at your doorstep:',
          '• Zone A (Telangana, Andhra Pradesh & Regional South Hubs): [Requires Business Confirmation: 2 to 3 Business Days].',
          '• Zone B (Metro Cities - Delhi NCR, Mumbai, Bengaluru, Chennai, Kolkata): [Requires Business Confirmation: 3 to 4 Business Days].',
          '• Zone C (Tier-2 & Tier-3 Rest of India): [Requires Business Confirmation: 4 to 6 Business Days].',
          '• Zone D (Northeast States, Jammu & Kashmir, Island Territories): [Requires Business Confirmation: 6 to 9 Business Days].',
          'Note: Transit timelines are estimates provided by logistics partners and may experience fluctuations during severe weather events, regional elections, or festival logistics peaks.'
        ]
      },
      {
        id: 'charges',
        number: '4',
        title: 'Shipping Charges & Free Freight Thresholds',
        content: [
          '4.1 Transparent Computation: Shipping charges are calculated dynamically at checkout based on gross volumetric weight, destination postal pin-code, and chosen logistics tier (Standard Surface vs Express Air Cargo).',
          '4.2 Free Shipping Eligibility: [Requires Business Confirmation: Orders with a cart subtotal exceeding ₹5,000 qualify for complimentary standard surface freight within standard delivery pin-codes].',
          '4.3 Heavy & Oversized Cargo: Palletized consignments, heavy battery banks, long solar mounting rails, and 1000m cable drums may require specialized heavy freight carrier quotation.'
        ]
      },
      {
        id: 'couriers',
        number: '5',
        title: 'Courier Partners & Consignment Tracking',
        content: [
          '5.1 Logistics Partners: Shipments are handled through premier logistics providers [Requires Business Confirmation: e.g., Blue Dart Express, Delhivery, DTDC, Gati KWE].',
          '5.2 Tracking Integration: As soon as your consignment is manifested, you will receive an automated dispatch notification containing the Waybill/Airway Bill (AWB) number and direct tracking URL.',
          '5.3 Self-Service Portal: You can also track shipment status anytime via our live Order Tracking Portal (/order-tracking).'
        ]
      },
      {
        id: 'delivery-checks',
        number: '6',
        title: 'Delivery Acceptance & Package Inspection',
        content: [
          '6.1 Visual Inspection Mandatory: Before signing the delivery run-sheet or providing an OTP to the courier executive, carefully inspect the outer carton.',
          '6.2 Tampered Packaging: If the exterior carton shows signs of crushing, punctures, water damage, or severed branded security tape, you should photograph the carton and either reject the consignment or write "Received in Damaged Condition" on the courier receipt.',
          '6.3 Incident Reporting: Notify our logistics desk at info@honeywellproducts.com within 48 hours of any delivery discrepancy.'
        ]
      },
      {
        id: 'undelivered',
        number: '7',
        title: 'Failed Delivery Attempts & Return to Origin (RTO)',
        content: [
          'Courier partners make up to three consecutive delivery attempts. If delivery fails due to incorrect customer address, recipient unavailability, or refusal to accept without legitimate cause, the parcel will be marked Return to Origin (RTO). Re-dispatch charges will apply for secondary shipment attempts.'
        ]
      },
      {
        id: 'contact',
        number: '8',
        title: 'Logistics Escalations Desk',
        content: [
          'For urgent tracking escalations or address adjustments prior to dispatch:',
          '• Logistics Desk Email: info@honeywellproducts.com (Subject: Dispatch Escalation - Order ID)',
          '• Hotline: 040 4855 5758 (Mon - Fri: 9:30 AM to 6:30 PM IST)'
        ]
      }
    ]
  },

  'cancellation-policy': {
    slug: 'cancellation-policy',
    title: 'Cancellation Policy',
    eyebrow: 'ORDER CANCELLATION GUIDELINES',
    lastUpdated: 'October 30, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Our straightforward Cancellation Policy outlines rules and procedures for cancelling orders before and after dispatch, handling bulk contract cancellations, and processing prompt refunds.',
    keyHighlights: [
      'Easy order cancellation via Customer Account or support hotline prior to warehouse dispatch.',
      'Full refund issued for pre-dispatch cancellations with zero penalty charges.',
      'Post-dispatch cancellation requests handled in accordance with reverse logistics procedures.',
      'Refunds credited back to original payment mode within [Requires Business Confirmation: 3 to 5 Business Days].'
    ],
    sections: [
      {
        id: 'overview',
        number: '1',
        title: 'Cancellation Overview',
        content: [
          'At Honeywell Products, we aim to ensure complete customer satisfaction. We recognize that project requirements, camera specifications, or site deployment schedules may change. This policy details how and when customer orders may be cancelled.'
        ]
      },
      {
        id: 'pre-dispatch',
        number: '2',
        title: 'Pre-Dispatch Cancellation (Storefront Orders)',
        content: [
          '2.1 Cancellation Window: You may cancel any standard online storefront order at zero penalty fee prior to warehouse packaging and generation of the courier shipping label.',
          '2.2 How to Cancel: Navigate to your Customer Account -> Orders (/account/orders), select the pending order, and click "Cancel Order". Alternatively, call our hotline at 040 4855 5758 with your Order ID.',
          '2.3 Pre-Dispatch Refund: 100% of the paid order amount will be refunded to your original payment method. [Requires Business Confirmation: Payment gateway transaction processing fees (if any, typically 0% to 2%) may or may not be waived based on corporate policy].'
        ]
      },
      {
        id: 'post-dispatch',
        number: '3',
        title: 'Post-Dispatch Cancellation & Consignment Refusal',
        content: [
          '3.1 In-Transit Orders: Once an order has been handed over to the courier partner and an AWB tracking number has been generated, it cannot be cancelled online as an active transit is underway.',
          '3.2 Consignment Refusal: If you no longer require the items, you may refuse the package upon physical delivery by the courier executive. Once the unopened consignment returns to our Hyderabad facility and passes transit integrity inspection, a refund will be processed.',
          '3.3 Deductions on In-Transit Refusal: [Requires Business Confirmation: Two-way shipping freight costs incurred will be deducted from the refund balance for discretionary post-dispatch cancellations].'
        ]
      },
      {
        id: 'b2b-cancellation',
        number: '4',
        title: 'Cancellation of Bulk Quotes & B2B Purchase Indents',
        content: [
          'Orders placed via custom commercial quotations, project procurement contracts, or advance supplier indents are subject to specific commercial terms stipulated in the signed contract. Custom manufactured or specifically procured items (e.g., custom optical focal lengths, high-capacity enterprise storage servers) cannot be cancelled once purchase commitments are formalized.'
        ]
      },
      {
        id: 'cancellation-by-seller',
        number: '5',
        title: 'Cancellation by Honeywell Products',
        content: [
          'We reserve the right to cancel an order under exceptional circumstances, including:',
          '• Unavailability of stock due to sudden factory obsolescence or supply chain disruption.',
          '• Inability to verify customer identity or detection of fraudulent payment risk.',
          '• Obvious pricing, tax computation, or technical specification typographical errors.',
          '• Non-serviceable delivery postal codes where no logistics partner provides coverage.',
          'In any such event, the customer will be notified immediately and issued a 100% refund without deduction.'
        ]
      },
      {
        id: 'refund-timeline',
        number: '6',
        title: 'Refund Timelines Post-Cancellation',
        content: [
          'Approved cancellation refunds are processed within [Requires Business Confirmation: 3 to 5 Business Days]. UPI and Net Banking credits typically reflect within 24 to 48 hours, while credit/debit card reversals depend on the issuing bank\'s cycle (typically 3 to 7 working days).'
        ]
      },
      {
        id: 'contact',
        number: '7',
        title: 'Cancellation Support Team',
        content: [
          'To request an urgent pre-dispatch cancellation:',
          '• Email: info@honeywellproducts.com (Subject: URGENT: Cancel Order #ORD-XXXXX)',
          '• Phone: 040 4855 5758 (Mon - Sat: 9:30 AM to 6:30 PM IST)'
        ]
      }
    ]
  },

  'warranty-policy': {
    slug: 'warranty-policy',
    title: 'Warranty Policy',
    eyebrow: 'MANUFACTURER LIMITED WARRANTY',
    lastUpdated: 'October 30, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'The Honeywell Products Limited Warranty protects your hardware against manufacturing defects in materials and workmanship, detailing coverage periods, exclusions, RMA ticket workflows, and repair/replacement terms.',
    keyHighlights: [
      'Comprehensive manufacturer warranty coverage on genuine Honeywell surveillance and security equipment.',
      'Self-service warranty verification and claims tracking via our interactive Warranty Portal (/warranty).',
      'Defined warranty durations by product class: [Requires Business Confirmation: CCTV Cameras (2-3 Years), NVR/DVR (2-3 Years), Accessories (1 Year)].',
      'Streamlined Return Merchandise Authorization (RMA) process with nationwide service coordination.'
    ],
    sections: [
      {
        id: 'scope',
        number: '1',
        title: 'Scope of Limited Warranty',
        content: [
          'This Limited Hardware Warranty is extended solely to the original commercial or consumer purchaser of genuine equipment bought through the Honeywell Products website or authorized distribution network. Warranty coverage is non-transferable.'
        ]
      },
      {
        id: 'durations',
        number: '2',
        title: 'Standard Warranty Periods by Category',
        content: [
          'Warranty coverage commences on the invoice date. Category-specific coverage terms [Requires Business Confirmation: Baseline durations subject to final manufacturer warranty schedule]:',
          '• Network IP Cameras & Analog CCTV Cameras: [Requires Business Confirmation: 24 to 36 Months (2-3 Years)].',
          '• Network Video Recorders (NVR) & Digital Video Recorders (DVR): [Requires Business Confirmation: 24 to 36 Months (2-3 Years)].',
          '• Solar Security Units & Integrated Photovoltaic Modules: [Requires Business Confirmation: 24 to 60 Months (2-5 Years on panel, 24 months on electronics)].',
          '• Power Supplies, PoE Switches, Media Converters: [Requires Business Confirmation: 12 Months (1 Year)].',
          '• Mounting Brackets, Passive Cables, Enclosures & Consumables: [Requires Business Confirmation: 6 to 12 Months].'
        ]
      },
      {
        id: 'verification',
        number: '3',
        title: 'Proof of Purchase & Serial Number Verification',
        content: [
          'All warranty claims require electronic verification of:',
          '• A valid GST Tax Invoice or Order Confirmation reference generated by our platform.',
          '• An unaltered, readable product serial number sticker located on the device housing.',
          'You may check your warranty status instantly at any time using our online Warranty Verification Tool (/warranty).'
        ]
      },
      {
        id: 'inclusions',
        number: '4',
        title: 'What This Warranty Covers',
        content: [
          'This warranty covers hardware failure resulting strictly from defects in factory materials or assembly craftsmanship under normal, recommended operating conditions as specified in the product\'s technical user manual.'
        ]
      },
      {
        id: 'exclusions',
        number: '5',
        title: 'Warranty Exclusions & Void Conditions',
        content: [
          'This warranty does not cover, and shall be rendered null and void by, any of the following occurrences:',
          '• Electrical damage resulting from lightning strikes, power surges, phase loss, or non-stabilized power supplies exceeding technical tolerances.',
          '• Liquid ingress, condensation, or corrosion in equipment not rated for IP66/IP67 weatherproofing, or resulting from improperly sealed cable gland entry points.',
          '• Physical damage, dropped equipment, cracked lenses, fractured chassis, or vandalized housings.',
          '• Unauthorized servicing, modification, opening of housing seals, or third-party repair attempts.',
          '• Installation of unofficial, modified, or incompatible third-party firmware.',
          '• Normal wear and tear, cosmetic scratching, or natural degradation of rechargeable battery capacities over extended charge cycles.'
        ]
      },
      {
        id: 'claim-workflow',
        number: '6',
        title: 'Warranty Claim & RMA Workflow',
        content: [
          'To file a warranty service claim:',
          'Step 1: Check your warranty eligibility online on our Warranty Portal (/warranty).',
          'Step 2: Submit a Service Request ticket at (/service-request) detailing the fault, along with troubleshooting steps attempted.',
          'Step 3: Our technical support engineering team will review the ticket within 24 business hours to attempt remote diagnostic resolution.',
          'Step 4: If a hardware defect is verified, an official Return Merchandise Authorization (RMA) ticket will be generated.',
          'Step 5: Safely dispatch the unit to our designated authorized service center. Upon bench repair or unit replacement, the serviced item will be shipped back to your address.'
        ]
      },
      {
        id: 'remedy',
        number: '7',
        title: 'Remedy Options: Repair, Replacement, or Credit',
        content: [
          'At the sole discretion of the manufacturer and authorized service center, defective products covered under warranty will be repaired using genuine components or replaced with a brand-new or factory-certified equivalent unit. If a discontinued model cannot be repaired or replaced, a commercial store credit of commensurate value will be issued.'
        ]
      },
      {
        id: 'out-of-warranty',
        number: '8',
        title: 'Out-of-Warranty Technical Services',
        content: [
          'Hardware beyond its warranty period or experiencing non-covered damages (e.g. lightning surge) may be serviced at our central repair facility subject to component availability, diagnostic evaluation, and formal customer quotation for repair labor and spare parts.'
        ]
      },
      {
        id: 'liability',
        number: '9',
        title: 'Limitation of Warranty Liability',
        content: [
          'Under no circumstances shall Honeywell Products or the manufacturer be liable for incidental, special, punitive, or consequential damages, including loss of recorded surveillance footage, data storage corruption, business interruption, or security breach damages.'
        ]
      },
      {
        id: 'contact',
        number: '10',
        title: 'Technical Support & Service Inquiries',
        content: [
          'For technical support, warranty lookups, or RMA tracking:',
          '• Warranty Portal: /warranty',
          '• Service Request Desk: /service-request',
          '• Email: info@honeywellproducts.com (Subject: Warranty Support)',
          '• Technical Helpline: 040 4855 5758 (Mon - Sat: 9:30 AM to 6:30 PM IST)'
        ]
      }
    ]
  },

  'cookie-policy': {
    slug: 'cookie-policy',
    title: 'Cookie Policy',
    eyebrow: 'BROWSER COOKIES & LOCAL STORAGE',
    lastUpdated: 'October 30, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Our Cookie Policy explains what cookies and browser storage technologies are, why we use them across our platform, what categories are deployed, and how you can manage or disable them.',
    keyHighlights: [
      'Deploys essential cookies required for shopping cart retention, secure login, and checkout.',
      'Anonymized analytics cookies help evaluate storefront performance and navigational flows.',
      'Full transparency regarding third-party payment gateway session security tokens.',
      'Detailed guidance for managing and clearing cookies in all major desktop and mobile browsers.'
    ],
    sections: [
      {
        id: 'what-are-cookies',
        number: '1',
        title: 'What Are Cookies & Web Storage?',
        content: [
          '1.1 Cookies: Cookies are small text files placed on your computer or mobile device by websites that you visit. They are widely used to make websites function efficiently and provide diagnostic information.',
          '1.2 Web Storage: In addition to cookies, our platform utilizes browser LocalStorage and SessionStorage to maintain your active shopping cart items, product comparison lists, and session tokens.'
        ]
      },
      {
        id: 'why-use',
        number: '2',
        title: 'Why We Use Cookies',
        content: [
          'Cookies enable our storefront to recognize your device, preserve items in your shopping cart while you navigate between categories, maintain your authenticated customer account session, and remember filter preferences.'
        ]
      },
      {
        id: 'categories',
        number: '3',
        title: 'Categories of Cookies Used',
        content: [
          '3.1 Strictly Necessary Cookies: Essential for core platform operation. Without these, features such as cart state, checkout authentication, and security token protection cannot function. These cannot be disabled.',
          '3.2 Functional & Preference Cookies: Remember your site settings, language preferences, and product comparison selections between visits.',
          '3.3 Performance & Analytics Cookies: [Requires Business Confirmation: Google Analytics 4 or equivalent telemetry tools] collect aggregate, anonymous data regarding page load speeds, visit counts, and navigation pathways to help us enhance platform usability.',
          '3.4 Security & Anti-Fraud Cookies: Deployed by our payment aggregators and cloud firewalls to safeguard checkout operations and detect bot scraping.'
        ]
      },
      {
        id: 'third-parties',
        number: '4',
        title: 'Third-Party Cookies & Service Integrations',
        content: [
          'When you interact with our platform, certain third-party providers may set cookies on your browser, including:',
          '• Payment Processors: Tokenize payment methods and detect transaction fraud.',
          '• Interactive Mapping: Google Maps APIs used to display our Hyderabad headquarters location.',
          '• Interactive Media Players: Embedded product walkthrough and interactive media players.'
        ]
      },
      {
        id: 'cookie-duration',
        number: '5',
        title: 'Session vs Persistent Cookies',
        content: [
          '• Session Cookies: Temporary cookies that exist only during your active browsing session and are erased when you close your browser.',
          '• Persistent Cookies: Remain on your device for a specified expiration period (typically between 30 days and 12 months) to remember your login preferences when you return.'
        ]
      },
      {
        id: 'managing-cookies',
        number: '6',
        title: 'How to Control & Disable Cookies',
        content: [
          'Most web browsers allow you to control and block cookies through their settings. You can configure your browser to reject all cookies or alert you when a cookie is placed:',
          '• Google Chrome: Settings -> Privacy and security -> Third-party cookies.',
          '• Mozilla Firefox: Options -> Privacy & Security -> Cookies and Site Data.',
          '• Microsoft Edge: Settings -> Cookies and site permissions -> Manage and delete cookies.',
          '• Apple Safari: Preferences -> Privacy -> Block all cookies.'
        ]
      },
      {
        id: 'impact',
        number: '7',
        title: 'Impact of Disabling Cookies',
        content: [
          'Please note that if you choose to block strictly necessary cookies, key interactive features of our e-commerce platform—including maintaining items in your cart, logging into your Customer Account, and completing online checkout—may cease to function properly.'
        ]
      },
      {
        id: 'contact',
        number: '8',
        title: 'Inquiries Regarding Cookie Usage',
        content: [
          'If you have questions regarding our use of cookies or tracking technologies:',
          '• Email: info@honeywellproducts.com',
          '• Address: 101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad - 500081, Telangana.'
        ]
      }
    ]
  },

  'grievance-redressal': {
    slug: 'grievance-redressal',
    title: 'Grievance Redressal Policy',
    eyebrow: 'STATUTORY CONSUMER PROTECTION & REDRESSAL',
    lastUpdated: 'October 30, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Established pursuant to the Consumer Protection (E-Commerce) Rules, 2020 and Information Technology Rules, our Grievance Redressal Policy details our 3-tier escalation matrix, appointed Grievance Officer, and statutory response SLAs.',
    keyHighlights: [
      'Full compliance with the Consumer Protection (E-Commerce) Rules, 2020 and Information Technology Act, 2000.',
      'Clear 3-tier escalation framework ensuring every customer concern receives prompt, fair resolution.',
      'Mandated statutory SLA: Grievance acknowledgment within 48 hours and final resolution within 30 days.',
      'Formal appointment particulars of the designated Grievance Redressal Officer.'
    ],
    sections: [
      {
        id: 'statutory-mandate',
        number: '1',
        title: 'Statutory Mandate & Purpose',
        content: [
          'In compliance with Rule 5(3)(j) of the Consumer Protection (E-Commerce) Rules, 2020 framed under the Consumer Protection Act, 2019, and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, Honeywell Products has instituted this dedicated Grievance Redressal Mechanism to ensure transparent, equitable, and timely resolution of consumer disputes.'
        ]
      },
      {
        id: 'definition',
        number: '2',
        title: 'Definition of Grievance',
        content: [
          'A grievance refers to any formal dissatisfaction, complaint, or dispute raised by a consumer or business customer regarding order fulfillment, quality of delivered equipment, billing discrepancies, refund processing delays, warranty claim disputes, or data privacy non-compliance.'
        ]
      },
      {
        id: 'escalation-matrix',
        number: '3',
        title: '3-Tier Grievance Escalation Matrix',
        content: [
          'We have established a progressive, multi-tiered escalation matrix to address issues efficiently:',
          '• Tier 1: Frontline Customer Care Desk',
          '  Contact via email at info@honeywellproducts.com or telephone at 040 4855 5758. Operating hours: Monday to Saturday, 9:30 AM to 6:30 PM IST. Typical resolution turnaround: 24 to 48 business hours.',
          '• Tier 2: Designated Grievance Redressal Officer',
          '  If your grievance is not resolved to your satisfaction by frontline support within 48 hours, or if you receive no response, you may escalate directly to our statutory Grievance Officer. Statutory acknowledgment SLA: Within 48 Hours. Resolution SLA: Within 15 business days.',
          '• Tier 3: Principal Nodal Officer / Executive Escalation',
          '  For complex commercial or statutory disputes remaining unresolved at Tier 2, matters are referred to the Principal Nodal Officer for definitive administrative resolution within the statutory ceiling of 30 days.'
        ]
      },
      {
        id: 'officer-particulars',
        number: '4',
        title: 'Designated Grievance Redressal Officer Details',
        content: [
          'In accordance with Indian statutory requirements, the details of our appointed Grievance Officer are as follows:',
          '• Operating Entity: Honeywell Products',
          '• Officer Name: [Requires Business & Legal Confirmation: Appointed Grievance Officer Name - e.g., Mr. K. R. Sharma / Compliance Head]',
          '• Designation: Grievance Redressal Officer & Head of Regulatory Compliance',
          '• Postal Address: 101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad - 500081, Telangana, India.',
          '• Direct Grievance Email: [Requires Business Confirmation: grievance@honeywellproducts.com / info@honeywellproducts.com]',
          '• Direct Office Contact: 040 4855 5758 (Ext: Grievance Cell)',
          '• Working Hours: Monday through Friday, 10:00 AM to 5:30 PM IST (excluding gazetted national holidays)'
        ]
      },
      {
        id: 'filing-requirements',
        number: '5',
        title: 'Requirements for Filing a Valid Grievance',
        content: [
          'To enable comprehensive investigation and prompt resolution, your grievance notice must include:',
          '1. Full name, registered corporate name (if applicable), and contact telephone number.',
          '2. Relevant Order Reference (e.g. ORD-xxxxx), Tax Invoice Number, or Service Ticket ID.',
          '3. Serial Number(s) of the affected hardware equipment.',
          '4. Clear, concise chronology of the dispute, including prior correspondence with Tier 1 Customer Care.',
          '5. Relevant supporting documents (photographs, unboxing videos, courier run-sheet receipts, or bank statements).'
        ]
      },
      {
        id: 'turnaround-sla',
        number: '6',
        title: 'Statutory Resolution Timelines (SLA)',
        content: [
          'Pursuant to the Consumer Protection (E-Commerce) Rules, 2020:',
          '• Acknowledgment: The Grievance Officer shall acknowledge receipt of any consumer grievance within forty-eight (48) hours of receipt, generating a unique Grievance Tracking Number.',
          '• Final Resolution: The Grievance Officer shall redress the grievance within thirty (30) days from the date of receipt of the formal grievance.'
        ]
      },
      {
        id: 'external-recourse',
        number: '7',
        title: 'External Legal Recourse & National Consumer Helpline',
        content: [
          'Customers retain their full legal rights to seek independent statutory remedies through the National Consumer Helpline (NCH - toll-free 1915 or consumerhelpline.gov.in), the Consumer Disputes Redressal Commission (District, State, or National Forum), or appropriate courts of competent jurisdiction.'
        ]
      }
    ]
  }
};
