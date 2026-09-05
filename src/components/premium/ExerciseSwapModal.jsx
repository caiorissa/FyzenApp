import Dialog from "../Dialog.jsx";
import React, { useState, useMemo } from "react";
import { X, Search, Dumbbell, Wand2 } from "lucide-react";
import { getAlternatives } from "@/lib/premium/exerciseAlternatives";
import PremiumLock from "./PremiumLock";
import { temAcesso } from "@/lib/planCheck";

export default function ExerciseSwapModal({
  open,
  onClose,
  exercicioOriginal,
  onSwap,
  userPlan = "free",
}) {
  const [search, setSearch] = useState("");

  const hasPro = temAcesso(userPlan, "pro");

  const alternativas = useMemo(() => {
    const base = getAlternatives(exercicioOriginal) || [];
    if (!search.trim()) return base;

    return base.filter((ex) => ex.toLowerCase().includes(search.toLowerCase()));
  }, [search, exercicioOriginal]);

  if (!open) return null;

  return (
    <Dialog onClose={onClose} label="Trocar exercício">
      <div className="relative space-y-6">
        <button
          onClick={onClose}
          aria-label="Fechar diálogo"
          className="absolute -top-3 -right-3 text-slate-400 hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="space-y-2 pr-10">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-fyzen-accent" />
            Trocar exercício
          </h2>
          <p className="text-slate-400 text-sm">
            Escolha uma alternativa para substituir:
          </p>
          <p className="text-fyzen-accent font-semibold">{exercicioOriginal}</p>
        </div>

        {!hasPro && (
          <PremiumLock
            label="Troca de exercício liberada apenas para assinantes PRO"
            plan="pro"
          />
        )}

        <div className={`${!hasPro && "pointer-events-none opacity-50"}`}>
          <div className="relative">
            <input
              aria-label="Buscar exercício"
              name="exerciseSearch"
              disabled={!hasPro}
              type="text"
              placeholder="Buscar exercício..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 text-sm rounded-xl bg-slate-800/80 border border-white/10 outline-none text-slate-100 placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 mt-4 pr-2 custom-scroll">
            {alternativas.length === 0 ? (
              <p className="text-slate-500 text-sm text-center">
                Nenhuma alternativa encontrada.
              </p>
            ) : (
              alternativas.map((alt, index) => (
                <button
                  key={index}
                  disabled={!hasPro}
                  onClick={() => onSwap(alt)}
                  className="w-full bg-slate-800/60 hover:bg-slate-700/60 transition px-4 py-2 rounded-xl text-left text-slate-200 flex items-center gap-2"
                >
                  <Wand2 className="w-4 h-4 text-fyzen-accent" />
                  {alt}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Dialog>
  );
}
