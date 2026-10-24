import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hasNutritionGenerationContext,
  validarPlanoAlimentarSemanal,
} from "../src/lib/mealPlanValidation.js";
import { gerarPlanoAlimentarSemanal } from "../src/lib/aiMealPlanService.js";

function validPlan() {
  return {
    version: 1,
    generatedAt: "2026-10-23T12:00:00.000Z",
    targetCalories: 2300,
    days: ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"].map((day) => ({
      day,
      workoutGroups: day === "segunda" ? ["Pernas"] : [],
      exercises: day === "segunda" ? ["Agachamento livre – 4x10"] : [],
      isRestDay: day !== "segunda",
      meals: ["Café da manhã", "Almoço", "Jantar"].map((name) => ({
        name,
        foods: [{ item: "Arroz", amount: "100 g" }],
        estimatedNutrition: { calories: 300, protein: 10, carbs: 50, fat: 5 },
      })),
    })),
  };
}

test("valida o plano completo que o backend pode devolver", () => {
  assert.equal(validarPlanoAlimentarSemanal(validPlan()), true);
});

test("recusa plano malformado e valores de estimativa inválidos", () => {
  const missingDay = validPlan();
  missingDay.days.pop();
  assert.throws(() => validarPlanoAlimentarSemanal(missingDay), /plano semanal incompleto/i);

  const invalidEstimate = validPlan();
  invalidEstimate.days[0].meals[0].estimatedNutrition.calories = Infinity;
  assert.throws(() => validarPlanoAlimentarSemanal(invalidEstimate), /estimativa/i);
});

test("recusa edição que introduza alimento alergênico ou restrito", () => {
  const allergyViolation = validPlan();
  allergyViolation.days[0].meals[0].foods[0].item = "Pasta de amendoim";
  assert.throws(
    () => validarPlanoAlimentarSemanal(allergyViolation, { allergies: "amendoim", restrictions: "Nenhuma conhecida" }),
    /alergia/i,
  );

  const restrictionViolation = validPlan();
  restrictionViolation.days[0].meals[0].foods[0].item = "Filé de peixe";
  assert.throws(
    () => validarPlanoAlimentarSemanal(restrictionViolation, { allergies: "Nenhuma conhecida", restrictions: "Sem peixe" }),
    /restrição/i,
  );
});

test("só libera geração com perfil, análise, meta e treino salvos", () => {
  const profile = {
    form: { sexo: "feminino", idade: "28", peso: "63", altura: "165", nivel: "iniciante", objetivo: "hipertrofia" },
    analysis: { gasto: 2200 },
    plan: { treinos: [{ grupo: "Pernas", exercicios: ["Agachamento livre"] }] },
    nutrition: { total: 2300 },
  };
  assert.equal(hasNutritionGenerationContext(profile), true);
  assert.equal(hasNutritionGenerationContext({ ...profile, plan: { treinos: [] } }), false);
  assert.equal(hasNutritionGenerationContext({ ...profile, nutrition: { total: 0 } }), false);
});

test("envia somente preferências com token Firebase e valida a resposta", async () => {
  let request;
  const result = await gerarPlanoAlimentarSemanal(
    { getIdToken: async () => "firebase-token" },
    { allergies: "amendoim", restrictions: "sem lactose", preferences: "comida brasileira", clinicalDietRequired: false },
    async (_url, options) => {
      request = options;
      return { ok: true, json: async () => ({ plan: validPlan() }) };
    },
    "https://api.example.test",
  );
  assert.equal(result.days.length, 7);
  assert.equal(request.headers.Authorization, "Bearer firebase-token");
  assert.deepEqual(JSON.parse(request.body), {
    allergies: "amendoim",
    restrictions: "sem lactose",
    preferences: "comida brasileira",
    clinicalDietRequired: false,
  });
});
