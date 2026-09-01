import { categoryImages } from './imageLibrary';

export const categories = [
  { id: 'cctv-cameras', name: 'CCTV Cameras', description: 'Professional camera options for dependable day-to-day surveillance.' },
  { id: 'ip-cameras', name: 'IP Cameras', description: 'Network-ready cameras for connected monitoring environments.' },
  { id: 'dome-cameras', name: 'Dome Cameras', description: 'Low-profile camera formats for indoor and sheltered spaces.' },
  { id: 'bullet-cameras', name: 'Bullet Cameras', description: 'Visible security coverage for perimeters and outdoor areas.' },
  { id: 'ptz-cameras', name: 'PTZ Cameras', description: 'Flexible viewing formats for wide-area monitoring needs.' },
  { id: 'wifi-cameras', name: 'Wi-Fi Cameras', description: 'Convenient wireless options for adaptable installations.' },
  { id: '4g-cameras', name: '4G Cameras', description: 'Connectivity options for sites without fixed broadband.' },
  { id: 'solar-cameras', name: 'Solar Cameras', description: 'Solar-assisted security for remote and outdoor locations.' },
  { id: 'solar-panels', name: 'Solar Panels', description: 'High-efficiency monocrystalline and polycrystalline solar panels.' },
  { id: 'solar-inverters', name: 'Solar Inverters', description: 'Pure sine wave, off-grid and hybrid solar power inverters.' },
  { id: 'solar-batteries', name: 'Solar Batteries', description: 'Deep cycle lead-acid and lithium solar energy storage batteries.' },
  { id: 'solar-controllers', name: 'Solar Controllers & Accessories', description: 'MPPT charge controllers, mounting kits, cables and power accessories.' },
  { id: 'nvr', name: 'NVR', description: 'Network video recording for IP surveillance systems.' },
  { id: 'dvr', name: 'DVR', description: 'Digital recording options for compatible camera systems.' },
  { id: 'surveillance-storage', name: 'Surveillance Storage', description: 'Storage formats prepared for continuous video workloads.' },
  { id: 'networking', name: 'Networking', description: 'Switching and connectivity products for surveillance networks.' },
  { id: 'cctv-accessories', name: 'CCTV Accessories', description: 'Power, mounting and cable accessories for clean installations.' },
].map((category) => ({ ...category, image: categoryImages[category.id] }));

export const getCategoryById = (id) => categories.find((item) => item.id === id);
