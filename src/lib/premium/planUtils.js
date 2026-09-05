import { getAlternatives } from "./exerciseAlternatives";

function separarNomeEInfo(raw) {
  if (!raw || typeof raw !== "string") return { nomeBase: "", resto: "" };

  const partes = raw.split("–");
  if (partes.length === 1) {
    return { nomeBase: raw.trim(), resto: "" };
  }

  const nomeBase = partes[0].trim();
  const resto = partes.slice(1).join("–").trim();
  return { nomeBase, resto };
}

function gerarVariacaoDeExercicio(exercicio, usadosNoGrupo) {
  const { nomeBase, resto } = separarNomeEInfo(exercicio);
  if (!nomeBase) return exercicio;

  let alternativas = getAlternatives(nomeBase) || [];
  alternativas = [...alternativas].sort(() => Math.random() - 0.5);
  alternativas = alternativas.filter(
    (alt) => !usadosNoGrupo.has(alt.toLowerCase().trim()),
  );

  let escolhida = null;
  if (alternativas.length > 0) {
    escolhida = alternativas[0];
  } else {
    const todas = getAlternatives(nomeBase) || [];
    escolhida = todas[Math.floor(Math.random() * todas.length)] || nomeBase;
  }

  usadosNoGrupo.add(escolhida.toLowerCase().trim());
  return resto ? `${escolhida} – ${resto}` : escolhida;
}

export function gerarNovaVariacaoDoGrupo(grupoOriginal, objetivo, local, form) {
  if (!grupoOriginal || !Array.isArray(grupoOriginal.exercicios)) {
    return grupoOriginal;
  }

  const usados = new Set();
  const limite =
    Number(form?.exerciciosPorGrupo) || grupoOriginal.exercicios.length;

  const novos = [];

  grupoOriginal.exercicios.forEach((ex) => {
    if (novos.length < limite) {
      novos.push(gerarVariacaoDeExercicio(ex, usados));
    }
  });

  let idx = 0;
  while (novos.length < limite) {
    const exBase =
      grupoOriginal.exercicios[idx % grupoOriginal.exercicios.length];
    novos.push(gerarVariacaoDeExercicio(exBase, usados));
    idx++;
  }

  return {
    ...grupoOriginal,
    exercicios: novos,
  };
}

export function regenerarDia(diaBase, form, objetivo, local) {
  if (!diaBase) return [];
  if (!Array.isArray(diaBase)) return [];

  return diaBase.map((grupoBase) =>
    gerarNovaVariacaoDoGrupo(grupoBase, objetivo, local, form),
  );
}

export function regenerarSemanaCompleta(semanaBase, form, objetivo, local) {
  if (!Array.isArray(semanaBase)) return [];

  return semanaBase.map((grupoBase) =>
    gerarNovaVariacaoDoGrupo(grupoBase, objetivo, local, form),
  );
}
