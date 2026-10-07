import React from "react";
import { Check, Sparkles } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";

const recursos = [
  "Treinos personalizados e ilimitados",
  "Plano alimentar completo",
  "Troca e regeneração de exercícios",
  "Relatórios e insights semanais",
  "Painel de evolução com análises avançadas",
  "Coach Fyzen com inteligência artificial",
];

export default function PremiumPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Tudo do Fyzen, grátis"
        description="Todos os recursos estão liberados para você, sem cobrança ou limitações de plano."
      />

      <section className="max-w-3xl rounded-panel border border-fyzen-accent/30 bg-fyzen-surface p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-fyzen-accent" />
          <div>
            <h2 className="font-display text-xl text-slate-50">Fyzen Ultra</h2>
            <p className="text-sm text-fyzen-muted">Gratuito para todos</p>
          </div>
        </div>

        <p className="mt-5 text-3xl font-display text-slate-50">R$ 0</p>
        <p className="text-sm text-fyzen-muted">
          Todos os recursos, sempre grátis.
        </p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {recursos.map((recurso) => (
            <li
              key={recurso}
              className="flex items-start gap-2 text-sm text-slate-300"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-fyzen-accent" />
              {recurso}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
