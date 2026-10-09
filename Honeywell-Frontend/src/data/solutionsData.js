import { categoryImages } from './imageLibrary';

export const SOLUTION_PILLARS = {
  'security-surveillance': {
    id: 'security-surveillance',
    title: 'Security & Surveillance',
    eyebrow: 'HIGH-DEFINITION MONITORING',
    subtitle: 'Comprehensive IP camera networks, localized recording, and high-capacity storage topology.',
    description: 'Protect your premises with optical and thermal security cameras engineered for 24/7 continuous surveillance, crystal clear video capture, and high-reliability local storage.',
    architecture: [
      { step: '01', title: 'Video Capture', desc: 'IP Bullet, Dome & PTZ Security Cameras' },
      { step: '02', title: 'Network Transit', desc: 'PoE Network Switches & Gigabit Infrastructure' },
      { step: '03', title: 'Recording & Storage', desc: 'High-Capacity NVRs & Surveillance Hard Drives' },
      { step: '04', title: 'Central VMS', desc: 'Video Management System & Multi-Screen Monitor Control' },
    ],
    categoryIds: ['ip-cameras', 'dome-cameras', 'bullet-cameras', 'ptz-cameras', 'nvr', 'dvr', 'surveillance-storage', 'networking'],
    recommendedIndustryIds: ['residential', 'commercial', 'industrial', 'retail', 'education', 'healthcare'],
    applicationIds: ['home', 'apartment', 'shop', 'office', 'retail-store', 'school', 'hotel'],
    environmentSubtitle: 'Select the environment where you need reliable high-definition 24/7 video surveillance.',
    verifiedCapabilities: [
      '24/7 Continuous Ultra-HD Recording',
      'Infrared & Smart Night Vision',
      'PoE Power over Ethernet Connectivity',
      'High-Capacity RAID & NVR Storage Support',
      'Weatherproof IP66/IP67 Hardware Housing'
    ],
  },
  'smart-security': {
    id: 'smart-security',
    title: 'Smart Security & AI Analytics',
    eyebrow: 'INTELLIGENT SURVEILLANCE',
    subtitle: 'AI-driven motion analytics, automated alerts, and target classification.',
    description: 'Transform passive monitoring into proactive security with intelligent camera analytics. Detect perimeter crossings, classify human vs vehicle motion, and trigger instant security notifications.',
    architecture: [
      { step: '01', title: 'Smart Sensor', desc: 'AI-Enabled IP Cameras & Motion Analytics' },
      { step: '02', title: 'Real-Time Analysis', desc: 'On-Edge Video Analytics Engine' },
      { step: '03', title: 'Alert Processing', desc: 'Automated Intrusion & Line-Crossing Triggers' },
      { step: '04', title: 'Security Dispatch', desc: 'Push Notifications & Mobile / Guard Desk Alerts' },
    ],
    categoryIds: ['ip-cameras', 'ptz-cameras', 'nvr', 'networking'],
    recommendedIndustryIds: ['commercial', 'industrial', 'retail', 'education'],
    applicationIds: ['office', 'retail-store', 'warehouse', 'factory', 'school', 'hospital'],
    environmentSubtitle: 'Select the environment where intelligent motion detection and automated alerts enhance security.',
    verifiedCapabilities: [
      'Intrusion & Line-Crossing Detection',
      'Human & Vehicle Motion Classification',
      'Automated Security Push Notifications',
      'Smart Motion Event Indexing & Quick Search'
    ],
  },
  'solar-solutions': {
    id: 'solar-solutions',
    title: 'Solar Solutions & Off-Grid Security',
    eyebrow: 'REMOTE & HYBRID POWERED',
    subtitle: 'Off-grid solar security camera kits, battery storage, and hybrid solar power setups.',
    description: 'Deploy 24/7 security monitoring anywhere without grid power dependencies. Ideal for construction sites, farms, industrial perimeters, and remote infrastructure.',
    architecture: [
      { step: '01', title: 'Solar Generation', desc: 'High-Efficiency Monocrystalline Solar Panels' },
      { step: '02', title: 'Charge Control', desc: 'MPPT Solar Charge Controller System' },
      { step: '03', title: 'Energy Storage', desc: 'Lithium / Deep-Cycle Solar Battery Bank' },
      { step: '04', title: 'Remote Monitoring', desc: '4G / Wireless Solar Camera Unit' },
    ],
    categoryIds: ['solar-cameras', 'solar-panels', 'solar-inverters', 'solar-batteries', 'solar-controllers', '4g-cameras'],
    recommendedIndustryIds: ['industrial', 'residential', 'commercial'],
    applicationIds: ['farm', 'construction-site', 'warehouse', 'factory', 'home'],
    environmentSubtitle: 'Select the environment where off-grid solar or 4G power can support remote security operations.',
    verifiedCapabilities: [
      'Zero Grid Power Dependency (100% Off-Grid Solar Setup)',
      '4G LTE Cellular & Wireless Video Transmission',
      'Deep-Cycle Battery Storage Autonomy',
      'Weatherproof All-Weather Solar Hardware'
    ],
  },
  'integrated-solutions': {
    id: 'integrated-solutions',
    title: 'Integrated Security & Access Control',
    eyebrow: 'UNIFIED ENTERPRISE CONTROL',
    subtitle: 'Convergence of video surveillance, biometric access control, and centralized management.',
    description: 'Unify video monitoring, door access control, visitor logs, and perimeter security into a single management platform for complete operational oversight.',
    architecture: [
      { step: '01', title: 'Access & Camera Sensors', desc: 'Biometric Readers, Door Locks & IP Cameras' },
      { step: '02', title: 'Access Controller', desc: 'Central Access Panel & Door Controllers' },
      { step: '03', title: 'Unified Server', desc: 'Video + Access Integration Server' },
      { step: '04', title: 'Command Center', desc: 'Unified Guard Desk Dashboard & Audit Logs' },
    ],
    categoryIds: ['ip-cameras', 'dome-cameras', 'nvr', 'networking', 'cctv-accessories'],
    recommendedIndustryIds: ['commercial', 'industrial', 'healthcare', 'education'],
    applicationIds: ['office', 'hospital', 'factory', 'warehouse', 'school', 'hotel', 'apartment'],
    environmentSubtitle: 'Select the environment requiring unified door access control, visitor tracking, and central audit logs.',
    verifiedCapabilities: [
      'Biometric & Card Door Access Control',
      'Unified Video & Access Event Logs',
      'Multi-Site Enterprise Management',
      'Centralized Visitor & Contractor Tracking'
    ],
  }
};

export const getSolutionPillar = (id) => {
  const cleanId = String(id || '').toLowerCase();
  return SOLUTION_PILLARS[cleanId] || SOLUTION_PILLARS['security-surveillance'];
};
