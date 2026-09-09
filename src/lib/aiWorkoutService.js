const API_URL = (import.meta.env.VITE_AI_WORKOUT_API_URL || "").replace(
  /\/$/,
  "",
);

async function solicitarTreinoIA(endpoint, payload) {
  if (!API_URL) {
    console.warn("[Fyzen AI] URL do serviço não configurada.");
    return null;
  }

  try {
    console.info(`[Fyzen AI] Enviando solicitação para ${endpoint}.`);
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`[Fyzen AI] Serviço respondeu com HTTP ${res.status}.`);
      return null;
    }

    const data = await res.json();
    console.info(`[Fyzen AI] Resposta recebida de ${endpoint}.`);
    return data;
  } catch (error) {
    console.warn("[Fyzen AI] Não foi possível concluir a solicitação.", {
      tipo: error?.name || "Erro de rede",
    });
    // A IA é complementar: a tela deve continuar com o gerador determinístico.
    return null;
  }
}

// --------- GERAR SEMANA COMPLETA ----------
export async function gerarPlanoSemanaIA(form) {
  const data = await solicitarTreinoIA("/workout/week", { form });
  // O backend atual retorna `treinos`; versões anteriores retornavam
  // `treinosSemana`. Aceitamos ambos para manter o contrato compatível.
  const treinos = data?.treinosSemana || data?.treinos;
  console.info(
    `[Fyzen AI] ${Array.isArray(treinos) ? treinos.length : 0} grupo(s) recebido(s) para a semana.`,
  );
  return Array.isArray(treinos) ? treinos : null;
}

// --------- REGENERAR DIA ----------
export async function regenerarDiaIA(form, dia, gruposAtuais) {
  const data = await solicitarTreinoIA("/workout/day", {
    form,
    dia,
    gruposAtuais,
  });
  return Array.isArray(data?.grupos) ? data.grupos : null;
}

// --------- REGENERAR SEMANA (ALIAS / COMPATIBILIDADE) ----------
export async function regenerarSemanaIA(form) {
  return await gerarPlanoSemanaIA(form);
}
