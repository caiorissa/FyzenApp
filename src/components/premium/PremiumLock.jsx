import React from "react";
import { Lock } from "lucide-react";

export default function PremiumLock({
  label = "Recurso do plano pago",
  plan = "pro",
  className = "",
}) {
  const planName = plan.toUpperCase();

  return (
    <div
      className={`absolute inset-0 bg-fyzen-bg/75 rounded-card flex flex-col items-center justify-center border border-white/[0.07] z-20 ${className}`}
    >
      <Lock className="w-8 h-8 text-fyzen-muted mb-3" />
      <p className="text-slate-200 text-sm font-medium text-center px-4">
        {label}
      </p>
      <p className="text-xs text-fyzen-muted mt-1">
        Plano <span className="text-fyzen-accent">{planName}</span>
      </p>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("fyzen:upgrade"))}
        className="btn-primary mt-4 text-xs py-2 px-4"
      >
        Ver planos
      </button>
    </div>
  );
}
