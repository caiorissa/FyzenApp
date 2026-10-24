const DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

function isText(value, maxLength) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

export function hasNutritionGenerationContext(data) {
  const form = data?.form;
  const analysis = data?.analysis;
  const treinos = data?.plan?.treinos;
  return Boolean(
    form &&
      ["sexo", "idade", "peso", "altura", "nivel", "objetivo"].every((field) => isText(String(form[field] ?? ""), 80)) &&
      Number(form.idade) > 0 &&
      Number(form.peso) > 0 &&
      Number(form.altura) > 0 &&
      analysis &&
      Number(analysis.gasto) > 0 &&
      Array.isArray(treinos) &&
      treinos.some((group) => isText(group?.grupo, 80) && Array.isArray(group?.exercicios) && group.exercicios.length > 0) &&
      Number.isFinite(Number(data?.nutrition?.total)) &&
      Number(data.nutrition.total) > 0,
  );
}

function normalizarTexto(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function validarRestricoesDoAlimento(item, preferences) {
  const food = normalizarTexto(item);
  const allergyText = normalizarTexto(preferences?.allergies);
  const allergies = /^\s*nenhum(?:a)?s?\s+conhecid(?:a|o)s?\s*[.!]?\s*$/.test(allergyText)
    ? []
    : allergyText.replace(/\s+e\s+/g, ",").split(/[,;\n]/).map((term) => term.trim()).filter(Boolean);
  if (allergies.some((term) => food.includes(term))) {
    throw new Error(`A edição incluiu um alimento indicado como alergia (${item}).`);
  }

  const restrictions = normalizarTexto(preferences?.restrictions);
  const avoided = restrictions.split(/[;,\n]+/).flatMap((clause) => {
    const match = clause.match(/(?:\bsem\s+(?:(?:consumir|comer)\s+)?|\bevitar\s+|\bevito\s+|\bnao\s+(?:consumo|como)\s+|\bexcluir\s+)([\p{L}\d][\p{L}\d -]{1,48})/u);
    return match ? [match[1].trim().replace(/\s+e\s+.*$/, "").replace(/[.!]+$/, "")] : [];
  });
  const violation = avoided.find((term) => food.includes(term));
  if (violation) throw new Error(`A edição contrariou a restrição “sem ${violation}”.`);
}

function validateEstimates(value) {
  const ranges = {
    calories: [1, 5000],
    protein: [0, 400],
    carbs: [0, 800],
    fat: [0, 250],
  };
  for (const [field, [min, max]] of Object.entries(ranges)) {
    const amount = value?.[field];
    if (!Number.isFinite(amount) || amount < min || amount > max) {
      throw new Error("O plano alimentar retornou estimativas inválidas.");
    }
  }
}

export function validarPlanoAlimentarSemanal(value, preferences = {}) {
  if (!value || value.version !== 1 || !isText(value.generatedAt, 40) ||
      !Number.isFinite(value.targetCalories) || value.targetCalories <= 0 || value.targetCalories > 6000 ||
      !Array.isArray(value.days) || value.days.length !== 7) {
    throw new Error("A IA retornou um plano semanal incompleto ou inválido.");
  }
  const dayNames = value.days.map((day) => String(day?.day ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR"));
  const expectedDays = DAYS.map((day) => day.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR"));
  if (new Set(dayNames).size !== 7 || expectedDays.some((day) => !dayNames.includes(day))) {
    throw new Error("A IA retornou dias da semana ausentes ou repetidos.");
  }
  for (const day of value.days) {
    if (!isText(day.day, 20) || typeof day.isRestDay !== "boolean" ||
        !Array.isArray(day.workoutGroups) || day.workoutGroups.length > 10 ||
        !day.workoutGroups.every((group) => isText(group, 80)) ||
        !Array.isArray(day.exercises) || day.exercises.length > 30 ||
        !day.exercises.every((exercise) => isText(exercise, 120)) ||
        !Array.isArray(day.meals) || day.meals.length < 3 || day.meals.length > 6) {
      throw new Error(`O conteúdo de ${day.day || "um dia"} está incompleto ou fora do limite.`);
    }
    for (const meal of day.meals) {
      if (!isText(meal.name, 100) || !Array.isArray(meal.foods) || meal.foods.length < 1 || meal.foods.length > 12) {
        throw new Error(`A IA retornou uma refeição inválida em ${day.day}.`);
      }
      if (!meal.foods.every((food) => isText(food?.item, 120) && isText(food?.amount, 80))) {
        throw new Error(`A IA retornou alimento ou porção inválida em ${day.day}.`);
      }
      for (const food of meal.foods) validarRestricoesDoAlimento(food.item, preferences);
      validateEstimates(meal.estimatedNutrition);
    }
  }
  return true;
}
