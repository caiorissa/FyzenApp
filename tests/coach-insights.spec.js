import { expect, test } from "@playwright/test";
import {
  getCoachHeadline,
  getCoachReply,
} from "../src/lib/workout/coachInsights.js";

const sessions = [
  {
    id: "treino-1",
    status: "completed",
    exercises: [
      {
        exerciseId: "supino-reto",
        name: "Supino reto",
        muscleGroup: "Peito",
        prescribedSets: 3,
        prescribedReps: "8-10",
        sets: [
          { weight: 40, reps: 10, completed: true },
          { weight: 40, reps: 9, completed: true },
          { weight: 40, reps: 8, completed: true },
        ],
      },
    ],
  },
];

test("coach responde cada intenção usando os registros do treino", () => {
  const progress = getCoachReply("Como está meu progresso?", sessions);
  const load = getCoachReply("Devo aumentar o peso?", sessions);
  const easy = getCoachReply("Meu treino está muito fácil.", sessions);
  const purpose = getCoachReply("Por que faço supino reto?", sessions);

  expect(new Set([progress, load, easy, purpose]).size).toBe(4);
  expect(progress).toContain("1 sessão");
  expect(progress).toContain("1.080 kg");
  expect(load).toContain("duas sessões");
  expect(easy).toContain("esforço percebido");
  expect(purpose).toContain("peitoral");
});

test("coach não recomenda aumentar carga sem histórico consistente", () => {
  const reply = getCoachReply("Devo aumentar o peso?", sessions);
  expect(reply).not.toContain("pode testar uma progressão");
  expect(reply).toContain("duas sessões");
});

test("análise inicial usa plural correto e conversa sem histórico orienta o próximo passo", () => {
  expect(getCoachHeadline(sessions)).toContain("1 sessão,");
  expect(getCoachReply("Devo aumentar o peso?", [])).toContain(
    "dois treinos do mesmo exercício",
  );
});
