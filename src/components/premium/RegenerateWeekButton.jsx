import { useToast } from "../Toast.jsx";
import React, { useState } from "react";
import { RefreshCw } from "lucide-react";

export default function RegenerateWeekButton({
  nivel,
  isUltra,
  form,
  objetivo,
  local,
  gerarPlanoTreino, // mesma função do PlanScreen
  onRegenerated, // callback que recebe NOVO array completo de treinos
}) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Segurança extra: só ULTRA acessa esse botão
  if (!isUltra || nivel !== "ultra") {
    return null;
  }

  const handleClick = async () => {
    if (!gerarPlanoTreino || !objetivo || !local) return;

    try {
      setLoading(true);

      const novaSemana = gerarPlanoTreino(objetivo, local, form);

      if (!novaSemana || !novaSemana.length) {
        showToast(
          "Não foi possível gerar uma nova semana de treinos.",
          "error",
        );
        return;
      }

      // Devolve a semana inteira pro PlanScreen
      await onRegenerated(novaSemana);
      showToast("Nova semana salva no seu plano.");
    } catch (err) {
      console.error("Erro ao regenerar semana:", err);
      showToast(
        "Não foi possível atualizar a semana. Tente novamente.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="btn-ghost w-full"
    >
      <RefreshCw className="w-4 h-4" />
      {loading ? "Gerando nova semana..." : "Gerar nova semana inteira"}
    </button>
  );
}
