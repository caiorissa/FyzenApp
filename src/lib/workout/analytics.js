const MAX_E1RM_REPS = 12;

export function calculateSetVolume(set) {
  const weight = Number(set?.weight);
  const reps = Number(set?.reps);
  return Number.isFinite(weight) &&
    Number.isFinite(reps) &&
    weight > 0 &&
    reps > 0
    ? weight * reps
    : 0;
}

export function calculateWorkoutVolume(exercises = []) {
  return exercises.reduce(
    (total, exercise) =>
      total +
      (exercise.sets || []).reduce(
        (sum, set) => sum + calculateSetVolume(set),
        0,
      ),
    0,
  );
}

// Epley. It is deliberately omitted for high-rep sets, where the estimate is noisy.
export function calculateEstimated1RM(weight, reps) {
  const load = Number(weight);
  const count = Number(reps);
  if (
    !Number.isFinite(load) ||
    !Number.isFinite(count) ||
    load <= 0 ||
    count < 1 ||
    count > MAX_E1RM_REPS
  )
    return null;
  return Math.round(load * (1 + count / 30) * 10) / 10;
}

export function detectPRs(session, previousSessions = []) {
  const records = new Map();
  previousSessions.forEach((previous) => {
    (previous.exercises || []).forEach((exercise) => {
      const current = records.get(exercise.exerciseId) || {
        weight: 0,
        volume: 0,
        e1rm: 0,
      };
      (exercise.sets || [])
        .filter((set) => set.completed)
        .forEach((set) => {
          current.weight = Math.max(current.weight, Number(set.weight) || 0);
          current.volume = Math.max(current.volume, calculateSetVolume(set));
          current.e1rm = Math.max(
            current.e1rm,
            calculateEstimated1RM(set.weight, set.reps) || 0,
          );
        });
      records.set(exercise.exerciseId, current);
    });
  });

  const prs = [];
  (session?.exercises || []).forEach((exercise) => {
    const before = records.get(exercise.exerciseId) || {
      weight: 0,
      volume: 0,
      e1rm: 0,
    };
    (exercise.sets || [])
      .filter((set) => set.completed)
      .forEach((set) => {
        const weight = Number(set.weight) || 0;
        const volume = calculateSetVolume(set);
        const e1rm = calculateEstimated1RM(weight, set.reps) || 0;
        if (weight > before.weight)
          prs.push({ type: "weight", exercise, set, value: weight });
        if (volume > before.volume && volume > 0)
          prs.push({ type: "setVolume", exercise, set, value: volume });
        if (e1rm > before.e1rm)
          prs.push({ type: "e1rm", exercise, set, value: e1rm });
      });
  });
  return prs;
}

export function calculateConsistency(completed = 0, planned = 0) {
  if (!Number.isFinite(planned) || planned <= 0) return null;
  return Math.min(100, Math.round((Math.max(0, completed) / planned) * 100));
}

export function getProgressionSuggestion(
  exercise,
  sessions = [],
  increment = 2.5,
) {
  const history = sessions
    .flatMap((session) => session.exercises || [])
    .filter((item) => item.exerciseId === exercise.exerciseId)
    .slice(-2);
  if (history.length < 2) return null;
  const [min, max] = String(exercise.prescribedReps || "8-10")
    .match(/\d+/g)
    ?.map(Number) || [8, 10];
  const qualifies = history.every((item) => {
    const completed = (item.sets || []).filter((set) => set.completed);
    return (
      completed.length >= (exercise.prescribedSets || 1) &&
      completed.every((set) => Number(set.reps) >= max)
    );
  });
  if (!qualifies) return null;
  const current = Math.max(
    ...history
      .flatMap((item) => item.sets || [])
      .map((set) => Number(set.weight) || 0),
  );
  if (!current) return null;
  return {
    exerciseId: exercise.exerciseId,
    from: current,
    to: Math.round((current + increment) * 100) / 100,
    reason: `Você atingiu ${max} repetições ou mais em duas sessões seguidas.`,
    repRange: `${min}-${max}`,
  };
}

export function formatVolume(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("pt-BR")} kg`;
}
