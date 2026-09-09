import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig.js";
import { calculateWorkoutVolume } from "./analytics.js";

function clean(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function syncWorkoutSession(uid, session) {
  if (!db || !uid || !session?.id) return;
  const payload = clean({
    ...session,
    schemaVersion: 2,
    userId: uid,
    totalVolume: calculateWorkoutVolume(session.exercises),
    syncStatus: "synced",
    updatedAt: serverTimestamp(),
  });
  await setDoc(
    doc(db, "workoutSessions", uid, "sessions", session.id),
    payload,
    { merge: true },
  );
}

export async function writeLegacySessionSummary(uid, session) {
  if (!db || !uid || !session?.id) return;
  const ref = doc(
    collection(db, "historicoTreino", uid, "registros"),
    session.id,
  );
  const completedExercises = (session.exercises || []).filter((exercise) =>
    exercise.sets?.some((set) => set.completed),
  );
  await setDoc(
    ref,
    clean({
      timestamp: serverTimestamp(),
      sessionId: session.id,
      schemaVersion: 2,
      dia: session.day || "sessão",
      grupo: session.name || "Treino",
      exercicios: completedExercises.map((exercise) => exercise.name),
      totalExercicios: completedExercises.length,
      totalSets: session.totalSets || 0,
      totalVolume: calculateWorkoutVolume(session.exercises),
      duration:
        session.completedAt && session.startedAt
          ? Math.round((session.completedAt - session.startedAt) / 60000)
          : null,
      feedback: session.feedback || null,
    }),
    { merge: true },
  );
}
