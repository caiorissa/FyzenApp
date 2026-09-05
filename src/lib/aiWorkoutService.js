const API_URL = import.meta.env.VITE_AI_WORKOUT_API_URL;

// --------- GERAR SEMANA COMPLETA ----------
export async function gerarPlanoSemanaIA(form) {
  try {
    const res = await fetch(`${API_URL}/workout/week`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ form }),
    });

    if (!res.ok) throw new Error("Erro ao gerar plano semanal via IA");

    const data = await res.json();
    return data.treinosSemana; // backend retorna "treinosSemana"
  } catch (err) {
    console.error("Erro IA semana:", err);
    return null;
  }
}

// --------- REGENERAR DIA ----------
export async function regenerarDiaIA(form, dia, gruposAtuais) {
  try {
    const res = await fetch(`${API_URL}/workout/day`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ form, dia, gruposAtuais }),
    });

    if (!res.ok) throw new Error("Erro ao regenerar dia via IA");

    const data = await res.json();
    return data.grupos; // backend retorna "grupos"
  } catch (err) {
    console.error("Erro IA dia:", err);
    return null;
  }
}

// --------- REGENERAR SEMANA (ALIAS / COMPATIBILIDADE) ----------
export async function regenerarSemanaIA(form) {
  return await gerarPlanoSemanaIA(form);
}
