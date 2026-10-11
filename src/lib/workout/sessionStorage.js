const PREFIX = "fyzen:workout-session:";

function key(uid) {
  return `${PREFIX}${uid}`;
}

export function saveActiveSession(uid, session) {
  if (!uid || !session || typeof window === "undefined") return;
  try {
    localStorage.setItem(
      key(uid),
      JSON.stringify({ version: 2, savedAt: Date.now(), session }),
    );
    return true;
  } catch {
    return false;
  }
}

export function loadActiveSession(uid) {
  if (!uid || typeof window === "undefined") return null;
  try {
    const session =
      JSON.parse(localStorage.getItem(key(uid)) || "null")?.session || null;
    if (
      session?.status !== "active" ||
      !Array.isArray(session.exercises) ||
      session.exercises.length === 0
    )
      return null;

    const exercises = session.exercises.map((exercise) => ({
      ...exercise,
      sets: Array.isArray(exercise?.sets) ? exercise.sets : [],
    }));
    if (exercises.some((exercise) => !exercise.name || exercise.sets.length === 0))
      return null;
    const lastExerciseIndex = exercises.length - 1;
    const savedIndex = Number(session.currentExerciseIndex) || 0;
    return {
      ...session,
      exercises,
      currentExerciseIndex: Math.max(
        0,
        Math.min(lastExerciseIndex, savedIndex),
      ),
      restEndsAt: Number.isFinite(Number(session.restEndsAt))
        ? Number(session.restEndsAt)
        : null,
    };
  } catch {
    return null;
  }
}

export function clearActiveSession(uid) {
  if (!uid || typeof window === "undefined") return;
  try {
    localStorage.removeItem(key(uid));
  } catch {
    // Local persistence may be disabled by the browser.
  }
}
