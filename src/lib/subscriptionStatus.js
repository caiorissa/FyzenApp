/** Shared display/access rule. Billing data and payment contracts stay unchanged. */
export function getActivePlan(data, now = Date.now()) {
  if (!data || data.ativo === false) return "free";
  if (typeof data.renovaEm === "number" && data.renovaEm <= now) return "free";
  return typeof data.plano === "string" ? data.plano.toLowerCase() : "free";
}
