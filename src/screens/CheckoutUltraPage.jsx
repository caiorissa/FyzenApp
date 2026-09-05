import React from "react";
import StripeCheckoutButton from "../components/premium/StripeCheckoutButton.jsx";

const PRICE_ID_ULTRA = "price_1ScrikRw5LzzuwFsekQBkj9Y";

export default function CheckoutUltraPage({ onSelectScreen }) {
  return (
    <div className="flex items-center justify-center py-4 sm:py-10">
      <div className="surface-card w-full max-w-lg p-6 sm:p-10">
        <h1 className="text-2xl font-semibold text-center mb-2">
          Assinatura ULTRA
        </h1>
        <p className="text-center text-white/60 mb-6">R$ 24,90 / mês</p>

        <div className="space-y-2 text-sm text-white/80 mb-8">
          <p>✓ Tudo do PRO</p>
          <p>✓ Painel Ultra com análises avançadas</p>
          <p>✓ Relatório alimentar mais detalhado</p>
          <p>✓ Ajustes finos de treino e nutrição</p>
        </div>

        <p className="text-xs text-center text-white/40 mb-4">
          Pagamento seguro via Stripe.
        </p>

        <StripeCheckoutButton priceId={PRICE_ID_ULTRA} plano="ultra" />

        <button
          onClick={() => onSelectScreen("premium")}
          className="btn-ghost mt-4 w-full"
        >
          Voltar aos planos
        </button>
      </div>
    </div>
  );
}
