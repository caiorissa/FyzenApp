import { expect, test } from "@playwright/test";
import {
  calculateEstimated1RM,
  calculateWorkoutVolume,
  getProgressionSuggestion,
} from "../src/lib/workout/analytics.js";
import { parseLegacyExercise } from "../src/lib/workout/adapters.js";
import { limitToMainExercises } from "../src/lib/workout/mainExercises.js";
import {
  EXERCISE_VIDEO_LINKS,
  getYouTubeEmbedUrl,
} from "../src/lib/workout/exerciseVideos.js";
import { MAIN_EXERCISE_CATALOG } from "../src/lib/workout/mainExercises.js";

test("analytics de treino calcula apenas dados válidos", () => {
  expect(
    calculateWorkoutVolume([
      {
        sets: [
          { weight: 70, reps: 10 },
          { weight: 72.5, reps: 8 },
        ],
      },
    ]),
  ).toBe(1280);
  expect(calculateEstimated1RM(80, 6)).toBe(96);
  expect(calculateEstimated1RM(50, 20)).toBeNull();
  expect(parseLegacyExercise("Supino reto – 4x8-10").exerciseId).toBe(
    "supino-reto",
  );
});

test("progressão exige duas sessões no topo da faixa", () => {
  const exercise = {
    exerciseId: "supino-reto",
    prescribedSets: 2,
    prescribedReps: "8-10",
  };
  const sessions = [1, 2].map(() => ({
    exercises: [
      {
        ...exercise,
        sets: [
          { weight: 70, reps: 10, completed: true },
          { weight: 70, reps: 10, completed: true },
        ],
      },
    ],
  }));
  expect(getProgressionSuggestion(exercise, sessions)).toMatchObject({
    from: 70,
    to: 72.5,
  });
});

test("catálogo recusa exercícios inventados e limita por grupo e local", () => {
  expect(
    limitToMainExercises(
      [
        {
          grupo: "Peito e tríceps",
          exercicios: [
            "Supino reto — 4x10",
            "Tríceps corda — 3x12",
            "Exercício inventado — 3x8",
            "Supino inclinado — 3x10",
          ],
        },
      ],
      { local: "academia", exerciciosPorGrupo: "2" },
    ),
  ).toEqual([
    {
      grupo: "Peito e tríceps",
      exercicios: ["Supino reto — 4x10", "Tríceps corda — 3x12"],
    },
  ]);

  expect(
    limitToMainExercises(
      [{ grupo: "Pernas", exercicios: ["Cadeira extensora — 3x12"] }],
      { local: "casa" },
    ),
  ).toBeNull();
  expect(
    limitToMainExercises(
      [{ grupo: "Pernas", exercicios: ["Movimento desconhecido — 3x12"] }],
      { local: "academia" },
    ),
  ).toBeNull();
});

test("links do YouTube são convertidos em embeds e URLs externas são recusadas", () => {
  expect(
    getYouTubeEmbedUrl("https://www.youtube.com/watch?v=M7lc1UVf-VE"),
  ).toBe("https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?playsinline=1");
  expect(getYouTubeEmbedUrl("https://youtu.be/M7lc1UVf-VE")).toBe(
    "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?playsinline=1",
  );
  expect(getYouTubeEmbedUrl("https://example.com/watch?v=M7lc1UVf-VE")).toBe(
    "",
  );
  expect(
    getYouTubeEmbedUrl("https://youtube.com/results?search_query=supino"),
  ).toBe("");
});

test("lista de links tem uma entrada vazia para cada exercício do catálogo", () => {
  expect(Object.keys(EXERCISE_VIDEO_LINKS)).toHaveLength(
    MAIN_EXERCISE_CATALOG.length,
  );
  for (const { name } of MAIN_EXERCISE_CATALOG) {
    expect(EXERCISE_VIDEO_LINKS).toHaveProperty(name, "");
  }
});
