export function buildWeeklyMealPlanUpdate(plan, preferences, updatedAt) {
  const nutrition = { preferenciasPlanoSemanal: preferences };
  if (plan) nutrition.planoSemanal = plan;
  return { nutrition, updatedAt };
}
