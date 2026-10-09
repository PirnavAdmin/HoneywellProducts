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

export const solutions = [];
export const getSolutionById = () => null;
