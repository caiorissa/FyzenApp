import {
  applyMainExercisePolicy,
  limitToMainExercises,
} from "./workout/mainExercises.js";

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
  const formComFocoPrincipal = applyMainExercisePolicy(form);
  const data = await solicitarTreinoIA("/workout/week", {
    form: formComFocoPrincipal,
  });
  // O backend atual retorna `treinos`; versões anteriores retornavam
  // `treinosSemana`. Aceitamos ambos para manter o contrato compatível.
  const treinos = data?.treinosSemana || data?.treinos;
  console.info(
    `[Fyzen AI] ${Array.isArray(treinos) ? treinos.length : 0} grupo(s) recebido(s) para a semana.`,
  );
  return limitToMainExercises(treinos, formComFocoPrincipal);
}

// --------- REGENERAR DIA ----------
export async function regenerarDiaIA(form, dia, gruposAtuais) {
  const formComFocoPrincipal = applyMainExercisePolicy(form);
  const gruposFixos = Array.isArray(gruposAtuais)
    ? gruposAtuais.map((grupo) => grupo.grupo).filter(Boolean)
    : [];
  const formDoDia = {
    ...formComFocoPrincipal,
    diretrizExercicios: gruposFixos.length
      ? `${formComFocoPrincipal.diretrizExercicios} No dia ${dia}, mantenha exatamente estes grupos musculares e esta ordem: ${gruposFixos.join(", ")}. Troque somente os exercícios dentro de cada grupo.`
      : formComFocoPrincipal.diretrizExercicios,
  };
  const data = await solicitarTreinoIA("/workout/day", {
    form: formDoDia,
    dia,
    gruposAtuais: limitToMainExercises(gruposAtuais, formDoDia),
    gruposMuscularesFixos: gruposFixos,
  });
  return limitToMainExercises(data?.grupos, formDoDia, gruposAtuais);
}

// --------- REGENERAR SEMANA (ALIAS / COMPATIBILIDADE) ----------
export async function regenerarSemanaIA(form) {
  return await gerarPlanoSemanaIA(form);
}
