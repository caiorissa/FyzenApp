// src/lib/stripeService.js
const BACKEND_URL =
  import.meta.env.VITE_AI_SERVER_URL || "http://localhost:3001";

export async function iniciarCheckoutStripe({ priceId, uid, email, plano }) {
  const res = await fetch(`${BACKEND_URL}/api/stripe/create-checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ priceId, uid, email, plano }),
  });

  const data = await res.json();

  if (!res.ok || !data.url) {
    console.error("❌ Erro ao criar checkout:", data);
    throw new Error(data.error || "Erro ao criar sessão de pagamento.");
  }

  // manda o usuário pro Stripe
  window.location.href = data.url;
}
