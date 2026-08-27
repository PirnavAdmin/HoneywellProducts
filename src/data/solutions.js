import { applicationImages } from './imageLibrary';

export const applications = [
  ['home', 'Home', 'Everyday visibility for entrances, shared spaces and outdoor areas.', 'wifi-cameras'],
  ['apartment', 'Apartment', 'Practical monitoring for flats, corridors and building access.', 'dome-cameras'],
  ['shop', 'Shop', 'Compact surveillance choices for counters, aisles and entry points.', 'cctv-cameras'],
  ['office', 'Office', 'Connected monitoring for workspaces, reception and common areas.', 'ip-cameras'],
  ['retail-store', 'Retail Store', 'Security coverage for customer areas, stockrooms and checkout zones.', 'ip-cameras'],
  ['warehouse', 'Warehouse', 'Scalable options for loading areas, aisles and site perimeters.', 'bullet-cameras'],
  ['factory', 'Factory', 'Project-led security planning for operational and outdoor zones.', 'ptz-cameras'],
  ['school', 'School', 'Responsible monitoring options for entrances and shared spaces.', 'dome-cameras'],
  ['hospital', 'Hospital', 'Discreet surveillance planning for public and operational areas.', 'ip-cameras'],
  ['hotel', 'Hotel', 'Security options for entrances, corridors and property grounds.', 'dome-cameras'],
  ['farm', 'Farm', 'Remote-site monitoring concepts with 4G and solar options.', 'solar-cameras'],
  ['construction-site', 'Construction Site', 'Temporary and remote perimeter visibility for active sites.', '4g-cameras'],
].map(([id, name, description, categoryId]) => ({ id, name, description, categoryId, image: applicationImages[id] }));

export const solutions = [
  { id: 'home-security', title: 'Home Security', description: 'A flexible approach to entrances, indoor rooms and outdoor areas.', application: 'Homes and apartments', categoryId: 'wifi-cameras', image: applicationImages.home },
  { id: 'office-security', title: 'Office Security', description: 'Connected camera and recording options for modern workspaces.', application: 'Offices and professional spaces', categoryId: 'ip-cameras', image: applicationImages.office },
  { id: 'retail-security', title: 'Retail Security', description: 'Surveillance planning for customer areas, stockrooms and tills.', application: 'Shops and retail stores', categoryId: 'cctv-cameras', image: applicationImages['retail-store'] },
  { id: 'warehouse-security', title: 'Warehouse Security', description: 'Wide-area monitoring concepts for aisles, loading zones and perimeters.', application: 'Warehouses and logistics sites', categoryId: 'bullet-cameras', image: applicationImages.warehouse },
  { id: 'factory-security', title: 'Factory Security', description: 'Scalable site visibility for industrial and operational environments.', application: 'Factories and industrial sites', categoryId: 'ptz-cameras', image: applicationImages.factory },
  { id: 'outdoor-security', title: 'Outdoor Security', description: '4G and solar-assisted options for remote or hard-to-connect locations.', application: 'Farms, sites and perimeters', categoryId: 'solar-cameras', image: applicationImages.farm },
];

export const getSolutionById = (id) => solutions.find((solution) => solution.id === id);
