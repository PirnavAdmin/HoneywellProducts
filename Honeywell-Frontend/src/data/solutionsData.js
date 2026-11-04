export const SOLUTION_PILLARS = {};

export const getSolutionPillar = (id) => {
  const cleanId = String(id || '').toLowerCase();
  return SOLUTION_PILLARS[cleanId] || null;
};
