import PageHeader from "../components/PageHeader.jsx";
import React from "react";
import { Check, Rocket, Crown, Star } from "lucide-react";

export default function PremiumPage({ userPlan = "free", onSelectScreen }) {
  const currentPlan = (userPlan || "free").toUpperCase();

  const planos = [
    {
      nome: "Free",
      preco: "0",
      descricao: "Para testar o app e montar a base.",
      icone: Star,
      accent: "border-white/10",
      beneficios: [
        "Gerar treinos básicos",
        "Gerar plano alimentar reduzido",
        "Salvar plano na nuvem",
        "Acessar histórico",
        "Acesso limitado aos treinos",
      ],
      bloqueados: [
        "Relatório semanal",
        "Análise muscular",
        "Trocar exercícios",
        "Coach Fyzen IA",
        "Plano alimentar completo",
        "Treinos ilimitados",
      ],
      destaque: false,
    },
    {
      nome: "PRO",
      preco: "14,90",
      descricao: "Treino e dieta completos, sem limitações do Free.",
      icone: Rocket,
      accent: "border-fyzen-accent/40 ring-1 ring-fyzen-accent/20",
      beneficios: [
        "Tudo do Free",
        "Trocar exercícios da semana",
        "Relatório semanal (básico)",
        "Plano alimentar completo (5 refeições)",
        "Treinos melhores e variados",
      ],
      bloqueados: [
        "Análise avançada ULTRA",
        "Coach IA Turbo",
        "Insights de musculatura",
      ],
      destaque: true,
      simbolo: "R$",
    },
    {
      nome: "ULTRA",
      preco: "24,90",
      descricao: "Painel avançado e coach com análise detalhada.",
      icone: Crown,
      accent: "border-fyzen-warm/35",
      beneficios: [
        "Tudo do PRO",
        "Painel Ultra completo",
        "Coach ULTRA — análise avançada",
        "Volume por grupo muscular",
        "Insights semanais completos",
      ],
      bloqueados: [],
      destaque: false,
      simbolo: "R$",
    },
  ];

  function renderStatus(planoNome) {
    const nome = planoNome.toUpperCase();
    if (nome === "FREE" && currentPlan === "FREE")
      return (
        <div className="btn-ghost text-fyzen-muted mt-2">Seu plano atual</div>
      );
    if (nome === "PRO" && currentPlan === "PRO") {
      return (
        <div className="w-full py-2 rounded-[10px] bg-fyzen-accent/12 border border-fyzen-accent/30 text-fyzen-accent font-medium text-center text-sm mt-2">
          Plano PRO ativo
        </div>
      );
    }

    if (nome === "PRO" && currentPlan === "ULTRA") {
      return (
        <div className="w-full py-2 rounded-[10px] bg-fyzen-warm/10 border border-fyzen-warm/30 text-fyzen-warm font-medium text-center text-sm mt-2">
          Já incluso no ULTRA
        </div>
      );
    }

    if (nome === "ULTRA" && currentPlan === "ULTRA") {
      return (
        <div className="w-full py-2 rounded-[10px] bg-fyzen-warm/12 border border-fyzen-warm/35 text-fyzen-warm font-medium text-center text-sm mt-2">
          Plano ULTRA ativo
        </div>
      );
    }

    return null;
  }

  function abrirCheckout(plano) {
    const nome = plano.nome.toUpperCase();
    if (nome === "PRO") onSelectScreen("checkout-pro");
    if (nome === "ULTRA") onSelectScreen("checkout-ultra");
  }

  function podeAssinar(planoNome) {
    const nome = planoNome.toUpperCase();
    if (nome === "FREE") return false;
    if (currentPlan === "ULTRA") return false;
    if (nome === "FREE" && currentPlan === "FREE")
      return (
        <div className="btn-ghost text-fyzen-muted mt-2">Seu plano atual</div>
      );
    if (nome === "PRO" && currentPlan === "PRO") return false;
    return true;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mais possibilidades para sua rotina"
        description="Comece com o essencial. Evolua seu plano quando fizer sentido para você."
      />
      <div className="grid xl:grid-cols-3 gap-5">
        {planos.map((plano) => {
          const Icon = plano.icone;
          const nome = plano.nome.toUpperCase();
          const isDestaque = plano.destaque;

          return (
            <article
              key={plano.nome}
              className={`relative min-w-0 flex flex-col rounded-panel p-6 bg-fyzen-surface border ${plano.accent} ${
                isDestaque ? "" : ""
              }`}
            >
              {isDestaque && (
                <span className="absolute top-4 right-4 text-[11px] font-medium uppercase tracking-wide text-fyzen-accent">
                  Recomendado
                </span>
              )}

              <Icon className="w-6 h-6 text-fyzen-accent mb-4" />
              <h2 className="font-display text-xl text-slate-50">
                {plano.nome}
              </h2>
              <p className="text-fyzen-muted text-sm mt-1 mb-4">
                {plano.descricao}
              </p>

              {plano.preco !== "0" ? (
                <p className="text-3xl font-display text-slate-50 mb-5">
                  {plano.simbolo}
                  {plano.preco}
                  <span className="text-sm font-sans font-normal text-fyzen-muted">
                    {" "}
                    /mês
                  </span>
                </p>
              ) : (
                <p className="text-3xl font-display text-slate-50 mb-5">
                  Grátis
                </p>
              )}

              <div className="space-y-2 mb-6 flex-1">
                {plano.beneficios.map((b) => (
                  <p
                    key={b}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <Check className="w-4 h-4 text-fyzen-accent shrink-0 mt-0.5" />{" "}
                    {b}
                  </p>
                ))}
                {plano.bloqueados.map((b) => (
                  <p
                    key={b}
                    className="text-sm text-slate-500 line-through pl-6"
                  >
                    {b}
                  </p>
                ))}
              </div>

              {renderStatus(nome)}

              {podeAssinar(nome) && (
                <button
                  type="button"
                  onClick={() => abrirCheckout(plano)}
                  className="btn-primary w-full mt-3"
                >
                  Escolher {plano.nome}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
