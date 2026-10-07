import Dialog from "../Dialog.jsx";
import React, { useState } from "react";
import { X, RefreshCw, Wand2 } from "lucide-react";
import { gerarNovaVariacaoDoGrupo } from "@/lib/premium/planUtils";
import ExerciseVideoLink from "../workout/ExerciseVideoLink.jsx";

export default function EditGroupModal({
  open,
  onClose,
  grupoOriginal,
  onReplaceGroup,
  objetivo,
  local,
  form,
}) {
  const [loading, setLoading] = useState(false);
  const [novasVariacoes, setNovasVariacoes] = useState([]);

  if (!open) return null;

  const gerarVariacao = async () => {
    try {
      setLoading(true);

      const novoGrupo = gerarNovaVariacaoDoGrupo(
        grupoOriginal,
        objetivo,
        local,
        form,
      );

      setNovasVariacoes((prev) => [...prev, novoGrupo]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onClose={onClose} label="Editar grupo de treino">
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
            <Wand2 className="w-5 h-5 text-fyzen-accent" />
            Editar grupo de treino
          </h2>
          <p className="text-slate-400 text-sm">Grupo selecionado:</p>
          <p className="font-semibold text-fyzen-accent">
            {grupoOriginal.grupo}
          </p>
        </div>
        <div>
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <p className="text-slate-300 font-medium mb-2 text-sm">
              Treino atual:
            </p>
            <ul className="text-slate-400 text-sm list-disc ml-5 space-y-1">
              {grupoOriginal.exercicios.map((ex, idx) => (
                <li key={idx} className="space-y-1">
                  <span>{ex}</span>
                  <ExerciseVideoLink exerciseName={ex} compact />
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={gerarVariacao}
            disabled={loading}
            className="mt-4 px-4 py-2 w-full rounded-xl bg-fyzen-accent text-black font-semibold shadow hover:brightness-110 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading && "animate-spin"}`} />
            {loading ? "Gerando..." : "Gerar nova variação"}
          </button>

          {novasVariacoes.length > 0 && (
            <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-2 custom-scroll">
              {novasVariacoes.map((variante, index) => (
                <div
                  key={index}
                  className="bg-slate-800/60 border border-white/10 rounded-xl p-4"
                >
                  <p className="text-fyzen-accent text-sm font-semibold mb-2">
                    Variação #{index + 1}
                  </p>
                  <ul className="text-slate-300 text-sm list-disc ml-5 space-y-1 mb-3">
                    {variante.exercicios.map((ex, i) => (
                      <li key={i} className="space-y-1">
                        <span>{ex}</span>
                        <ExerciseVideoLink exerciseName={ex} compact />
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => onReplaceGroup(variante)}
                    className="px-4 py-2 w-full bg-teal-400 text-black rounded-xl font-semibold hover:brightness-110 transition"
                  >
                    Usar esta variação
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </Dialog>
  );
}
