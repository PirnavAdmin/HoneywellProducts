import { categories } from './categories';
import { categoryImages, productImages } from './imageLibrary';

// DEMO PRODUCT DATA - Replace with client verified specifications
const cameraImage = new URL('../assets/images/products-hero.png', import.meta.url).href;
const solarImage = new URL('../assets/images/smart-security-sustainable-future.png', import.meta.url).href;
const networkImage = new URL('../assets/images/smart-technology-trends.png', import.meta.url).href;

const base = {
  model: 'Model to be confirmed',
  availability: 'Contact for availability',
  downloads: ['Product brochure — client file required', 'Technical data sheet — client file required'],
  faq: [
    { question: 'Is this product available for my project?', answer: 'Availability and project suitability will be confirmed by the sales team.' },
    { question: 'Can I request installation support?', answer: 'Share your site and installation requirements through the enquiry form for a tailored response.' },
  ],
};

// Representative storefront values. Replace with API-backed commercial data.
const productCommerce = {
  'professional-dome-cctv-camera': [2499, 4.6, 128],
  'outdoor-bullet-cctv-camera': [2899, 4.5, 94],
  'indoor-dome-camera': [2199, 4.4, 76],
  'night-vision-camera': [3199, 4.7, 143],
  'turret-security-camera': [3499, 4.5, 68],
  'network-dome-ip-camera': [4599, 4.7, 112],
  'outdoor-bullet-ip-camera': [5299, 4.6, 87],
  'professional-ptz-ip-camera': [12999, 4.8, 156],
  'ai-ip-security-camera': [6999, 4.7, 101],
  'wifi-indoor-security-camera': [1999, 4.4, 219],
  'wifi-outdoor-camera': [3499, 4.5, 174],
  '4g-outdoor-security-camera': [7499, 4.6, 82],
  '4g-ptz-security-camera': [13999, 4.8, 64],
  'solar-cctv-camera': [8999, 4.6, 137],
  'solar-4g-security-camera': [11499, 4.7, 96],
  'solar-surveillance-kit': [24999, 4.8, 52],
  'network-video-recorder': [8499, 4.7, 118],
  'digital-video-recorder': [6499, 4.5, 91],
  'hybrid-video-recorder': [9999, 4.6, 73],
  'surveillance-hard-drive': [5999, 4.8, 184],
  'surveillance-ssd': [7999, 4.7, 79],
  'poe-network-switch': [3999, 4.6, 133],
  'cctv-network-switch': [2999, 4.4, 61],
  'cctv-power-mounting-kit': [1499, 4.3, 48],
};

const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;

const make = (product) => {
  const [price, rating, reviewCount] = productCommerce[product.id];
  const image = productImages[product.id] || categoryImages[product.categoryId];
  return {
    ...base,
    ...product,
    price,
    priceLabel: formatPrice(price),
    priceNote: 'Demo price',
    rating,
    reviewCount,
    image,
    slug: product.id,
    category: categories.find((item) => item.id === product.categoryId)?.name || product.categoryId,
    gallery: product.gallery || [image],
  };
};

export const products = [
  make({ id: 'professional-dome-cctv-camera', name: 'Professional Dome CCTV Camera', categoryId: 'cctv-cameras', productType: 'Analog Camera', installation: ['Indoor'], connectivity: ['Wired'], features: ['Night Vision', 'Remote Monitoring'], keywords: ['cctv', 'dome', 'indoor', 'surveillance'], image: cameraImage, description: 'A professional dome-format camera for general surveillance projects.', highlights: ['Discreet dome format', 'Indoor project suitability', 'Sales-assisted selection'], specifications: ['Camera format: Dome', 'Installation: Indoor', 'Connectivity: To be confirmed'], featured: true, popular: true }),
  make({ id: 'outdoor-bullet-cctv-camera', name: 'Outdoor Bullet CCTV Camera', categoryId: 'bullet-cameras', productType: 'Analog Camera', installation: ['Outdoor'], connectivity: ['Wired'], features: ['Night Vision', 'Remote Monitoring'], keywords: ['cctv', 'bullet', 'outdoor', 'perimeter'], image: cameraImage, description: 'A visible bullet-format option for outdoor security coverage.', highlights: ['Outdoor-oriented form factor', 'Visible security presence', 'Project-based configuration'], specifications: ['Camera format: Bullet', 'Installation: Outdoor', 'Connectivity: To be confirmed'], featured: true, popular: true }),
  make({ id: 'indoor-dome-camera', name: 'Indoor Dome Camera', categoryId: 'dome-cameras', productType: 'Analog Camera', installation: ['Indoor'], connectivity: ['Wired'], features: ['Audio'], keywords: ['dome', 'indoor', 'home', 'office'], image: cameraImage, description: 'A compact dome camera type for indoor rooms and common areas.', highlights: ['Compact profile', 'Indoor applications', 'Flexible placement'], specifications: ['Camera format: Dome', 'Installation: Indoor', 'Audio: Option to be confirmed'], newProduct: true }),
  make({ id: 'night-vision-camera', name: 'Night Vision Camera', categoryId: 'cctv-cameras', productType: 'Analog Camera', installation: ['Indoor', 'Outdoor'], connectivity: ['Wired'], features: ['Night Vision'], keywords: ['night', 'low light', 'security', 'monitoring'], image: cameraImage, description: 'A surveillance camera type intended for day-and-night monitoring projects.', highlights: ['Day-and-night use case', 'Multiple installation settings', 'Specification matched per site'], specifications: ['Vision mode: Night vision option', 'Installation: Indoor / outdoor', 'Range: To be confirmed'] }),
  make({ id: 'turret-security-camera', name: 'Turret Security Camera', categoryId: 'cctv-cameras', productType: 'Turret Camera', installation: ['Indoor', 'Outdoor'], connectivity: ['Wired'], features: ['Night Vision'], keywords: ['turret', 'eyeball', 'security', 'camera'], image: cameraImage, description: 'A turret-format security camera for adaptable viewing angles.', highlights: ['Adjustable viewing direction', 'Compact turret form', 'Project-based specification'], specifications: ['Camera format: Turret', 'Installation: Indoor / outdoor', 'Resolution: To be confirmed'], newProduct: true }),
  make({ id: 'network-dome-ip-camera', name: 'Network Dome IP Camera', categoryId: 'ip-cameras', productType: 'IP Camera', installation: ['Indoor'], connectivity: ['PoE'], features: ['Remote Monitoring', 'Night Vision'], keywords: ['ip', 'network', 'poe', 'dome'], image: cameraImage, description: 'A dome IP camera type for connected surveillance networks.', highlights: ['Network camera format', 'PoE installation option', 'Remote viewing workflow'], specifications: ['Camera type: IP', 'Connectivity: PoE', 'Installation: Indoor'], featured: true, popular: true }),
  make({ id: 'outdoor-bullet-ip-camera', name: 'Outdoor Bullet IP Camera', categoryId: 'ip-cameras', productType: 'IP Camera', installation: ['Outdoor'], connectivity: ['PoE'], features: ['Remote Monitoring', 'Night Vision'], keywords: ['ip', 'bullet', 'poe', 'outdoor'], image: cameraImage, description: 'An outdoor bullet IP camera type for connected perimeter monitoring.', highlights: ['Outdoor network camera', 'PoE connectivity option', 'Perimeter-focused format'], specifications: ['Camera type: IP bullet', 'Connectivity: PoE', 'Installation: Outdoor'], featured: true }),
  make({ id: 'professional-ptz-ip-camera', name: 'Professional PTZ IP Camera', categoryId: 'ptz-cameras', productType: 'IP Camera', installation: ['Outdoor'], connectivity: ['PoE'], features: ['Remote Monitoring'], keywords: ['ptz', 'ip', 'pan tilt zoom', 'wide area'], image: cameraImage, description: 'A professional PTZ camera type for wide-area surveillance projects.', highlights: ['Pan-tilt-zoom format', 'Wide-area use case', 'Operator-assisted monitoring'], specifications: ['Camera format: PTZ', 'Connectivity: PoE option', 'Zoom: To be confirmed'], featured: true, popular: true }),
  make({ id: 'ai-ip-security-camera', name: 'AI IP Security Camera', categoryId: 'ip-cameras', productType: 'IP Camera', installation: ['Indoor', 'Outdoor'], connectivity: ['PoE'], features: ['AI', 'Remote Monitoring'], keywords: ['ai', 'analytics', 'ip', 'smart security'], image: cameraImage, description: 'An IP camera category prepared for intelligent video feature options.', highlights: ['AI-ready product category', 'Connected monitoring', 'Feature set confirmed per model'], specifications: ['Camera type: IP', 'AI functions: To be confirmed', 'Connectivity: PoE option'], newProduct: true }),
  make({ id: 'wifi-indoor-security-camera', name: 'Wi-Fi Indoor Security Camera', categoryId: 'wifi-cameras', productType: 'Wi-Fi Camera', installation: ['Indoor'], connectivity: ['Wi-Fi'], features: ['Audio', 'Remote Monitoring'], keywords: ['wifi', 'wireless', 'indoor', 'home'], image: cameraImage, description: 'A wireless indoor camera type for flexible home and small-business monitoring.', highlights: ['Wi-Fi connectivity', 'Indoor placement', 'Remote monitoring workflow'], specifications: ['Connectivity: Wi-Fi', 'Installation: Indoor', 'Audio: Option to be confirmed'], featured: true }),
  make({ id: 'wifi-outdoor-camera', name: 'Wi-Fi Outdoor Camera', categoryId: 'wifi-cameras', productType: 'Wi-Fi Camera', installation: ['Outdoor'], connectivity: ['Wi-Fi'], features: ['Night Vision', 'Remote Monitoring'], keywords: ['wifi', 'outdoor', 'wireless', 'camera'], image: cameraImage, description: 'A wireless camera type intended for outdoor monitoring locations.', highlights: ['Wi-Fi installation option', 'Outdoor-oriented use', 'Remote viewing workflow'], specifications: ['Connectivity: Wi-Fi', 'Installation: Outdoor', 'Protection rating: To be confirmed'], newProduct: true }),
  make({ id: '4g-outdoor-security-camera', name: '4G Outdoor Security Camera', categoryId: '4g-cameras', productType: '4G Camera', installation: ['Outdoor'], connectivity: ['4G'], features: ['Remote Monitoring', 'Night Vision'], keywords: ['4g', 'lte', 'remote', 'outdoor'], image: solarImage, description: 'A 4G-enabled camera type for remote locations without fixed broadband.', highlights: ['4G connectivity option', 'Remote-site use case', 'Outdoor installation'], specifications: ['Connectivity: 4G', 'Installation: Outdoor', 'SIM support: To be confirmed'], featured: true, popular: true }),
  make({ id: '4g-ptz-security-camera', name: '4G PTZ Security Camera', categoryId: '4g-cameras', productType: '4G Camera', installation: ['Outdoor'], connectivity: ['4G'], features: ['Remote Monitoring'], keywords: ['4g', 'ptz', 'remote', 'wide area'], image: solarImage, description: 'A PTZ camera category combining flexible coverage with 4G connectivity.', highlights: ['PTZ camera format', '4G connectivity option', 'Remote location workflow'], specifications: ['Camera format: PTZ', 'Connectivity: 4G', 'Zoom: To be confirmed'] }),
  make({ id: 'solar-cctv-camera', name: 'Solar CCTV Camera', categoryId: 'solar-cameras', productType: 'Solar Camera', installation: ['Outdoor'], connectivity: ['4G'], features: ['Remote Monitoring', 'Night Vision'], keywords: ['solar', 'camera', 'remote', 'off-grid'], image: solarImage, description: 'A solar-assisted CCTV camera category for remote outdoor security.', highlights: ['Solar-assisted operation', 'Outdoor application', 'Remote-site planning'], specifications: ['Power source: Solar-assisted', 'Connectivity: To be confirmed', 'Battery capacity: To be confirmed'], featured: true, popular: true }),
  make({ id: 'solar-4g-security-camera', name: 'Solar 4G Security Camera', categoryId: 'solar-cameras', productType: 'Solar Camera', installation: ['Outdoor'], connectivity: ['4G'], features: ['Remote Monitoring', 'Night Vision'], keywords: ['solar', '4g', 'security', 'farm'], image: solarImage, description: 'A solar-assisted 4G camera type for farms, sites and remote perimeters.', highlights: ['Solar and 4G workflow', 'Remote monitoring use case', 'Outdoor project planning'], specifications: ['Power source: Solar-assisted', 'Connectivity: 4G', 'Installation: Outdoor'], featured: true, newProduct: true }),
  make({ id: 'solar-surveillance-kit', name: 'Solar Surveillance Kit', categoryId: 'solar-cameras', productType: 'Solar Kit', installation: ['Outdoor'], connectivity: ['4G'], features: ['Remote Monitoring'], keywords: ['solar', 'kit', 'site', 'surveillance'], image: solarImage, description: 'A bundled solar surveillance concept for project-based remote deployments.', highlights: ['Project kit format', 'Remote-site use case', 'Components confirmed per quote'], specifications: ['Kit contents: To be confirmed', 'Power: Solar-assisted', 'Connectivity: Project dependent'] }),
  make({ id: 'network-video-recorder', name: 'Network Video Recorder', categoryId: 'nvr', productType: 'NVR', installation: ['Indoor'], connectivity: ['PoE'], features: ['Remote Monitoring'], keywords: ['nvr', 'recording', 'ip', 'storage'], image: networkImage, description: 'A network video recorder category for compatible IP surveillance systems.', highlights: ['IP recording workflow', 'Network integration', 'Capacity matched per project'], specifications: ['Recorder type: NVR', 'Channels: To be confirmed', 'Storage capacity: To be confirmed'], featured: true, popular: true }),
  make({ id: 'digital-video-recorder', name: 'Digital Video Recorder', categoryId: 'dvr', productType: 'DVR', installation: ['Indoor'], connectivity: ['Wired'], features: ['Remote Monitoring'], keywords: ['dvr', 'analog', 'recording', 'cctv'], image: networkImage, description: 'A digital video recorder category for compatible wired camera systems.', highlights: ['Digital video recording', 'Wired camera workflow', 'Project-based capacity'], specifications: ['Recorder type: DVR', 'Channels: To be confirmed', 'Storage capacity: To be confirmed'], featured: true }),
  make({ id: 'hybrid-video-recorder', name: 'Hybrid Video Recorder', categoryId: 'nvr', productType: 'Hybrid Recorder', installation: ['Indoor'], connectivity: ['PoE', 'Wired'], features: ['Remote Monitoring'], keywords: ['hybrid', 'nvr', 'dvr', 'recording'], image: networkImage, description: 'A hybrid recording category prepared for mixed surveillance environments.', highlights: ['Hybrid recorder format', 'Mixed-system planning', 'Configuration confirmed per project'], specifications: ['Recorder type: Hybrid', 'Camera compatibility: To be confirmed', 'Channels: To be confirmed'], newProduct: true }),
  make({ id: 'surveillance-hard-drive', name: 'Surveillance Hard Drive', categoryId: 'surveillance-storage', productType: 'Storage', installation: ['Indoor'], connectivity: ['Wired'], features: [], keywords: ['hard drive', 'hdd', 'storage', 'recording'], image: networkImage, description: 'A hard-drive storage category intended for compatible surveillance recorders.', highlights: ['Surveillance storage category', 'Recorder compatibility planning', 'Capacity selected by need'], specifications: ['Storage type: Hard drive', 'Capacity: To be confirmed', 'Compatibility: To be confirmed'], popular: true }),
  make({ id: 'surveillance-ssd', name: 'Surveillance SSD', categoryId: 'surveillance-storage', productType: 'Storage', installation: ['Indoor'], connectivity: ['Wired'], features: [], keywords: ['ssd', 'storage', 'recording', 'solid state'], image: networkImage, description: 'A solid-state storage category for compatible surveillance applications.', highlights: ['Solid-state format', 'Compatibility-led selection', 'Capacity confirmed per project'], specifications: ['Storage type: SSD', 'Capacity: To be confirmed', 'Compatibility: To be confirmed'], newProduct: true }),
  make({ id: 'poe-network-switch', name: 'PoE Network Switch', categoryId: 'networking', productType: 'Networking', installation: ['Indoor'], connectivity: ['PoE'], features: ['Remote Monitoring'], keywords: ['poe', 'switch', 'network', 'ip camera'], image: networkImage, description: 'A PoE switch category for compatible IP camera networks.', highlights: ['Power-over-Ethernet workflow', 'IP surveillance networking', 'Port count selected per site'], specifications: ['Connectivity: PoE', 'Port count: To be confirmed', 'Power budget: To be confirmed'], featured: true }),
  make({ id: 'cctv-network-switch', name: 'CCTV Network Switch', categoryId: 'networking', productType: 'Networking', installation: ['Indoor'], connectivity: ['PoE', 'Wired'], features: ['Remote Monitoring'], keywords: ['cctv', 'switch', 'networking', 'lan'], image: networkImage, description: 'A network switch category for structured CCTV connectivity.', highlights: ['Surveillance network use case', 'Structured connectivity', 'Project-based sizing'], specifications: ['Switch type: To be confirmed', 'Port count: To be confirmed', 'Installation: Indoor'] }),
  make({ id: 'cctv-power-mounting-kit', name: 'CCTV Power & Mounting Kit', categoryId: 'cctv-accessories', productType: 'Accessories', installation: ['Indoor', 'Outdoor'], connectivity: ['Wired'], features: [], keywords: ['power supply', 'cable', 'mount', 'junction box', 'accessories'], image: networkImage, description: 'A project accessory bundle covering power, cable, mount and junction-box needs.', highlights: ['Installation accessory category', 'Indoor and outdoor options', 'Kit contents confirmed per quote'], specifications: ['Components: To be confirmed', 'Compatibility: To be confirmed', 'Installation: Project dependent'] }),
];

export { categories };
export const getProductById = (id) => products.find((product) => product.id === id || product.slug === id);
