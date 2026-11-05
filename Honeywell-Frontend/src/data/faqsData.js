/**
 * Honeywell Products E-Commerce Platform
 * Frequently Asked Questions (FAQ) Data Structure
 *
 * Organised into 7 verified customer-facing categories:
 *  1. General & Product Selection
 *  2. CCTV & Surveillance
 *  3. Downloads & Software
 *  4. Installation & Technical Support
 *  5. Warranty & Returns
 *  6. Orders & Delivery
 *  7. Business & Distributor
 *
 * All operational, commercial, or SLA parameters awaiting formal business/legal
 * confirmation are explicitly annotated with "[Requires Business Confirmation: ...]".
 */

export const FAQ_CATEGORIES = [
  'All',
  'General & Product Selection',
  'CCTV & Surveillance',
  'Downloads & Software',
  'Installation & Technical Support',
  'Warranty & Returns',
  'Orders & Delivery',
  'Business & Distributor',
];

export const faqsData = [
  // ── 1. General & Product Selection ──────────────────────────────
  {
    id: 1,
    category: 'General & Product Selection',
    code: 'GEN_AUTHENTICITY',
    question: 'Are all Honeywell security and surveillance products on this website genuine?',
    answer: 'Yes. All products listed on this platform are authentic Honeywell commercial security and surveillance equipment sourced through verified distribution channels. Each product includes genuine manufacturer serial numbers verifiable via our Warranty Lookup (/warranty) portal.',
    requiresConfirmation: false,
  },
  {
    id: 2,
    category: 'General & Product Selection',
    code: 'GEN_SELECTION',
    question: 'How can I choose the right security camera or NVR for my facility?',
    answer: 'You can use our interactive Product Finder (/product-finder) to filter cameras by resolution, form factor (dome, bullet, PTZ, or turret), and environment (indoor/outdoor). You can also use our Product Comparison Tool (/compare) to compare models side-by-side or explore curated Industry Solutions (/solutions).',
    requiresConfirmation: false,
  },
  {
    id: 3,
    category: 'General & Product Selection',
    code: 'GEN_BULK_QUOTE',
    question: 'Can I request a customized quotation for enterprise or bulk orders?',
    answer: 'Yes. Institutional buyers, contractors, and project integrators can request tailored quotes by visiting our Contact & Quote Desk (/contact) or by submitting a bulk request. Our commercial sales desk responds within [Requires Business Confirmation: 1 to 2 business days].',
    requiresConfirmation: true,
    confirmationDetails: 'Sales desk response SLA (1 to 2 business days).',
  },
  {
    id: 4,
    category: 'General & Product Selection',
    code: 'GEN_ONVIF',
    question: 'Do your cameras and NVRs comply with ONVIF and open video standards?',
    answer: 'Most Honeywell commercial IP cameras and Network Video Recorders support ONVIF Profile S, G, and T standards for seamless interoperability with third-party VMS platforms. Please verify specific profile compliance on the individual product datasheet available in our Downloads Center (/downloads).',
    requiresConfirmation: false,
  },
  {
    id: 5,
    category: 'General & Product Selection',
    code: 'GEN_CASE_STUDIES',
    question: 'Where can I view case studies and industry-specific security deployments?',
    answer: 'Detailed architecture blueprints and customer deployments across education, healthcare, banking, retail, and commercial facilities are available on our Solutions (/solutions) and Industries (/industries) pages.',
    requiresConfirmation: false,
  },

  // ── 2. CCTV & Surveillance ──────────────────────────────────────
  {
    id: 6,
    category: 'CCTV & Surveillance',
    code: 'CCTV_IP_VS_ANALOG',
    question: 'What is the difference between IP cameras and HD analog (DVR) systems?',
    answer: 'IP (Network) cameras transmit high-definition digital video over Ethernet cables (PoE) with advanced onboard analytics, remote web management, and direct integration with NVRs. Analog HD systems use coaxial cabling connected to DVRs and are suitable for legacy infrastructure upgrades. Explore our full range of Network IP Cameras (/products?category=ip-camera) and NVRs (/products?category=nvr).',
    requiresConfirmation: false,
  },
  {
    id: 7,
    category: 'CCTV & Surveillance',
    code: 'CCTV_NIGHT_VISION',
    question: 'How do Night Vision and Color Hunter / Low-Light technologies work on Honeywell cameras?',
    answer: 'Honeywell surveillance cameras utilize smart infrared (IR) LEDs for black-and-white night vision in complete darkness (0 Lux), while select low-light models feature wide-aperture lenses and high-sensitivity sensors to deliver vivid full-color video even in dim lighting conditions. Check individual camera specifications on our Product Catalog (/products).',
    requiresConfirmation: false,
  },
  {
    id: 8,
    category: 'CCTV & Surveillance',
    code: 'CCTV_WEATHERPROOF',
    question: 'What weatherproofing and vandal-resistance ratings do outdoor cameras feature?',
    answer: 'Outdoor Honeywell dome and bullet cameras typically carry IP66 or IP67 ingress protection ratings against dust and heavy rain, and IK10 vandal-resistance ratings for impact protection. Check the specifications tab on the Product Details (/products) page for exact model ratings.',
    requiresConfirmation: false,
  },
  {
    id: 9,
    category: 'CCTV & Surveillance',
    code: 'CCTV_STORAGE',
    question: 'How much storage capacity do I need for my NVR/DVR system?',
    answer: 'Storage requirements depend on camera count, resolution (e.g., 2MP, 4MP, 8MP/4K), recording mode (continuous vs. motion-activated), frame rate (FPS), and video compression (H.264 vs. H.265/H.265+ Smart Codec). You can consult our technical advisors via Contact Support (/contact) for sizing calculations.',
    requiresConfirmation: false,
  },
  {
    id: 10,
    category: 'CCTV & Surveillance',
    code: 'CCTV_REMOTE_VIEW',
    question: 'Can I monitor my CCTV cameras remotely from a mobile phone or web browser?',
    answer: 'Yes. Honeywell NVRs and standalone IP cameras support remote live streaming and playback through dedicated mobile apps and secure web interfaces, subject to network setup and port forwarding or cloud connectivity. App download links are available in our Software Downloads (/resources/software) hub.',
    requiresConfirmation: false,
  },

  // ── 3. Downloads & Software ─────────────────────────────────────
  {
    id: 11,
    category: 'Downloads & Software',
    code: 'DL_MANUALS',
    question: 'Where can I download official datasheets, user manuals, and architectural specifications?',
    answer: 'Comprehensive technical documentation, CAD drawings, compliance certificates, and installation manuals can be downloaded directly from our Downloads Center (/downloads) or under the "Documents" tab on any Product Details (/products) page.',
    requiresConfirmation: false,
  },
  {
    id: 12,
    category: 'Downloads & Software',
    code: 'DL_VMS_TOOLS',
    question: 'Where can I download Video Management Software (VMS) and Device Search tools?',
    answer: 'Central management software (CMS/VMS), camera discovery and search utilities, IP configuration tools, and player utilities are hosted on our dedicated Software Downloads (/resources/software) hub.',
    requiresConfirmation: false,
  },
  {
    id: 13,
    category: 'Downloads & Software',
    code: 'DL_FIRMWARE',
    question: 'How do I obtain the latest firmware updates for my security cameras and recorders?',
    answer: 'Device firmware binaries are published on the Downloads Center (/downloads) under the Firmware section. Always verify your device\'s exact hardware revision and model number before applying firmware updates.',
    requiresConfirmation: false,
  },
  {
    id: 14,
    category: 'Downloads & Software',
    code: 'DL_LICENSING',
    question: 'Do I need a software license to use Honeywell Video Management client software?',
    answer: 'Basic device discovery and standard viewing utilities are provided complimentary with hardware purchase. Advanced multi-site VMS editions and AI analytics packages may require commercial licensing [Requires Business Confirmation: License tiers and activation policies subject to corporate agreement].',
    requiresConfirmation: true,
    confirmationDetails: 'VMS software license tiers and activation rules.',
  },
  {
    id: 15,
    category: 'Downloads & Software',
    code: 'DL_OS_SUPPORT',
    question: 'What operating systems are supported by Honeywell surveillance management software?',
    answer: 'Most desktop configuration utilities and client software support 64-bit Windows 10/11 and Windows Server environments. Mobile monitoring apps are available for Android and iOS. Check the system requirements listed in each download package on our Software Downloads (/resources/software) page.',
    requiresConfirmation: false,
  },

  // ── 4. Installation & Technical Support ─────────────────────────
  {
    id: 16,
    category: 'Installation & Technical Support',
    code: 'TECH_INSTALLATION',
    question: 'Does this website provide on-site installation and cabling services?',
    answer: 'Direct physical installation is not automatically bundled with e-commerce purchases unless specified in a commercial turnkey contract. Installations are typically performed by authorized system integrators and certified partner networks [Requires Business Confirmation: On-site installation availability varies by region and project scale]. For recommendations, submit an inquiry via our Contact Page (/contact).',
    requiresConfirmation: true,
    confirmationDetails: 'On-site installation scope and regional availability.',
  },
  {
    id: 17,
    category: 'Installation & Technical Support',
    code: 'TECH_SERVICE_TICKET',
    question: 'How do I submit a hardware repair or technical service ticket?',
    answer: 'You can submit an online service request directly via our Service & Repair Request (/service-request) portal. Provide your product model, serial number, and a detailed description of the issue to receive a trackable support ticket number.',
    requiresConfirmation: false,
  },
  {
    id: 18,
    category: 'Installation & Technical Support',
    code: 'TECH_RESPONSE_TIME',
    question: 'What is the expected response time for technical support tickets?',
    answer: 'Our technical assistance desk aims to review submitted tickets within [Requires Business Confirmation: 4 to 8 business hours during standard operational timings]. Emergency enterprise support is governed by project-specific SLAs.',
    requiresConfirmation: true,
    confirmationDetails: 'Technical support response SLA (4 to 8 business hours).',
  },
  {
    id: 19,
    category: 'Installation & Technical Support',
    code: 'TECH_PASSWORD_RESET',
    question: 'How can I reset an IP camera or NVR if the administrator password is forgotten?',
    answer: 'Most models have a physical hardware reset button located near the SD card slot or inside the camera housing that restores factory defaults when held for 10-15 seconds while powered. For enterprise units without physical buttons, please submit a ticket on our Service Request (/service-request) page with proof of ownership for a secure recovery key.',
    requiresConfirmation: false,
  },
  {
    id: 20,
    category: 'Installation & Technical Support',
    code: 'TECH_POE_BUDGET',
    question: 'How do I calculate the PoE power budget for my security camera network switch?',
    answer: 'Calculate total power consumption by summing the maximum wattage ratings of all connected IP cameras (typically 6W to 12W for standard IR cameras; up to 30W-60W for high-power PTZ cameras with heaters). Ensure your PoE switch power budget exceeds total camera draw by at least 20%. Consult our Downloads Center (/downloads) for camera power specifications.',
    requiresConfirmation: false,
  },

  // ── 5. Warranty & Returns ───────────────────────────────────────
  {
    id: 21,
    category: 'Warranty & Returns',
    code: 'WAR_DURATION',
    question: 'How long is the manufacturer warranty on Honeywell surveillance equipment?',
    answer: 'Hardware warranty durations vary by product category [Requires Business Confirmation: Typically 2 to 3 Years on IP Cameras and NVRs, and 1 Year on accessories and power supplies]. Review full coverage details in our official Warranty Policy (/warranty-policy) or check your device status using the Warranty Lookup Tool (/warranty).',
    requiresConfirmation: true,
    confirmationDetails: 'Product-tier warranty durations (2-3 years cameras/NVRs, 1 year accessories).',
  },
  {
    id: 22,
    category: 'Warranty & Returns',
    code: 'WAR_RETURN_WINDOW',
    question: 'What is the return and replacement window for defective or damaged items?',
    answer: 'Eligible products with transit damage, manufacturing defects, or Dead-on-Arrival (DOA) conditions must be reported within [Requires Business Confirmation: 7 calendar days from delivery]. Returned units must include original packaging, accessories, and invoice tags. Details are specified in our Return & Refund Policy (/return-refund-policy).',
    requiresConfirmation: true,
    confirmationDetails: 'Return and replacement claim window (7 calendar days).',
  },
  {
    id: 23,
    category: 'Warranty & Returns',
    code: 'WAR_EXCLUSIONS',
    question: 'What damages or issues are excluded from warranty coverage?',
    answer: 'Warranty does not cover physical damage, lightning or electrical power surges, liquid submersion (unless rated), unauthorized tampering, incorrect voltage input, or unauthorized firmware modifications. Refer to Section 3 of our Warranty Policy (/warranty-policy) for complete exclusions.',
    requiresConfirmation: false,
  },
  {
    id: 24,
    category: 'Warranty & Returns',
    code: 'WAR_REFUND_TIME',
    question: 'How are refunds processed and what is the typical processing timeframe?',
    answer: 'Approved refunds are initiated after technical inspection of the returned hardware at our facility. Credits are refunded to the original payment method within [Requires Business Confirmation: 5 to 7 business days from RMA inspection approval], as detailed in our Return & Refund Policy (/return-refund-policy).',
    requiresConfirmation: true,
    confirmationDetails: 'Refund disbursement SLA (5 to 7 business days post-inspection).',
  },
  {
    id: 25,
    category: 'Warranty & Returns',
    code: 'WAR_RMA_PROCESS',
    question: 'How do I obtain a Return Merchandise Authorization (RMA) number?',
    answer: 'Submit your RMA claim through the Warranty & Returns Portal (/warranty) or open a ticket on the Service Request (/service-request) page. Once verified by our support engineering desk, an official RMA authorization code and return instructions will be emailed to you.',
    requiresConfirmation: false,
  },

  // ── 6. Orders & Delivery ────────────────────────────────────────
  {
    id: 26,
    category: 'Orders & Delivery',
    code: 'ORD_PAYMENT_METHODS',
    question: 'What payment methods are accepted on this e-commerce storefront?',
    answer: 'We accept online payments via authorized commercial credit/debit cards, Net Banking, UPI, and approved payment gateways. For corporate purchase orders, direct NEFT/RTGS bank transfers are available upon proforma invoice generation. Full terms are outlined in our Terms & Conditions (/terms-and-conditions).',
    requiresConfirmation: false,
  },
  {
    id: 27,
    category: 'Orders & Delivery',
    code: 'ORD_DISPATCH_TIME',
    question: 'How long does order dispatch and delivery usually take?',
    answer: 'In-stock security equipment is processed and dispatched within [Requires Business Confirmation: 24 to 48 business hours]. Delivery across metropolitan and Tier-1 regions typically takes [Requires Business Confirmation: 3 to 5 business days], while regional destinations may require [Requires Business Confirmation: 5 to 7 business days]. Review our Shipping & Delivery Policy (/shipping-delivery-policy).',
    requiresConfirmation: true,
    confirmationDetails: 'Dispatch timeframe (24-48 hrs) and regional transit durations (3-7 days).',
  },
  {
    id: 28,
    category: 'Orders & Delivery',
    code: 'ORD_TRACKING',
    question: 'How can I track my order once it has been dispatched?',
    answer: 'Once your consignment is handed over to our insured logistics partner, tracking numbers are updated in your Customer Account (/account/orders) and live transit updates can be viewed on our Order Tracking (/order-tracking) page.',
    requiresConfirmation: false,
  },
  {
    id: 29,
    category: 'Orders & Delivery',
    code: 'ORD_CANCELLATION',
    question: 'Can I cancel or modify an order after it has been placed?',
    answer: 'Orders can be cancelled prior to warehouse dispatch by visiting your Customer Orders (/account/orders) page or by contacting customer assistance. Once an order is handed over to courier carriers, cancellation is subject to our Cancellation Policy (/cancellation-policy).',
    requiresConfirmation: false,
  },
  {
    id: 30,
    category: 'Orders & Delivery',
    code: 'ORD_GST_INVOICE',
    question: 'Are all purchases accompanied by a GST-compliant tax invoice?',
    answer: 'Yes. Every order includes a formal GST-compliant commercial tax invoice displaying HSN codes, IGST/CGST/SGST breakdowns, and your registered company GSTIN when entered during Checkout (/checkout). Invoices can also be re-downloaded from your Customer Account (/account/orders).',
    requiresConfirmation: false,
  },

  // ── 7. Business & Distributor ───────────────────────────────────
  {
    id: 31,
    category: 'Business & Distributor',
    code: 'BIZ_PARTNER_REG',
    question: 'How can system integrators, resellers, or dealers register as authorized partners?',
    answer: 'System integrators, security contractors, and dealers can apply for partner registration by visiting our Partner Benefits (/partner-benefits) page and completing the channel onboarding form. Authorized partners gain access to dealer pricing, dedicated account managers, and priority inventory.',
    requiresConfirmation: false,
  },
  {
    id: 32,
    category: 'Business & Distributor',
    code: 'BIZ_DISTRIBUTOR_PRICING',
    question: 'How do registered partners access distributor pricing and order placement?',
    answer: 'Approved partners can log into their dedicated B2B environment through the Partner Login Portal (/partner/login) to view wholesale discount schedules, credit limits, and submit institutional purchase orders via the Partner Dashboard (/partner/dashboard).',
    requiresConfirmation: false,
  },
  {
    id: 33,
    category: 'Business & Distributor',
    code: 'BIZ_TENDER_SUPPORT',
    question: 'Can your engineering team provide project bid specifications and tenders support?',
    answer: 'Yes. We assist government and commercial contractors with Honeywell product specification compliance sheets, tender qualification documentation, and architect/engineer (A&E) specification packages. Submit your tender requirements via our Contact Us (/contact) desk.',
    requiresConfirmation: false,
  },
  {
    id: 34,
    category: 'Business & Distributor',
    code: 'BIZ_CREDIT_TERMS',
    question: 'What credit terms or credit periods are available for corporate accounts?',
    answer: 'Revolving credit terms and net payment facilities (e.g., Net 30 days) are evaluated on a case-by-case basis for verified institutional clients with established annual volume [Requires Business Confirmation: Commercial credit terms subject to credit appraisal and corporate approval]. Inquire with our Business Desk (/business).',
    requiresConfirmation: true,
    confirmationDetails: 'Credit lines and Net-30 payment eligibility terms.',
  },
];

/**
 * Filter FAQs by category.
 */
export function getFaqsByCategory(category) {
  if (!category || category === 'All') {
    return faqsData;
  }
  const cleanCat = category.trim().toLowerCase();
  return faqsData.filter((item) => item.category.toLowerCase() === cleanCat);
}

/**
 * Search FAQs by query across question, answer, category, and code.
 */
export function searchFaqs(query, category = 'All') {
  const base = getFaqsByCategory(category);
  if (!query || !query.trim()) {
    return base;
  }
  const q = query.trim().toLowerCase();
  return base.filter(
    (item) =>
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.code && item.code.toLowerCase().includes(q))
  );
}
