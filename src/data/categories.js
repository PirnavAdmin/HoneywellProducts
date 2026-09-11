export const categories = [
  { id: 'cctv-cameras', name: 'CCTV Cameras', slug: 'cctv-cameras', description: 'IP, PTZ, Dome & Bullet Cameras' },
  { id: 'bullet-cameras', name: 'Bullet Cameras', slug: 'bullet-cameras', description: 'Outdoor & perimeter security cameras' },
  { id: 'dome-cameras', name: 'Dome Cameras', slug: 'dome-cameras', description: 'Indoor & outdoor dome cameras' },
  { id: 'ip-cameras', name: 'IP Cameras', slug: 'ip-cameras', description: 'Network connected IP security cameras' },
  { id: 'ptz-cameras', name: 'PTZ Cameras', slug: 'ptz-cameras', description: 'Pan-tilt-zoom cameras' },
  { id: 'wifi-cameras', name: 'Wi-Fi Cameras', slug: 'wifi-cameras', description: 'Wireless security cameras' },
  { id: '4g-cameras', name: '4G Cameras', slug: '4g-cameras', description: 'Cellular 4G security cameras' },
  { id: 'solar-cameras', name: 'Solar Cameras', slug: 'solar-cameras', description: 'Solar powered security cameras' },
  { id: 'solar-panels', name: 'Solar Panels', slug: 'solar-panels', description: 'High efficiency solar modules' },
  { id: 'solar-inverters', name: 'Solar Inverters', slug: 'solar-inverters', description: 'Grid-tied & hybrid solar inverters' },
  { id: 'solar-batteries', name: 'Solar Batteries', slug: 'solar-batteries', description: 'Energy storage batteries' },
  { id: 'solar-controllers', name: 'Solar Charge Controllers', slug: 'solar-controllers', description: 'MPPT & PWM solar charge controllers' },
  { id: 'nvr', name: 'NVR', slug: 'nvr', description: 'Network Video Recorders' },
  { id: 'dvr', name: 'DVR', slug: 'dvr', description: 'Digital Video Recorders' },
  { id: 'surveillance-storage', name: 'Surveillance Storage', slug: 'surveillance-storage', description: 'Surveillance hard drives & SSDs' },
  { id: 'networking', name: 'Networking', slug: 'networking', description: 'PoE & CCTV network switches' },
  { id: 'cctv-accessories', name: 'CCTV Accessories', slug: 'cctv-accessories', description: 'Power supply, cables & mounting kits' },
];

export const getCategoryById = (id) => categories.find((c) => c.id === id || c.slug === id) || null;

