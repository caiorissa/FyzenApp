import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { regenerarDiaIA } from "@/lib/aiWorkoutService";
import { usePremium } from "@/context/PremiumContext";
import { useToast } from "../Toast.jsx";

export default function RegenerateDayButton({
  form,
  diaSelecionado,
  dayData,
  onRegenerated,
}) {
  const { nivel, isUltra } = usePremium();
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  if (!isUltra || nivel !== "ultra") return null;
  async function handleClick() {
    setLoading(true);
    try {
      const novoDia = await regenerarDiaIA(form, diaSelecionado, dayData);
      if (!Array.isArray(novoDia) || !novoDia.length)
        throw new Error("Nenhum treino retornado");
      await onRegenerated(novoDia);
      showToast("Novo treino do dia salvo.");
    } catch (error) {
      console.error("Erro ao atualizar treino do dia:", error);
      showToast(
        "Não foi possível atualizar o treino. Tente novamente.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="btn-ghost w-full"
    >
      <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
      {loading ? "Gerando…" : "Gerar novo treino do dia"}
    </button>
  );
}
