const SOFTWARE_KEY = 'sat_catalog_software';

export const initialSoftware = [
  {
    id: 1,
    productId: '1',
    productName: '4MP IP Bullet Camera',
    productModel: 'HN-IPB-4MP',
    softwareName: 'Honeywell Device Manager',
    description: 'Centralized utility to discover, configure, update firmware, and manage Honeywell IP cameras and network video recorders.',
    softwareType: 'Configuration Tool',
    version: '2.4.1',
    platform: 'Windows',
    architecture: '64-bit',
    fileUrl: '/uploads/software/honeywell-device-manager-v2.4.1.exe',
    externalUrl: '',
    fileSize: 89128960, // ~85 MB
    releaseDate: '2026-09-01',
    releaseNotes: '• Improved device auto-discovery protocol across subnet ranges.\n• Fixed IP conflict prompt handling.\n• Updated security certificate validation for ONVIF profiles.',
    minimumRequirements: 'Windows 10 / 11 (64-bit), 4GB RAM, .NET Framework 4.8+',
    status: 'Active',
    isFeatured: true,
    sortOrder: 1,
  },
  {
    id: 2,
    productId: '1',
    productName: '4MP IP Bullet Camera',
    productModel: 'HN-IPB-4MP',
    softwareName: 'IP Camera Firmware Flash Utility',
    description: 'Official firmware update package for 4MP IP Bullet Series cameras to enhance low-light AI tracking and stability.',
    softwareType: 'Firmware',
    version: '1.0.8',
    platform: 'Firmware',
    architecture: 'ARM64',
    fileUrl: '/uploads/software/hn-ipb-4mp-v1.0.8.bin',
    externalUrl: '',
    fileSize: 44040192, // ~42 MB
    releaseDate: '2026-08-15',
    releaseNotes: '• Enhanced Smart IR algorithm under extreme dark environments.\n• Optimized H.265+ bitrate compression efficiency by 15%.\n• Security patch for remote stream authentication.',
    minimumRequirements: 'Compatible with Honeywell 4MP IP Bullet Camera series (Model: HN-IPB-4MP)',
    status: 'Active',
    isFeatured: false,
    sortOrder: 2,
  },
  {
    id: 3,
    productId: '2',
    productName: 'High-Efficiency Solar Module 550W',
    productModel: 'HN-SOL-550W',
    softwareName: 'Honeywell Solar Monitoring Mobile App (Android)',
    description: 'Real-time solar generation monitoring and telemetry tool for Honeywell smart inverter & panel setups.',
    softwareType: 'Mobile Application',
    version: '3.1.0',
    platform: 'Android',
    architecture: 'ARM',
    fileUrl: '',
    externalUrl: 'https://play.google.com/store/apps/details?id=com.honeywell.solar.monitor',
    fileSize: 25165824, // ~24 MB
    releaseDate: '2026-07-20',
    releaseNotes: '• Redesigned dashboard widgets for instantaneous kW output.\n• Added push notification alerts for grid disconnect and thermal warnings.',
    minimumRequirements: 'Android 8.0 or higher',
    status: 'Active',
    isFeatured: true,
    sortOrder: 1,
  },
  {
    id: 4,
    productId: '3',
    productName: 'Smart Access Control Controller',
    productModel: 'HN-ACC-100',
    softwareName: 'Honeywell Access Manager Desktop SDK & Driver',
    description: 'Windows driver and API integration SDK for Honeywell Access Control Controllers and RFID card readers.',
    softwareType: 'Driver',
    version: '4.0.2',
    platform: 'Windows',
    architecture: 'Universal',
    fileUrl: '/uploads/software/access-manager-sdk-v4.0.2.zip',
    externalUrl: '',
    fileSize: 120586240, // ~115 MB
    releaseDate: '2026-06-10',
    releaseNotes: '• Support for Wiegand and OSDP v2.2 card reader protocols.\n• Added C# and Python sample integration code.',
    minimumRequirements: 'Windows 10/11 or Windows Server 2019/2022',
    status: 'Active',
    isFeatured: false,
    sortOrder: 1,
  }
];

export const getSoftwareFromStore = () => [];

export const saveSoftwareToStore = () => {};

export const getSoftwareByProductIdFromStore = () => [];

export const upsertSoftwareInStore = (softwareData) => softwareData;

export const deleteSoftwareFromStore = () => {};
