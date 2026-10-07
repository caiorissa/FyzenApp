export const MAX_MAIN_EXERCISES_PER_GROUP = 3;

export const MAIN_EXERCISE_CATALOG = [
  { name: "Abdominal bicicleta", category: "core" },
  { name: "Abdominal canivete", category: "core" },
  { name: "Afundo", category: "legs" },
  { name: "Agachamento com halteres", category: "legs" },
  { name: "Agachamento goblet", category: "legs" },
  { name: "Avanço", category: "legs" },
  { name: "Agachamento + salto", category: "legs" },
  { name: "Agachamento búlgaro", category: "legs" },
  { name: "Agachamento com barra", category: "legs" },
  { name: "Agachamento frontal", category: "legs" },
  { name: "Agachamento guiado", category: "legs" },
  { name: "Agachamento livre", category: "legs" },
  { name: "Agachamento no Smith", category: "legs" },
  { name: "Agachamento sumô", category: "legs" },
  { name: "Barra fixa", category: "back" },
  { name: "Barra fixa assistida", category: "back" },
  { name: "Bicicleta ergométrica", category: "cardio" },
  { name: "Cadeira abdutora", category: "legs" },
  { name: "Cadeira extensora", category: "legs" },
  { name: "Cadeira flexora", category: "legs" },
  { name: "Caminhada inclinada na esteira", category: "cardio" },
  { name: "Corrida leve", category: "cardio" },
  { name: "Crucifixo com halteres", category: "chest" },
  { name: "Crossover", category: "chest" },
  { name: "Burpee", category: "cardio" },
  { name: "Corrida estacionária", category: "cardio" },
  { name: "Corda naval", category: "cardio" },
  { name: "Dead bug", category: "core" },
  { name: "Desenvolvimento Arnold", category: "shoulders" },
  { name: "Desenvolvimento militar", category: "shoulders" },
  { name: "Desenvolvimento no Smith", category: "shoulders" },
  { name: "Desenvolvimento", category: "shoulders" },
  { name: "Desenvolvimento com halteres", category: "shoulders" },
  { name: "Desenvolvimento com mochila", category: "shoulders" },
  { name: "Elevação pélvica", category: "legs" },
  { name: "Elevação de panturrilha em pé", category: "legs" },
  { name: "Elevação de panturrilha sentada", category: "legs" },
  { name: "Elevação lateral", category: "shoulders" },
  { name: "Elíptico", category: "cardio" },
  { name: "Escada", category: "cardio" },
  { name: "Escalador (mountain climber)", category: "core" },
  { name: "Esteira", category: "cardio" },
  { name: "Face pull", category: "shoulders" },
  { name: "Flexão com pegada aberta", category: "chest" },
  { name: "Flexão de braço", category: "chest" },
  { name: "Flexão diamante", category: "chest" },
  { name: "Flexão inclinada na parede", category: "chest" },
  { name: "Kettlebell swing", category: "legs" },
  { name: "Leg press", category: "legs" },
  { name: "Levantamento terra", category: "back" },
  {
    name: "Levantamento terra romeno",
    categories: ["back", "legs"],
  },
  { name: "Mesa flexora", category: "legs" },
  { name: "Paralelas", category: "chest" },
  { name: "Passada andando", category: "legs" },
  { name: "Peck deck", category: "chest" },
  { name: "Pulldown", category: "back" },
  { name: "Pullover na máquina", category: "back" },
  { name: "Pular corda", category: "cardio" },
  { name: "Puxada neutra", category: "back" },
  { name: "Prancha", category: "core" },
  { name: "Prancha lateral", category: "core" },
  { name: "Polichinelos", category: "cardio" },
  { name: "Polichinelos cruzados", category: "cardio" },
  { name: "Puxada aberta", category: "back" },
  { name: "Puxada na frente", category: "back" },
  { name: "Remada baixa", category: "back" },
  { name: "Remada cavalinho", category: "back" },
  { name: "Remada curvada", category: "back" },
  { name: "Remada curvada com mochila", category: "back" },
  { name: "Remada articulada", category: "back" },
  { name: "Remada invertida na mesa", category: "back" },
  { name: "Remada alta", category: "shoulders" },
  { name: "Remada unilateral", category: "back" },
  { name: "Remo ergométrico", category: "cardio" },
  { name: "Rosca alternada", category: "biceps" },
  { name: "Rosca direta", category: "biceps" },
  { name: "Rosca direta com mochila", category: "biceps" },
  { name: "Rosca martelo", category: "biceps" },
  { name: "Rosca martelo com halteres", category: "biceps" },
  { name: "Roda abdominal", category: "core" },
  { name: "Russian twist", category: "core" },
  { name: "Serrote com halter", category: "back" },
  { name: "Step-up no banco", category: "legs" },
  { name: "Stiff", category: "legs" },
  { name: "Supino declinado", category: "chest" },
  { name: "Supino inclinado", category: "chest" },
  { name: "Supino inclinado com halteres", category: "chest" },
  { name: "Supino reto com halteres", category: "chest" },
  { name: "Supino reto na máquina", category: "chest" },
  { name: "Supino reto", category: "chest" },
  { name: "Tríceps banco", category: "triceps" },
  { name: "Tríceps corda", category: "triceps" },
  { name: "Tríceps testa", category: "triceps" },
  { name: "Tríceps pulley", category: "triceps" },
  { name: "Hack squat", category: "legs" },
];

export const MAIN_EXERCISE_GUIDANCE =
  "Gere somente exercícios do catálogo permitido enviado no formulário e compatíveis com o local escolhido. Use exatamente o nome do catálogo e acrescente séries/repetições se necessário. Priorize movimentos compostos e exercícios fundamentais do grupo, evite variações redundantes e não troque o grupo muscular do dia. Respeite a quantidade solicitada por grupo.";

const normalize = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const catalogByName = new Map(
  MAIN_EXERCISE_CATALOG.map((exercise) => [normalize(exercise.name), exercise]),
);
const exerciseAliases = new Map([
  ["avanco lunge", "avanco"],
  ["burpees", "burpee"],
  ["bike", "bicicleta ergonomica"],
  ["bike em intensidade moderada", "bicicleta ergonomica"],
  ["corrida no lugar", "corrida estacionaria"],
  ["escada rapida", "escada"],
  ["esteira sprints", "esteira"],
]);
const GYM_ONLY_EXERCISES = new Set([
  "Agachamento com barra",
  "Agachamento frontal",
  "Agachamento guiado",
  "Agachamento no Smith",
  "Barra fixa assistida",
  "Cadeira abdutora",
  "Cadeira extensora",
  "Cadeira flexora",
  "Caminhada inclinada na esteira",
  "Crossover",
  "Corda naval",
  "Desenvolvimento militar",
  "Desenvolvimento no Smith",
  "Elevação de panturrilha sentada",
  "Elíptico",
  "Esteira",
  "Face pull",
  "Hack squat",
  "Leg press",
  "Levantamento terra",
  "Levantamento terra romeno",
  "Mesa flexora",
  "Peck deck",
  "Pulldown",
  "Pullover na máquina",
  "Puxada aberta",
  "Puxada na frente",
  "Puxada neutra",
  "Remada articulada",
  "Remada baixa",
  "Remada cavalinho",
  "Remada alta",
  "Remo ergométrico",
  "Escada",
  "Paralelas",
  "Supino declinado",
  "Supino inclinado",
  "Supino inclinado com halteres",
  "Supino reto com halteres",
  "Supino reto na máquina",
  "Supino reto",
  "Tríceps corda",
  "Tríceps pulley",
]);

function exerciseCatalogEntry(exercise) {
  const value = typeof exercise === "object" ? exercise?.name : exercise;
  const name = getExerciseBaseName(value);
  const key = normalize(name);
  return catalogByName.get(exerciseAliases.get(key) || key) || null;
}

function getExerciseBaseName(value) {
  return String(value || "")
    .trim()
    .split(/\s+[–—-]\s+(?=\d)/)[0]
    .trim();
}

function canonicalizeExercise(exercise) {
  const value = typeof exercise === "object" ? exercise?.name : exercise;
  const raw = String(value || "").trim();
  const entry = exerciseCatalogEntry(exercise);
  if (!entry) return exercise;
  const suffixMatch = raw.match(/\s+[–—-]\s+(?=\d)/);
  const canonicalName = `${entry.name}${suffixMatch ? raw.slice(suffixMatch.index) : ""}`;
  return typeof exercise === "object"
    ? { ...exercise, name: canonicalName }
    : canonicalName;
}

function categoriesForGroup(groupName = "") {
  const group = normalize(groupName);
  const categories = new Set();
  if (/peito|peitoral/.test(group)) categories.add("chest");
  if (/costas/.test(group)) categories.add("back");
  if (/perna|gluteo|posterior/.test(group)) categories.add("legs");
  if (/ombro|trapezio/.test(group)) categories.add("shoulders");
  if (/biceps/.test(group)) categories.add("biceps");
  if (/triceps/.test(group)) categories.add("triceps");
  if (/bracos/.test(group)) {
    categories.add("biceps");
    categories.add("triceps");
  }
  if (/core|abdomen|abdominal|estabilidade/.test(group)) categories.add("core");
  if (/cardio|hiit/.test(group)) categories.add("cardio");
  if (/superiores/.test(group)) {
    categories.add("chest");
    categories.add("back");
    categories.add("shoulders");
  }
  if (categories.size) return categories;
  if (/full body|corpo completo|circuito|treino funcional/.test(group))
    return null;
  return new Set();
}

function groupAllowsExercise(groupName, exercise) {
  const entry = exerciseCatalogEntry(exercise);
  if (!entry) return false;
  const categories = categoriesForGroup(groupName);
  const exerciseCategories = entry.categories || [entry.category];
  return (
    categories === null ||
    exerciseCategories.some((category) => categories.has(category))
  );
}

function isExerciseAvailableAtLocation(exercise, location) {
  const entry = exerciseCatalogEntry(exercise);
  return Boolean(
    entry && !(location === "casa" && GYM_ONLY_EXERCISES.has(entry.name)),
  );
}

export function getMainExercisesPerGroup(form = {}) {
  const requested =
    Number(form.exerciciosPorGrupo) || MAX_MAIN_EXERCISES_PER_GROUP;
  return Math.min(MAX_MAIN_EXERCISES_PER_GROUP, Math.max(1, requested));
}

export function applyMainExercisePolicy(form = {}) {
  const catalog = MAIN_EXERCISE_CATALOG.filter((exercise) =>
    isExerciseAvailableAtLocation(exercise.name, form.local),
  );
  return {
    ...form,
    exerciciosPorGrupo: String(getMainExercisesPerGroup(form)),
    focoExercicios: "principais",
    diretrizExercicios: MAIN_EXERCISE_GUIDANCE,
    exerciciosPermitidos: catalog.map(({ name }) => name),
    catalogoExerciciosPermitidos: catalog,
  };
}

export function limitToMainExercises(groups, form = {}, expectedGroups = null) {
  if (!Array.isArray(groups)) return null;

  const limit = getMainExercisesPerGroup(form);
  const mustMatchEveryGroup = Array.isArray(expectedGroups);
  const targets = Array.isArray(expectedGroups) ? expectedGroups : groups;
  const usedGroups = new Set();
  const mainGroups = targets.map((target, index) => {
    if (!target) return null;

    const generated =
      targets === groups
        ? target
        : groups.find((candidate, candidateIndex) => {
            if (
              usedGroups.has(candidateIndex) ||
              !Array.isArray(candidate?.exercicios)
            )
              return false;
            const targetCategories = categoriesForGroup(target.grupo);
            const candidateCategories = categoriesForGroup(candidate.grupo);
            const sameCategory =
              targetCategories &&
              candidateCategories &&
              [...targetCategories].some((category) =>
                candidateCategories.has(category),
              );
            const hasExpectedExercise = candidate.exercicios.some((exercise) =>
              groupAllowsExercise(target.grupo, exercise),
            );
            return sameCategory || hasExpectedExercise;
          }) ||
          (!usedGroups.has(index) && Array.isArray(groups[index]?.exercicios)
            ? groups[index]
            : null);

    if (!generated) return null;
    const generatedIndex = groups.indexOf(generated);
    if (generatedIndex >= 0) usedGroups.add(generatedIndex);

    const exercises = generated.exercicios
      .filter(
        (exercise) =>
          groupAllowsExercise(target.grupo, exercise) &&
          isExerciseAvailableAtLocation(exercise, form.local),
      )
      .slice(0, limit)
      .map(canonicalizeExercise);
    if (!exercises.length) return null;

    return {
      ...target,
      exercicios: exercises,
    };
  });

  if (mustMatchEveryGroup && mainGroups.some((group) => !group)) return null;
  const validGroups = mainGroups.filter(Boolean);

  return validGroups.length ? validGroups : null;
}
