import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateWorkoutVolume } from "../workout/analytics.js";
import { createSessionExercises } from "../workout/adapters.js";
import {
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from "../workout/sessionStorage.js";
import {
  syncWorkoutSession,
  writeLegacySessionSummary,
} from "../workout/workoutSessionService.js";

const newId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `workout-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function useWorkoutSession({ uid, workout, day }) {
  const [session, setSession] = useState(() => loadActiveSession(uid));
  const saveTimer = useRef(null);
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const persist = useCallback(
    (next, immediate = false) => {
      if (!uid || !next) return;
      saveActiveSession(uid, next);
      clearTimeout(saveTimer.current);
      const sync = () => syncWorkoutSession(uid, next).catch(() => {});
      if (immediate) sync();
      else saveTimer.current = setTimeout(sync, 650);
    },
    [uid],
  );

  useEffect(() => () => clearTimeout(saveTimer.current), []);
  useEffect(() => {
    const backup = () => {
      if (sessionRef.current?.status === "active")
        persist(sessionRef.current, true);
    };
    window.addEventListener("pagehide", backup);
    return () => window.removeEventListener("pagehide", backup);
  }, [persist]);

  const start = useCallback(() => {
    const existing = loadActiveSession(uid);
    if (existing?.status === "active") {
      setSession(existing);
      return existing;
    }
    const next = {
      id: newId(),
      schemaVersion: 2,
      status: "active",
      name: workout?.grupo || workout?.group || "Treino",
      workoutId: workout?._globalIndex ?? workout?.id ?? null,
      day,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      exercises: createSessionExercises(workout),
      restEndsAt: null,
      currentExerciseIndex: 0,
      totalSets: 0,
    };
    setSession(next);
    persist(next, true);
    return next;
  }, [uid, workout, day, persist]);

  const update = useCallback(
    (recipe, immediate = false) => {
      setSession((current) => {
        if (!current) return current;
        const next = typeof recipe === "function" ? recipe(current) : recipe;
        next.updatedAt = Date.now();
        persist(next, immediate);
        return next;
      });
    },
    [persist],
  );

  const updateSet = useCallback(
    (exerciseIndex, setIndex, changes) =>
      update((current) => ({
        ...current,
        exercises: current.exercises.map((exercise, eIndex) =>
          eIndex !== exerciseIndex
            ? exercise
            : {
                ...exercise,
                sets: exercise.sets.map((set, index) =>
                  index !== setIndex ? set : { ...set, ...changes },
                ),
              },
        ),
      })),
    [update],
  );

  const completeSet = useCallback(
    (exerciseIndex, setIndex) => {
      update((current) => {
        const exercise = current.exercises[exerciseIndex];
        const rest = Number(exercise?.prescribedRestSeconds) || 0;
        return {
          ...current,
          restEndsAt: rest ? Date.now() + rest * 1000 : null,
          totalSets:
            (current.totalSets || 0) +
            (exercise?.sets?.[setIndex]?.completed ? 0 : 1),
          exercises: current.exercises.map((item, eIndex) =>
            eIndex !== exerciseIndex
              ? item
              : {
                  ...item,
                  sets: item.sets.map((set, index) =>
                    index !== setIndex
                      ? set
                      : { ...set, completed: true, completedAt: Date.now() },
                  ),
                },
          ),
        };
      }, true);
    },
    [update],
  );

  const finish = useCallback(
    async (feedback) => {
      const current = sessionRef.current;
      if (!current) return null;
      const completed = {
        ...current,
        status: "completed",
        completedAt: Date.now(),
        feedback: feedback || null,
        restEndsAt: null,
      };
      completed.totalVolume = calculateWorkoutVolume(completed.exercises);
      setSession(completed);
      clearActiveSession(uid);
      await Promise.allSettled([
        syncWorkoutSession(uid, completed),
        writeLegacySessionSummary(uid, completed),
      ]);
      return completed;
    },
    [uid],
  );

  const discard = useCallback(() => {
    clearActiveSession(uid);
    setSession(null);
  }, [uid]);
  const activeSession = session?.status === "active" ? session : null;
  return useMemo(
    () => ({
      session,
      activeSession,
      start,
      updateSet,
      completeSet,
      update,
      finish,
      discard,
    }),
    [
      session,
      activeSession,
      start,
      updateSet,
      completeSet,
      update,
      finish,
      discard,
    ],
  );
}
