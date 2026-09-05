import Dialog from "../Dialog.jsx";
import { LoadingState } from "../ScreenState.jsx";
import React from "react";
import { X, Brain, Flame, Activity, Calendar } from "lucide-react";

export default function WeeklyInsightsModal({ open, onClose, insights }) {
  if (!open) return null;
  if (!insights)
    return (
      <Dialog label="Relatório da semana" onClose={onClose}>
        <LoadingState label="Preparando seu relatório…" />
        <button className="btn-ghost" onClick={onClose}>
          Fechar
        </button>
      </Dialog>
    );

  const {
    totalTreinos,
    totalExercicios,
    mediaExerciciosPorTreino,
    diasAtivos,
    diaMaisForte,
    porDia = [],
    volume = {},
    nivel,
  } = insights;

  const volumeEntries = Object.entries(volume || {});
  const hasVolume = volumeEntries.length > 0;

  const maxExerciciosDia =
    porDia.length > 0 ? Math.max(...porDia.map((d) => d.exercicios || 0)) : 0;

  const badgeColor =
    nivel === "ULTRA"
      ? "bg-fyzen-warm text-slate-900"
      : nivel === "PRO"
        ? "bg-fyzen-accent text-slate-900"
        : "bg-slate-700 text-slate-200";

  return (
    <Dialog label="Relatório da semana" onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-fyzen-accent" />
              <h2 className="text-lg sm:text-xl font-semibold text-slate-50">
                Relatório da semana
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Visão geral dos seus treinos distribuídos ao longo da semana.
            </p>
            {nivel && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold mt-1 ${badgeColor}`}
              >
                {nivel === "ULTRA" && "Painel ULTRA ativo"}
                {nivel === "PRO" && nivel === "PRO" && "Plano PRO ativo"}
                {nivel === "FREE" && "Plano gratuito"}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar relatório"
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <ResumoCard
            icon={Activity}
            label="Grupos de treino"
            value={totalTreinos || 0}
            helper="Blocos de treino planejados"
          />

          <ResumoCard
            icon={Flame}
            label="Exercícios totais"
            value={totalExercicios || 0}
            helper={
              mediaExerciciosPorTreino
                ? `${mediaExerciciosPorTreino.toFixed(1)} por treino`
                : "Média indisponível"
            }
          />

          <ResumoCard
            icon={Calendar}
            label="Dias ativos"
            value={diasAtivos || 0}
            helper={
              diaMaisForte?.dia
                ? `Dia mais forte: ${formatDia(diaMaisForte.dia)}`
                : "Treinos distribuídos"
            }
          />
        </div>

        {porDia.length > 0 && (
          <div className="rounded-2xl bg-slate-900/70 border border-white/5 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-fyzen-accent" />
              Distribuição de exercícios por dia
            </p>

            <div className="space-y-2">
              {porDia.map((d) => {
                const perc =
                  maxExerciciosDia > 0
                    ? (d.exercicios / maxExerciciosDia) * 100
                    : 0;

                return (
                  <div key={d.dia} className="flex items-center gap-3">
                    <span className="w-16 text-[11px] text-slate-400 uppercase tracking-wide">
                      {formatDia(d.dia)}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-fyzen-accent"
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs text-slate-300">
                      {d.exercicios || 0}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-slate-900/70 border border-white/5 p-4">
          <p className="text-xs font-semibold text-slate-300 flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-amber-300" />
            Volume por grupo muscular
          </p>

          {hasVolume ? (
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              {volumeEntries.map(([grupo, valor]) => (
                <div
                  key={grupo}
                  className="flex items-center justify-between bg-slate-900/80 rounded-xl px-3 py-2"
                >
                  <span className="text-slate-200 truncate">{grupo}</span>
                  <span className="text-slate-400">
                    {valor} exercício{valor !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Ainda não há volume registrado por grupo. Conclua treinos para
              destravar esse resumo.
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-1 py-2 bg-slate-800/70 hover:bg-slate-700 text-slate-100 rounded-2xl text-sm transition"
        >
          Fechar relatório
        </button>
      </div>
    </Dialog>
  );
}

function ResumoCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-white/5 p-4 flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-fyzen-accent" />
        {label}
      </span>
      <span className="text-xl font-semibold text-slate-50">{value}</span>
      <span className="text-[11px] text-slate-500">{helper}</span>
    </div>
  );
}

function formatDia(dia) {
  if (!dia) return "";
  const map = {
    segunda: "Seg",
    terça: "Ter",
    terca: "Ter",
    quarta: "Qua",
    quinta: "Qui",
    sexta: "Sex",
    sabado: "Sáb",
    sábado: "Sáb",
    domingo: "Dom",
  };
  return map[dia.toLowerCase()] || dia;
}
