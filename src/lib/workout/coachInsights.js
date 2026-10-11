import { calculateWorkoutVolume, getProgressionSuggestion } from "./analytics.js";

const normalize = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const completedExercises = (sessions = []) =>
  sessions.flatMap((session) =>
    (session.exercises || [])
      .filter((exercise) => (exercise.sets || []).some((set) => set.completed))
      .map((exercise) => ({ ...exercise, sessionId: session.id })),
  );

const formatNumber = (value) =>
  Math.round(Number(value) || 0).toLocaleString("pt-BR");

const volumeFor = (session) =>
  calculateWorkoutVolume(
    (session.exercises || []).map((exercise) => ({
      ...exercise,
      sets: (exercise.sets || []).filter((set) => set.completed),
    })),
  );

const musclePurpose = (group = "") => {
  const muscle = normalize(group);
  if (/peito|peitoral/.test(muscle)) return "peitoral";
  if (/costas/.test(muscle)) return "costas";
  if (/perna|gluteo|posterior/.test(muscle)) return "pernas e cadeia posterior";
  if (/ombro|trapezio/.test(muscle)) return "ombros";
  if (/biceps/.test(muscle)) return "bíceps";
  if (/triceps/.test(muscle)) return "tríceps";
  if (/core|abdomen/.test(muscle)) return "estabilidade do tronco";
  return group || "o grupo muscular indicado no seu treino";
};

function findExercise(question, sessions) {
  const query = normalize(question);
  const exercises = completedExercises(sessions);
  return (
    exercises.find((exercise) => {
      const name = normalize(exercise.name);
      return name.length > 3 && query.includes(name);
    }) || exercises.at(-1)
  );
}

function progressionReply(question, sessions) {
  const query = normalize(question);
  const allExercises = completedExercises(sessions);
  const target = findExercise(question, sessions);
  const candidates = target
    ? [target]
    : [...new Map(allExercises.map((exercise) => [exercise.exerciseId, exercise])).values()];
  const suggestions = candidates
    .map((exercise) => ({
      exercise,
      suggestion: getProgressionSuggestion(exercise, sessions),
    }))
    .filter(({ suggestion }) => suggestion);

  if (suggestions.length) {
    const { exercise, suggestion } = suggestions[0];
    return `Para ${exercise.name}, seus dois últimos registros atingiram o topo da faixa em todas as séries. Você pode testar uma progressão pequena, de ${suggestion.from} kg para ${suggestion.to} kg, mantendo a execução controlada. Se a técnica piorar, volte à carga anterior.`;
  }

  if (query.includes("facil")) {
    return target
      ? `Os registros de ${target.name} mostram carga e repetições, mas não registram o esforço percebido. Por isso não dá para concluir só pelos números que está fácil. Anote quantas repetições ainda conseguiria fazer; considere subir pouco a carga apenas depois de completar todas as séries com boa técnica em sessões consecutivas.`
      : "Seu histórico ainda não confirma que a carga está fácil: o Fyzen não registra o esforço percebido. Anote quantas repetições ainda conseguiria fazer em cada série. Só considere subir pouco a carga depois de completar todas as séries com boa técnica em sessões consecutivas.";
  }

  if (!target || allExercises.filter((item) => item.exerciseId === target.exerciseId).length < 2) {
    const name = target ? ` de ${target.name}` : " para o mesmo exercício";
    return `Ainda não há duas sessões registradas${name} para comparar. Mantenha uma carga que permita completar as séries com boa técnica e registre as repetições; depois de duas sessões consistentes no topo da faixa, posso avaliar uma progressão.`;
  }
  return `Ainda não atingiu o topo da faixa de repetições em todas as séries nas duas últimas sessões${target ? ` de ${target.name}` : ""}. Mantenha a carga e tente completar as repetições previstas com boa técnica antes de aumentá-la.`;
}

export function getCoachHeadline(sessions = []) {
  const recent = sessions.slice(-3);
  if (!recent.length)
    return "Conclua seu primeiro treino no Modo Treino. A partir dele, o Fyzen passa a considerar séries, carga e repetições nas análises.";

  const volume = recent.reduce((total, session) => total + volumeFor(session), 0);
  const count = recent.length;
  return `Nas últimas ${count} ${count === 1 ? "sessão" : "sessões"}, você registrou ${formatNumber(volume)} kg de volume. A análise compara seu histórico e fica mais precisa a cada treino concluído.`;
}

export function getCoachReply(question, sessions = []) {
  const query = normalize(question.trim());
  if (!query) return "Escreva uma pergunta sobre seu treino para eu analisar.";
  if (!sessions.length) {
    if (/aumentar|peso|carga/.test(query))
      return "Ainda não tenho sessões concluídas para avaliar sua carga. Registre séries, pesos e repetições em dois treinos do mesmo exercício; assim consigo verificar uma progressão com mais segurança.";
    if (/facil|leve|dificil|pesado/.test(query))
      return "Ainda não tenho registros suficientes para avaliar o esforço. Depois do treino, registre carga e repetições e anote também quantas repetições sobrariam com boa técnica.";
    if (/por que|porque|objetivo|musculo/.test(query))
      return "Para explicar um exercício específico, pergunte pelo nome dele. O Fyzen usa o grupo muscular e o histórico do seu plano para contextualizar a resposta.";
    return "Ainda não há sessões concluídas salvas. Registre um treino no Modo Treino e posso analisar seu volume, suas cargas e sua evolução.";
  }

  if (/aumentar|peso|carga|progred/.test(query))
    return progressionReply(question, sessions);
  if (/facil|leve|dificil|pesado|esforco/.test(query))
    return progressionReply("meu treino está muito fácil", sessions);

  if (/por que|porque|objetivo|musculo/.test(query)) {
    const exercise = findExercise(question, sessions);
    if (!exercise)
      return "Ainda não encontrei exercícios nas sessões salvas. Conclua um treino no Modo Treino ou inclua o nome do exercício na pergunta.";
    return `${exercise.name} trabalha principalmente ${musclePurpose(exercise.muscleGroup)}. Ele aparece no registro do seu treino; a escolha também pode variar conforme seu objetivo e a organização do plano.`;
  }

  if (/progresso|evolu|historico|volume/.test(query)) {
    const recent = sessions.slice(-3);
    const volumes = recent.map(volumeFor);
    const latest = volumes.at(-1) || 0;
    const previous = volumes.at(-2);
    const comparison = previous === undefined
      ? " Ainda preciso de outra sessão para comparar a tendência."
      : latest > previous
        ? " O volume da sessão mais recente ficou acima da anterior."
        : latest < previous
          ? " O volume da sessão mais recente ficou abaixo da anterior; isso pode acontecer por diferenças no treino."
          : " O volume ficou igual ao da sessão anterior.";
    return `Nas últimas ${recent.length} ${recent.length === 1 ? "sessão" : "sessões"}, o volume total foi ${formatNumber(volumes.reduce((sum, value) => sum + value, 0))} kg. Na sessão mais recente foram ${formatNumber(latest)} kg.${comparison}`;
  }

  const exercise = findExercise(question, sessions);
  if (exercise) {
    const sets = (exercise.sets || []).filter((set) => set.completed);
    const lastSet = sets.at(-1);
    const performance = lastSet
      ? ` No último registro, sua última série concluída foi ${lastSet.weight || 0} kg × ${lastSet.reps || 0}.`
      : " Ainda não há séries concluídas para esse exercício.";
    return `${exercise.name} está registrado para ${musclePurpose(exercise.muscleGroup)}.${performance} Pergunte sobre progresso, execução ou carga para uma leitura mais específica.`;
  }

  return `${getCoachHeadline(sessions)} Para responder com precisão, pergunte sobre progresso, carga ou cite o exercício pelo nome.`;
}
