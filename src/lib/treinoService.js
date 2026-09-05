import { auth, db } from "./firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
} from "firebase/firestore";
import { getWeekKey, getTodayKey } from "./dateUtils";

async function atualizarMetasDepoisDoTreino(
  user,
  totalExercicios,
  minutosEstimados,
) {
  try {
    const metasRef = doc(db, "metas", user.uid);
    const snap = await getDoc(metasRef);
    const data = snap.exists() ? snap.data() : {};

    const hojeKey = getTodayKey();
    const semanaKey = getWeekKey();

    const minutosDiariosAtual =
      (data.lastResetDiario === hojeKey ? data.minutosDiariosAtual || 0 : 0) +
      minutosEstimados;

    const exerciciosSemanaisAtual =
      (data.lastResetSemanal === semanaKey
        ? data.exerciciosSemanaisAtual || 0
        : 0) + totalExercicios;

    await setDoc(
      metasRef,
      {
        // metas alvo: se já existirem, mantêm; se não, criam defaults
        minutosDiariosAlvo: data.minutosDiariosAlvo || 30,
        exerciciosSemanaisAlvo: data.exerciciosSemanaisAlvo || 20,

        // progresso atual
        minutosDiariosAtual,
        exerciciosSemanaisAtual,

        lastResetDiario: hojeKey,
        lastResetSemanal: semanaKey,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (err) {
    console.error("Erro ao atualizar metas:", err);
  }
}

/**
 * Registra treino concluído:
 * - Atualiza doc `progresso/{uid}`
 * - Cria registro em `historicoTreino/{uid}/registros`
 * - Atualiza metas em `metas/{uid}`
 */
export async function registrarTreinoConcluido(
  dia,
  grupo,
  totalExercicios,
  exercicios = [],
  streakAtual = null,
) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const ref = doc(db, "progresso", user.uid);
    const snap = await getDoc(ref);
    const prev = snap.exists() ? snap.data() : {};

    const weekKey = getWeekKey();

    // minutos e calorias aproximados
    const minutosPorTreino = Math.max(20, totalExercicios * 4);
    const caloriasPorTreino = Math.round(minutosPorTreino * 6.5);

    // VOLUME POR GRUPO MUSCULAR
    const volumePrev = prev.volumeGrupo || {};
    const volumeAtual = volumePrev[grupo] || 0;

    const novoVolumeGrupo = {
      ...volumePrev,
      [grupo]: volumeAtual + totalExercicios,
    };

    // DIAS TREINADOS
    const diasPrev = prev.dias || {};
    const dadosDiaPrev = diasPrev[dia] || {
      gruposConcluidos: 0,
      totalExercicios: 0,
    };

    const dadosDia = {
      gruposConcluidos: dadosDiaPrev.gruposConcluidos + 1,
      totalExercicios: dadosDiaPrev.totalExercicios + totalExercicios,
    };

    const dias = {
      ...diasPrev,
      [dia]: dadosDia,
    };

    let bestDay = prev.bestDay || dia;
    let maxGrupos = 0;
    Object.entries(dias).forEach(([nomeDia, info]) => {
      if ((info.gruposConcluidos || 0) > maxGrupos) {
        maxGrupos = info.gruposConcluidos;
        bestDay = nomeDia;
      }
    });

    const payload = {
      ...prev,
      workouts: (prev.workouts || 0) + 1,
      minutes: (prev.minutes || 0) + minutosPorTreino,
      calories: (prev.calories || 0) + caloriasPorTreino,
      bestDay,
      dias,
      volumeGrupo: novoVolumeGrupo,
      weekKey,
      lastCompletedGroup: grupo ?? prev.lastCompletedGroup ?? null,
      streakAtual: streakAtual ?? prev.streakAtual ?? 0,
      updatedAt: serverTimestamp(),
    };

    // garante que nenhum campo undefined vá pro Firestore
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    await setDoc(ref, payload, { merge: true });

    // registro de histórico
    const registroRef = doc(
      collection(db, "historicoTreino", user.uid, "registros"),
    );
    await setDoc(
      registroRef,
      {
        timestamp: serverTimestamp(),
        dia,
        grupo,
        exercicios,
        totalExercicios,
        tempoEstimado: minutosPorTreino,
        caloriasEstimadas: caloriasPorTreino,
        volumeGrupo: { [grupo]: totalExercicios },
        consistencia: {
          streakAtual: streakAtual ?? null,
          weekKey,
        },
      },
      { merge: true },
    );

    // metas
    await atualizarMetasDepoisDoTreino(user, totalExercicios, minutosPorTreino);
  } catch (err) {
    console.error("Erro ao registrar treino concluído no Firestore:", err);
  }
}
