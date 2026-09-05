import React, { useEffect, useState, useRef } from "react";
import { atualizarStreak } from "../lib/useStreak.js";
import confetti from "canvas-confetti";
import { registrarTreinoConcluido } from "../lib/treinoService";

const STORAGE_KEY = "fyzen-checklist-v1";

export default function WorkoutChecklist({
  treino = [],
  dia,
  grupo,
  bloqueado,
}) {
  const [checked, setChecked] = useState([]);
  const [streakMessage, setStreakMessage] = useState("");
  const prevCompleteRef = useRef(false);
  const firstRenderRef = useRef(true);
  const userActionRef = useRef(false); // 👈 marca se veio de clique do usuário

  // Carrega o estado salvo para esse dia + grupo
  useEffect(() => {
    let next = Array.isArray(treino) ? Array(treino.length).fill(false) : [];
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const saved = data[`${dia}::${grupo}`];
      if (
        saved &&
        JSON.stringify(saved.treino) === JSON.stringify(treino) &&
        Array.isArray(saved.checked) &&
        saved.checked.length === next.length
      )
        next = saved.checked;
    } catch (error) {
      console.error("Não foi possível recuperar o checklist:", error);
      setStreakMessage(
        "Não foi possível recuperar as marcações salvas neste dispositivo.",
      );
    }
    userActionRef.current = false;
    prevCompleteRef.current = next.length > 0 && next.every(Boolean);
    setChecked((previous) =>
      JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
    );
  }, [treino, dia, grupo]);

  // Salva o estado no localStorage quando o usuário marca/desmarca
  useEffect(() => {
    if (!Array.isArray(checked) || checked.length === 0) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      const key = `${dia}::${grupo}`;
      data[key] = {
        treino,
        checked,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignora erro de localStorage
    }
  }, [checked, dia, grupo, treino]);

  // Detecta quando TODOS os exercícios foram concluídos
  useEffect(() => {
    // ignora primeira render
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    // se a mudança de checked NÃO veio de clique do usuário, não dispara nada
    if (!userActionRef.current) {
      const completoAgora = checked.every(Boolean);
      prevCompleteRef.current = completoAgora;
      return;
    }

    if (!Array.isArray(checked) || !Array.isArray(treino)) return;
    if (checked.length === 0 || treino.length === 0) return;
    if (checked.length !== treino.length) return;

    const completoAgora = checked.every(Boolean);
    const completoAntes = prevCompleteRef.current;

    if (!completoAntes && completoAgora) {
      const novaStreak = atualizarStreak();
      window.dispatchEvent(new Event("streakUpdate"));

      registrarTreinoConcluido(dia, grupo, treino.length, treino, novaStreak);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        disableForReducedMotion: true,
      });

      setStreakMessage(
        novaStreak === 1
          ? "🎉 Parabéns! Você começou sua streak hoje!"
          : `🔥 Você está no dia ${novaStreak} da sua streak!`,
      );
    }

    prevCompleteRef.current = completoAgora;
    userActionRef.current = false; // reseta flag
  }, [checked, dia, grupo, treino]);

  const toggle = (index) => {
    if (bloqueado) return;
    userActionRef.current = true; // 👈 marca que é ação do usuário
    setChecked((prev) => {
      const arr = [...prev];
      arr[index] = !arr[index];
      return arr;
    });
  };

  if (!Array.isArray(treino) || treino.length === 0) {
    return (
      <p className="text-xs text-slate-500 mt-2">
        Nenhum exercício cadastrado para este grupo.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {streakMessage && (
        <p role="status" className="text-xs text-fyzen-accent mb-1">
          {streakMessage}
        </p>
      )}

      <ul className="space-y-2">
        {treino.map((item, i) => {
          const completo = checked[i];

          return (
            <li
              key={i}
              className={`flex items-center gap-3 py-1 ${
                bloqueado ? "text-fyzen-muted" : ""
              }`}
            >
              <button
                type="button"
                disabled={bloqueado}
                role="checkbox"
                aria-checked={!!completo}
                aria-label={item}
                onClick={() => toggle(i)}
                className={`w-11 h-11 shrink-0 rounded-lg flex items-center justify-center border text-sm
                  ${
                    completo
                      ? "bg-emerald-400 border-emerald-300 text-black"
                      : "bg-slate-900/60 border-slate-600 text-slate-400"
                  }`}
              >
                {completo && "✓"}
              </button>

              <span
                className={`leading-relaxed text-sm ${
                  completo ? "line-through text-slate-500" : "text-slate-200"
                }`}
              >
                {item}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
