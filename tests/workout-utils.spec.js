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
  getExerciseVideoUrl,
  getLocalExerciseVideoUrl,
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

test("seletor permite até cinco exercícios principais por grupo", () => {
  const exercises = [
    "Agachamento com barra — 4x8",
    "Leg press — 3x10",
    "Cadeira extensora — 3x12",
    "Cadeira flexora — 3x12",
    "Hack squat — 3x10",
    "Agachamento livre — 3x10",
  ];

  expect(
    limitToMainExercises(
      [{ grupo: "Pernas", exercicios: exercises }],
      { local: "academia", exerciciosPorGrupo: "5" },
    )[0].exercicios,
  ).toHaveLength(5);
  expect(
    limitToMainExercises(
      [{ grupo: "Pernas", exercicios: exercises }],
      { local: "academia", exerciciosPorGrupo: "6" },
    )[0].exercicios,
  ).toHaveLength(5);
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

test("links de vídeo cobrem o catálogo e resolvem gravações próprias", () => {
  expect(Object.keys(EXERCISE_VIDEO_LINKS).sort()).toEqual(
    MAIN_EXERCISE_CATALOG.map(({ name }) => name).sort(),
  );
  for (const { name } of MAIN_EXERCISE_CATALOG) {
    const url = EXERCISE_VIDEO_LINKS[name];
    expect(url, name).not.toBe("");
    expect(
      getLocalExerciseVideoUrl(url) || getYouTubeEmbedUrl(url),
      name,
    ).not.toBe("");
  }
  expect(getExerciseVideoUrl("Voador (costas)")).toBe(
    "/videos/exercises/voador-inverso.mp4",
  );
  expect(getExerciseVideoUrl("Supino reto — 4x10")).toBe(
    "/videos/exercises/supino-reto.mp4",
  );
  expect(getExerciseVideoUrl("Agachamento livre")).toBe(
    "/videos/exercises/agachamento-barra.mp4",
  );
  for (const exercise of [
    "rosca alternada com halteres",
    "puxada alta com o peso do corpo",
    "supino reto com barra",
    "supino inclinado com halter",
    "tríceps da cordinha",
    "agachamento com barra livre",
    "cadeira flexora",
    "remada com o triângulo na polia",
    "cadeira extensora",
    "voador (costas)",
    "peck deck",
    "abdominal normal",
    "desenvolvimento com halter",
    "leg press",
  ]) {
    expect(getExerciseVideoUrl(exercise), exercise).not.toBe("");
  }
  expect(getLocalExerciseVideoUrl("/videos/exercises/leg-press.mp4")).toBe(
    "/videos/exercises/leg-press.mp4",
  );
  expect(getLocalExerciseVideoUrl("https://example.com/video.mp4")).toBe("");
});
