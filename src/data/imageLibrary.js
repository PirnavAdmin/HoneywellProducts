const asset = (name) => new URL(`../assets/images/catalog/${name}`, import.meta.url).href;

export const categoryImages = {
  'cctv-cameras': asset('cctv-camera.jpg'),
  'ip-cameras': asset('ip-camera.jpg'),
  'dome-cameras': asset('dome-camera.jpg'),
  'bullet-cameras': asset('bullet-camera.jpg'),
  'ptz-cameras': asset('ptz-camera.jpg'),
  'wifi-cameras': asset('wifi-camera.jpg'),
  '4g-cameras': asset('4g-camera.jpg'),
  'solar-cameras': asset('solar-camera.jpg'),
  nvr: asset('nvr.jpg'),
  dvr: asset('dvr.jpg'),
  'surveillance-storage': asset('storage.jpg'),
  networking: asset('networking.jpg'),
  'cctv-accessories': asset('accessories.jpg'),
};

export const applicationImages = {
  home: asset('application-home.jpg'),
  apartment: asset('application-apartment.jpg'),
  shop: asset('application-shop.jpg'),
  office: asset('application-office.jpg'),
  'retail-store': asset('application-retail.jpg'),
  warehouse: asset('application-warehouse.jpg'),
  factory: asset('application-factory.jpg'),
  school: asset('application-school.jpg'),
  hospital: asset('application-hospital.jpg'),
  hotel: asset('application-hotel.jpg'),
  farm: asset('application-farm.jpg'),
  'construction-site': asset('application-construction.jpg'),
};

// Every catalogue record gets its own thumbnail. These stay centralized so an
// API or the admin media library can replace them without touching components.
export const productImages = {
  'professional-dome-cctv-camera': asset('dome-camera.jpg'),
  'outdoor-bullet-cctv-camera': asset('bullet-camera.jpg'),
  'indoor-dome-camera': asset('cctv-camera.jpg'),
  'night-vision-camera': asset('ptz-camera.jpg'),
  'turret-security-camera': asset('ip-camera.jpg'),
  'network-dome-ip-camera': asset('wifi-camera.jpg'),
  'outdoor-bullet-ip-camera': asset('4g-camera.jpg'),
  'professional-ptz-ip-camera': asset('solar-camera.jpg'),
  'ai-ip-security-camera': asset('application-factory.jpg'),
  'wifi-indoor-security-camera': asset('application-home.jpg'),
  'wifi-outdoor-camera': asset('application-apartment.jpg'),
  '4g-outdoor-security-camera': asset('application-construction.jpg'),
  '4g-ptz-security-camera': asset('application-warehouse.jpg'),
  'solar-cctv-camera': asset('application-farm.jpg'),
  'solar-4g-security-camera': asset('application-retail.jpg'),
  'solar-surveillance-kit': asset('application-hotel.jpg'),
  'network-video-recorder': asset('nvr.jpg'),
  'digital-video-recorder': asset('dvr.jpg'),
  'hybrid-video-recorder': asset('storage.jpg'),
  'surveillance-hard-drive': asset('accessories.jpg'),
  'surveillance-ssd': asset('application-hospital.jpg'),
  'poe-network-switch': asset('networking.jpg'),
  'cctv-network-switch': asset('application-school.jpg'),
  'cctv-power-mounting-kit': asset('application-shop.jpg'),
};
