import { expect, test } from "@playwright/test";
import {
  calculateEstimated1RM,
  calculateWorkoutVolume,
  getProgressionSuggestion,
} from "../src/lib/workout/analytics.js";
import { parseLegacyExercise } from "../src/lib/workout/adapters.js";

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
