import { Lock } from "lucide-react";

export default function UpgradeScreen({ feature }) {
  return (
    <div className="text-center flex flex-col items-center justify-center py-16 max-w-sm mx-auto">
      <Lock className="w-8 h-8 text-fyzen-muted mb-4" />

      <h1 className="font-display text-lg text-slate-50">
        Recurso do plano pago
      </h1>

      <p className="text-fyzen-muted text-sm mt-2 leading-relaxed">
        <span className="text-slate-300">{feature}</span> está disponível nos
        planos PRO ou ULTRA.
      </p>

      <a href="/premium" className="btn-primary mt-6">
        Ver planos
      </a>
    </div>
  );
}
