import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebaseConfig.js";
import { useWorkoutSession } from "../lib/hooks/useWorkoutSession.js";
import { detectPRs } from "../lib/workout/analytics.js";
import RestTimer from "../components/workout/RestTimer.jsx";
import SetRow from "../components/workout/SetRow.jsx";
import WorkoutSummary from "../components/workout/WorkoutSummary.jsx";

function useWakeLock(enabled) {
  const lock = useRef(null);
  useEffect(() => {
    if (!enabled || !navigator.wakeLock?.request) return undefined;
    let stopped = false;
    const acquire = async () => {
      try {
        if (!stopped) lock.current = await navigator.wakeLock.request("screen");
      } catch {
        // Wake Lock is optional and commonly unavailable in embedded browsers.
      }
    };
    acquire();
    const visible = () => {
      if (document.visibilityState === "visible" && !lock.current) acquire();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", visible);
      lock.current?.release?.();
      lock.current = null;
    };
  }, [enabled]);
}

export default function WorkoutSessionScreen({
  user,
  workout,
  day,
  onExit,
  onComplete,
}) {
  const engine = useWorkoutSession({ uid: user?.uid, workout, day });
  const [started, setStarted] = useState(Boolean(engine.activeSession));
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(null);
  const [history, setHistory] = useState([]);
  useWakeLock(started);

  useEffect(() => {
    if (!user?.uid || !db) return;
    getDocs(collection(db, "workoutSessions", user.uid, "sessions"))
      .then((snap) =>
        setHistory(
          snap.docs
            .map((item) => item.data())
            .filter((item) => item.status === "completed"),
        ),
      )
      .catch(() => setHistory([]));
  }, [user?.uid]);

  const session = engine.activeSession;
  const exercise = session?.exercises?.[session.currentExerciseIndex];
  const previous = history
    .flatMap((item) => item.exercises || [])
    .find((item) => item.exerciseId === exercise?.exerciseId);
  const nextExercise = (offset) =>
    engine.update(
      (current) => ({
        ...current,
        currentExerciseIndex: Math.max(
          0,
          Math.min(
            current.exercises.length - 1,
            current.currentExerciseIndex + offset,
          ),
        ),
        restEndsAt: null,
      }),
      true,
    );
  const finish = async () => {
    const done = await engine.finish(feedback);
    setComplete({ session: done, prs: detectPRs(done, history) });
  };

  if (complete?.session)
    return (
      <WorkoutSummary
        session={complete.session}
        prs={complete.prs}
        onClose={onComplete}
      />
    );
  if (!started)
    return (
      <div className="workout-entry">
        <button
          type="button"
          className="icon-button"
          onClick={onExit}
          aria-label="Voltar"
        >
          <ArrowLeft />
        </button>
        <div>
          <p>Treino de hoje</p>
          <h1>{workout?.grupo || "Seu treino"}</h1>
          <span>{workout?.exercicios?.length || 0} exercícios</span>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            engine.start();
            setStarted(true);
          }}
        >
          Iniciar treino
        </button>
      </div>
    );
  if (!exercise) return null;
  const completedSets = session.exercises.reduce(
    (count, item) => count + item.sets.filter((set) => set.completed).length,
    0,
  );
  const totalSets = session.exercises.reduce(
    (count, item) => count + item.sets.length,
    0,
  );
  const activeSetIndex = Math.max(
    0,
    exercise.sets.findIndex((set) => !set.completed),
  );
  const activeSet = exercise.sets[activeSetIndex];
  const allSetsCompleted = completedSets === totalSets;
  const adjustWeight = (delta) => {
    const current =
      Number(String(activeSet?.weight || "").replace(",", ".")) || 0;
    engine.updateSet(session.currentExerciseIndex, activeSetIndex, {
      weight: String(Math.max(0, current + delta)),
    });
  };
  const completeActiveSet = () => {
    engine.completeSet(session.currentExerciseIndex, activeSetIndex);
    if (
      activeSetIndex === exercise.sets.length - 1 &&
      session.currentExerciseIndex < session.exercises.length - 1
    ) {
      engine.update(
        (current) => ({
          ...current,
          currentExerciseIndex: current.currentExerciseIndex + 1,
        }),
        true,
      );
    }
  };
  return (
    <main className="workout-mode" aria-label="Modo treino">
      <header className="workout-topbar">
        <button
          type="button"
          className="icon-button"
          onClick={onExit}
          aria-label="Sair do treino"
        >
          <ArrowLeft />
        </button>
        <div>
          <strong>{session.name}</strong>
          <span>
            {Math.round((Date.now() - session.startedAt) / 60000)} min
          </span>
        </div>
        <button type="button" className="icon-button" aria-label="Mais opções">
          <MoreHorizontal />
        </button>
      </header>
      <div className="workout-progress">
        <span>
          {completedSets} de {totalSets} séries
        </span>
        <div>
          <i
            style={{
              width: `${totalSets ? (completedSets / totalSets) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
      <section className="exercise-session-card">
        <div className="exercise-nav">
          <button
            type="button"
            className="icon-button"
            onClick={() => nextExercise(-1)}
            disabled={!session.currentExerciseIndex}
            aria-label="Exercício anterior"
          >
            <ChevronLeft />
          </button>
          <div>
            <p className="exercise-eyebrow">Exercício atual</p>
            <h1>{exercise.name}</h1>
            <span>{exercise.muscleGroup}</span>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => nextExercise(1)}
            disabled={
              session.currentExerciseIndex === session.exercises.length - 1
            }
            aria-label="Próximo exercício"
          >
            <ChevronRight />
          </button>
        </div>
        <div
          className="exercise-prescription"
          aria-label="Prescrição do exercício"
        >
          <div>
            <strong>{exercise.prescribedSets}</strong>
            <span>séries</span>
          </div>
          <div>
            <strong>{exercise.prescribedReps}</strong>
            <span>reps</span>
          </div>
          <div>
            <strong>{exercise.prescribedRestSeconds}s</strong>
            <span>descanso</span>
          </div>
        </div>
        {previous && (
          <p className="previous-performance">
            Último treino:{" "}
            {(previous.sets || [])
              .filter((set) => set.completed)
              .map((set) => `${set.weight} kg × ${set.reps}`)
              .join(" · ")}
          </p>
        )}
        <div className="sets-panel">
          <div className="set-table-head">
            <span>Série</span>
            <span>Peso</span>
            <span>Reps</span>
            <span className="sr-only">Status</span>
          </div>
          {exercise.sets.map((set, index) => (
            <SetRow
              key={set.setNumber}
              set={set}
              active={index === activeSetIndex}
              onChange={(changes) =>
                engine.updateSet(session.currentExerciseIndex, index, changes)
              }
            />
          ))}
        </div>
      </section>
      <RestTimer
        endsAt={session.restEndsAt}
        onAdjust={(seconds) =>
          engine.update(
            (current) => ({
              ...current,
              restEndsAt: Math.max(
                Date.now(),
                (current.restEndsAt || Date.now()) + seconds * 1000,
              ),
            }),
            true,
          )
        }
        onSkip={() =>
          engine.update((current) => ({ ...current, restEndsAt: null }), true)
        }
      />
      {!allSetsCompleted ? (
        <section
          className="set-action-dock"
          aria-label={`Registrar série ${activeSet.setNumber}`}
        >
          <div className="weight-quick" aria-label="Ajustes rápidos de carga">
            {[-5, -2.5, 2.5, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => adjustWeight(value)}
              >
                {value > 0 ? "+" : ""}
                {String(value).replace(".", ",")}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="set-complete"
            disabled={!activeSet.reps}
            onClick={completeActiveSet}
            aria-label={`Concluir série ${activeSet.setNumber}`}
          >
            Concluir série <span>{activeSet.setNumber}</span>
          </button>
        </section>
      ) : (
        <section className="workout-finish">
          <p>Como foi a sessão?</p>
          <div>
            {["Muito fácil", "Fácil", "Ideal", "Difícil", "Muito difícil"].map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  className={feedback === option ? "is-selected" : ""}
                  onClick={() => setFeedback(option)}
                >
                  {option}
                </button>
              ),
            )}
          </div>
          <button type="button" className="btn-primary w-full" onClick={finish}>
            Finalizar treino
          </button>
        </section>
      )}
    </main>
  );
}
