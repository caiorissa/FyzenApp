export async function gerarWeeklyInsights(treinos = [], dias = [], userPlan) {
  if (!Array.isArray(treinos) || treinos.length === 0) return null;

  const DIAS =
    dias && dias.length
      ? dias
      : ["segunda", "terça", "quarta", "quinta", "sexta"];

  const porDiaMap = {};
  DIAS.forEach((dia) => {
    porDiaMap[dia] = { dia, grupos: 0, exercicios: 0 };
  });

  let totalTreinos = 0;
  let totalExercicios = 0;
  const volumeGrupo = {};

  treinos.forEach((grupo, index) => {
    const dia = DIAS[index % DIAS.length];
    if (!porDiaMap[dia]) {
      porDiaMap[dia] = { dia, grupos: 0, exercicios: 0 };
    }

    const qtdExercicios = Array.isArray(grupo.exercicios)
      ? grupo.exercicios.length
      : 0;

    porDiaMap[dia].grupos += 1;
    porDiaMap[dia].exercicios += qtdExercicios;

    totalTreinos += 1;
    totalExercicios += qtdExercicios;

    const nomeGrupo = grupo.grupo || "Outro";
    volumeGrupo[nomeGrupo] = (volumeGrupo[nomeGrupo] || 0) + qtdExercicios;
  });

  const porDia = Object.values(porDiaMap);
  const diasAtivos = porDia.filter((d) => d.grupos > 0).length;

  const mediaExerciciosPorTreino =
    totalTreinos > 0 ? totalExercicios / totalTreinos : 0;

  const diaMaisForte =
    porDia.reduce(
      (prev, cur) => (cur.exercicios > (prev?.exercicios || 0) ? cur : prev),
      null,
    ) || null;

  const nivel =
    userPlan === "ultra" ? "ULTRA" : userPlan === "pro" ? "PRO" : "FREE";

  const basico = {
    totalTreinos,
    totalExercicios,
    mediaExerciciosPorTreino,
    diasAtivos,
    diaMaisForte,
    porDia,
    volume: volumeGrupo,
  };

  return {
    ...basico,
    nivel,
  };
}
