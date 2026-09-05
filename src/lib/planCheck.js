export const ordemPlanos = ["free", "pro", "ultra"];

export function temAcesso(userPlan, requiredPlan) {
  if (!userPlan) return false;
  return ordemPlanos.indexOf(userPlan) >= ordemPlanos.indexOf(requiredPlan);
}
