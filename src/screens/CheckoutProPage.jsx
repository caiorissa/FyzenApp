import React from "react";
import StripeCheckoutButton from "../components/premium/StripeCheckoutButton.jsx";

const PRICE_ID_PRO = "price_1SdDk5Rw5LzzuwFsY91tjPeB";

export default function CheckoutProPage({ onSelectScreen }) {
  return (
    <div className="flex items-center justify-center py-4 sm:py-10">
      <div className="surface-card w-full max-w-lg p-6 sm:p-10">
        <h1 className="text-2xl font-semibold text-center mb-2">
          Assinatura PRO
        </h1>
        <p className="text-center text-white/60 mb-6">R$ 14,90 / mês</p>

        <div className="space-y-2 text-sm text-white/80 mb-8">
          <p>✓ Tudo do Free</p>
          <p>✓ Trocar exercícios da semana</p>
          <p>✓ Relatório semanal (básico)</p>
          <p>✓ Plano alimentar completo (5 refeições)</p>
          <p>✓ Treinos melhores e variados</p>
        </div>

        <p className="text-xs text-center text-white/40 mb-4">
          Pagamento seguro via Stripe.
        </p>

        <StripeCheckoutButton priceId={PRICE_ID_PRO} plano="pro" />

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
