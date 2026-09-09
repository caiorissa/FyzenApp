import { getAlternatives } from "../premium/exerciseAlternatives.js";

const MUSCLES = {
  supino: "Peitoral",
  crucifixo: "Peitoral",
  crossover: "Peitoral",
  flexão: "Peitoral",
  puxada: "Costas",
  remada: "Costas",
  agachamento: "Pernas",
  leg: "Pernas",
  cadeira: "Pernas",
  stiff: "Posterior",
  rosca: "Bíceps",
  tríceps: "Tríceps",
  desenvolvimento: "Ombros",
  elevação: "Ombros",
  prancha: "Core",
  abdominal: "Core",
};

export function normalizeExerciseName(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getMuscleGroup(name, fallback = "Treino") {
  const normalized = normalizeExerciseName(name);
  const key = Object.keys(MUSCLES).find((candidate) =>
    normalized.includes(candidate),
  );
  return key ? MUSCLES[key] : fallback;
}

export function parseLegacyExercise(raw, group = "Treino") {
  if (typeof raw === "object" && raw?.name) return raw;
  const source = String(raw || "Exercício").trim();
  const [namePart] = source.split(/[–—-]\s*(?=\d)/);
  const name = namePart.trim();
  const match = source.match(
    /(\d+)\s*x\s*([\d]+(?:\s*[-–]\s*[\d]+)?|\d+s|\d+min)/i,
  );
  const sets = Number(match?.[1]) || 3;
  const reps = match?.[2]?.replace(/\s/g, "") || "8-10";
  return {
    exerciseId: normalizeExerciseName(name),
    name,
    muscleGroup: getMuscleGroup(name, group),
    equipment: "Não informado",
    prescribedSets: Math.min(sets, 12),
    prescribedReps: reps,
    prescribedRestSeconds: /s$|min$/i.test(reps) ? 60 : 120,
    alternatives: getAlternatives(name),
  };
}

export function createSessionExercises(workout = {}) {
  return (workout.exercicios || workout.exercises || []).map((exercise) => {
    const base = parseLegacyExercise(exercise, workout.grupo || workout.group);
    return {
      ...base,
      sets: Array.from({ length: base.prescribedSets }, (_, index) => ({
        setNumber: index + 1,
        weight: "",
        reps: "",
        completed: false,
      })),
    };
  });
}
