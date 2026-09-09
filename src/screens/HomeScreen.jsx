import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import {
  ArrowRight,
  BrainCircuit,
  Dumbbell,
  Flame,
  Moon,
  Play,
  Sparkles,
} from "lucide-react";
import { db } from "../lib/firebaseConfig.js";
import { loadActiveSession } from "../lib/workout/sessionStorage.js";

const DAYS = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];
const firstName = (name) => name.split(" ")[0] || "Atleta";

export default function HomeScreen({
  friendlyName = "Atleta",
  user,
  onSelectScreen,
  onStartWorkout,
}) {
  const [plan, setPlan] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [active, setActive] = useState(() => loadActiveSession(user?.uid));
  useEffect(() => {
    if (!user?.uid || !db) return;
    Promise.all([
      getDoc(doc(db, "planos", user.uid)),
      getDocs(collection(db, "workoutSessions", user.uid, "sessions")),
    ])
      .then(([planSnap, sessionSnap]) => {
        setPlan(planSnap.data()?.plan || null);
        setSessions(
          sessionSnap.docs
            .map((item) => item.data())
            .filter((item) => item.status === "completed"),
        );
        setActive(loadActiveSession(user.uid));
      })
      .catch(() => {});
  }, [user?.uid]);
  const today = DAYS[new Date().getDay()];
  const workout = useMemo(() => {
    const workouts = plan?.treinos || [];
    const index = Math.min(
      Math.max(DAYS.indexOf(today) - 1, 0),
      Math.max(workouts.length - 1, 0),
    );
    return workouts[index] || workouts[0];
  }, [plan, today]);
  const week = sessions.filter(
    (session) => (session.completedAt || 0) >= Date.now() - 7 * 86400000,
  ).length;
  const planned = Math.max(1, plan?.treinos?.length || 0);
  const streak = Number(localStorage.getItem("fitmind-streak") || 0);
  return (
    <div className="home-v2">
      <header className="home-greeting">
        <p>Pronto para o treino de hoje?</p>
        <h1>Olá, {firstName(friendlyName)}.</h1>
      </header>
      <section className="today-card">
        <div className="today-card-top">
          <span>Treino de hoje</span>
          <Dumbbell size={21} />
        </div>
        {workout ? (
          <>
            <h2>{active?.name || workout.grupo}</h2>
            <p>
              {active
                ? `${active.totalSets || 0} séries concluídas`
                : `${workout.exercicios?.length || 0} exercícios · plano atual`}
            </p>
          </>
        ) : (
          <>
            <h2>Seu plano começa aqui</h2>
            <p>
              Conte um pouco sobre sua rotina para montar o primeiro treino.
            </p>
          </>
        )}
        <button
          className="btn-primary"
          type="button"
          onClick={() =>
            workout || active
              ? onStartWorkout?.(workout, today)
              : onSelectScreen("plan")
          }
        >
          {active ? <Play size={18} /> : <Dumbbell size={18} />}{" "}
          {active
            ? "Continuar treino"
            : workout
              ? "Iniciar treino"
              : "Criar meu plano"}
        </button>
      </section>
      <section className="week-card">
        <div>
          <p>Esta semana</p>
          <strong>
            {week} <span>/ {planned} treinos</span>
          </strong>
        </div>
        <div
          className="week-dots"
          aria-label={`${week} de ${planned} treinos concluídos`}
        >
          {Array.from({ length: Math.min(7, planned) }, (_, index) => (
            <i key={index} className={index < week ? "done" : ""} />
          ))}
        </div>
        <div className="streak-chip">
          <Flame size={16} />
          <span>{streak} dias</span>
        </div>
      </section>
      <section className="home-ai-card">
        <Sparkles size={19} />
        <div>
          <p>Fyzen AI</p>
          <strong>
            {sessions.length
              ? "Seu histórico está sendo usado para orientar as próximas sessões."
              : "Registre sua primeira sessão para receber análises do seu progresso."}
          </strong>
        </div>
        <button
          type="button"
          onClick={() => onSelectScreen("coach")}
          aria-label="Abrir análise Fyzen"
        >
          <ArrowRight size={18} />
        </button>
      </section>
      <section className="home-recovery">
        <div>
          <div className="recovery-icon">
            <Moon size={18} />
          </div>
          <div>
            <p>Recuperação</p>
            <strong>Ainda sem check-in</strong>
            <span>Registre sono e energia para orientar seu treino.</span>
          </div>
        </div>
        <button type="button" onClick={() => onSelectScreen("goals")}>
          Registrar
        </button>
      </section>
      <section className="home-progress-link">
        <BrainCircuit size={18} />
        <div>
          <strong>Seu progresso, sem adivinhações.</strong>
          <p>
            Volume, séries e histórico aparecem quando você concluir as sessões.
          </p>
        </div>
        <button type="button" onClick={() => onSelectScreen("progress")}>
          Ver progresso
        </button>
      </section>
    </div>
  );
}
