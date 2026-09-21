import { Home, Building2, Factory, ShoppingBag, GraduationCap, HeartPulse } from 'lucide-react';

export const INDUSTRY_VERTICALS = {
  residential: {
    id: 'residential',
    name: 'Residential Security & Solar',
    icon: Home,
    eyebrow: 'HOME & RESIDENTIAL',
    subtitle: 'Smart home monitoring, outdoor perimeter defense, and residential solar solutions.',
    description: 'Comprehensive surveillance, smart motion alerts, and solar power setups tailored for villas, apartments, and gated residential communities.',
    categoryIds: ['wifi-cameras', 'dome-cameras', 'cctv-cameras', 'ip-cameras'],
    keywords: ['home', 'wifi', 'dome', 'indoor', 'wireless', 'smart camera'],
    relatedSolutionIds: ['security-surveillance', 'solar-solutions'],
    capabilities: [
      '24/7 Smart Outdoor & Entrance Surveillance',
      'Mobile App Remote Live Viewing & Alerts',
      'Solar Powered Perimeter & Garden Lighting',
      'Tamper-Proof Storage & Local NVR Backup'
    ],
    useCaseIds: ['home', 'apartment']
  },
  commercial: {
    id: 'commercial',
    name: 'Commercial & Office Buildings',
    icon: Building2,
    eyebrow: 'ENTERPRISE & COMMERCIAL',
    subtitle: 'Multi-floor access control, visitor management, and centralized security monitoring.',
    description: 'Scalable security systems designed for multi-tenant office complexes, commercial plazas, and enterprise workplaces.',
    categoryIds: ['ip-cameras', 'dome-cameras', 'nvr', 'networking', 'cctv-cameras'],
    keywords: ['office', 'commercial', 'ip camera', 'nvr', 'network', 'access'],
    relatedSolutionIds: ['integrated-solutions', 'smart-security', 'security-surveillance'],
    capabilities: [
      'Biometric & Card Access Control Systems',
      'Multi-Site Central Security Command Control',
      'Visitor & Contractor Management Integration',
      'High-Definition Corridor & Reception Monitoring'
    ],
    useCaseIds: ['office', 'shop']
  },
  industrial: {
    id: 'industrial',
    name: 'Industrial & Manufacturing Facilities',
    icon: Factory,
    eyebrow: 'INDUSTRIAL & WAREHOUSING',
    subtitle: 'Perimeter defense, explosion-proof hardware, thermal monitoring, and heavy solar arrays.',
    description: 'Ruggedized security architectures engineered for demanding manufacturing plants, logistics hubs, and industrial yards.',
    categoryIds: ['bullet-cameras', 'ptz-cameras', 'solar-panels', 'solar-batteries', 'nvr', 'surveillance-storage', 'solar-inverters'],
    keywords: ['industrial', 'factory', 'bullet', 'ptz', 'solar', 'storage', 'warehouse', 'heavy duty'],
    relatedSolutionIds: ['solar-solutions', 'security-surveillance', 'integrated-solutions'],
    capabilities: [
      'Perimeter Line Crossing & Intrusion Detection',
      'Weatherproof IP67 Hardware Housing',
      'Heavy-Duty Off-Grid Solar Power Arrays',
      '24/7 High-Capacity Industrial Video Storage'
    ],
    useCaseIds: ['factory', 'warehouse', 'construction-site']
  },
  retail: {
    id: 'retail',
    name: 'Retail Stores & Supermarkets',
    icon: ShoppingBag,
    eyebrow: 'RETAIL & SHOPPING',
    subtitle: 'Loss prevention, discreet store surveillance, checkout area coverage, and store security.',
    description: 'Protect inventory, secure checkout counters, and maintain store safety with unobtrusive dome and IP camera networks.',
    categoryIds: ['dome-cameras', 'cctv-cameras', 'ip-cameras', 'dvr'],
    keywords: ['retail', 'shop', 'store', 'dome', 'checkout', 'loss prevention', 'dvr'],
    relatedSolutionIds: ['smart-security', 'security-surveillance'],
    capabilities: [
      'Loss Prevention & Inventory Theft Deterrence',
      'Discreet Counter & Checkout Area Coverage',
      'Discreet Low-Profile Dome Camera Layouts',
      'Remote Multi-Store Surveillance Access'
    ],
    useCaseIds: ['retail-store', 'shop']
  },
  education: {
    id: 'education',
    name: 'Schools & University Campuses',
    icon: GraduationCap,
    eyebrow: 'CAMPUS & EDUCATION',
    subtitle: 'Campus-wide coverage, entrance gates, shared spaces, and student safety monitoring.',
    description: 'Comprehensive campus security layouts ensuring student safety across classrooms, corridors, sports grounds, and vehicle gates.',
    categoryIds: ['dome-cameras', 'ip-cameras', 'ptz-cameras', 'nvr', 'networking', 'bullet-cameras'],
    keywords: ['school', 'campus', 'education', 'gate', 'corridor', 'nvr', 'outdoor'],
    relatedSolutionIds: ['security-surveillance', 'integrated-solutions'],
    capabilities: [
      'Campus-Wide High-Definition Outdoor Coverage',
      'Automated Gate & Vehicle Entrance Monitoring',
      'Central Guard Desk Multi-Screen Monitoring',
      'High-Capacity Centralized NVR Recording'
    ],
    useCaseIds: ['school']
  },
  healthcare: {
    id: 'healthcare',
    name: 'Hospitals & Healthcare Facilities',
    icon: HeartPulse,
    eyebrow: 'HEALTHCARE & HOSPITALS',
    subtitle: 'Restricted area access control, emergency room monitoring, and privacy-compliant layouts.',
    description: 'Surveillance and access control solutions tailored for healthcare institutions, pharmacies, labs, and emergency entrances.',
    categoryIds: ['dome-cameras', 'ip-cameras', 'nvr', 'surveillance-storage', 'cctv-cameras'],
    keywords: ['hospital', 'healthcare', 'pharmacy', 'ward', 'restricted', 'storage', 'nvr'],
    relatedSolutionIds: ['integrated-solutions', 'security-surveillance'],
    capabilities: [
      'Pharmacy & Laboratory Restricted Door Access',
      '24/7 Ward & Emergency Corridor Monitoring',
      'Uninterrupted Backup Power Integration Support',
      'High-Reliability Local Storage Compliance'
    ],
    useCaseIds: ['hospital']
  }
};

export const getIndustryVertical = (id) => {
  const cleanId = String(id || '').toLowerCase();
  return INDUSTRY_VERTICALS[cleanId] || INDUSTRY_VERTICALS['residential'];
};
