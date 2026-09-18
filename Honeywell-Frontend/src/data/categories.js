export const categories = [
  { id: 'network-cameras', name: 'Network Cameras', slug: 'network-cameras', description: 'High-definition IP network cameras' },
  { id: 'solar-kit', name: 'Solar kit', slug: 'solar-kit', description: 'Complete solar power kit solutions' },
  { id: 'solar-panels', name: 'Solar panels', slug: 'solar-panels', description: 'High-efficiency solar panels' },
  { id: 'turbo-hd-cameras', name: 'Turbo HD Cameras', slug: 'turbo-hd-cameras', description: 'High-definition analog Turbo HD cameras' },
];

export const getCategoryById = (id) => categories.find((c) => c.id === id || c.slug === id) || null;


