import assert from "node:assert/strict";
import { test } from "node:test";
import { buildWeeklyMealPlanUpdate } from "../src/lib/mealPlanPersistence.js";

test("monta atualização aditiva sem incluir meta, treino ou dados do diário", () => {
  const plan = { version: 1, days: [{ day: "segunda" }] };
  const preferences = { allergies: "Nenhuma conhecida", restrictions: "Nenhuma conhecida", preferences: "" };
  const update = buildWeeklyMealPlanUpdate(plan, preferences, "server-time");
  assert.deepEqual(update, {
    nutrition: { planoSemanal: plan, preferenciasPlanoSemanal: preferences },
    updatedAt: "server-time",
  });
  assert.equal(Object.hasOwn(update.nutrition, "total"), false);
  assert.equal(Object.hasOwn(update, "plan"), false);
  assert.equal(Object.hasOwn(update, "refeicoes"), false);
});
