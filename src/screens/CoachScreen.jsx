import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { db } from "../lib/firebaseConfig.js";
import {
  calculateWorkoutVolume,
  getProgressionSuggestion,
} from "../lib/workout/analytics.js";

const prompts = [
  "Como está meu progresso?",
  "Devo aumentar o peso?",
  "Meu treino está muito fácil.",
  "Por que faço esse exercício?",
];

function insightFor(question, sessions) {
  const recent = sessions.slice(-3);
  if (!recent.length)
    return "Conclua seu primeiro treino no Modo Treino. A partir dele, o Fyzen passa a considerar séries, carga e repetições nas análises.";
  const volume = recent.reduce(
    (total, session) => total + calculateWorkoutVolume(session.exercises),
    0,
  );
  const exercise = recent.at(-1)?.exercises?.[0];
  const suggestion = exercise && getProgressionSuggestion(exercise, sessions);
  if (/aumentar|fácil/i.test(question) && suggestion)
    return `Nos seus dois últimos registros de ${exercise.name}, você chegou ao topo da faixa de repetições. Uma progressão pequena de ${suggestion.from} kg para ${suggestion.to} kg é razoável no próximo treino.`;
  if (/por que/i.test(question) && exercise)
    return `${exercise.name} está no seu plano para desenvolver ${exercise.muscleGroup.toLowerCase()}. O Fyzen mostrará a relação com seu objetivo quando houver mais sessões para comparar.`;
  return `Nas últimas ${recent.length} sessões, você registrou ${Math.round(volume).toLocaleString("pt-BR")} kg de volume. Esta leitura compara apenas o seu próprio histórico; ela fica mais precisa à medida que você conclui novos treinos.`;
}

export default function CoachScreen({ user }) {
  const [sessions, setSessions] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    if (!user?.uid || !db) return;
    getDocs(collection(db, "workoutSessions", user.uid, "sessions"))
      .then((snap) =>
        setSessions(
          snap.docs
            .map((item) => item.data())
            .filter((item) => item.status === "completed")
            .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0)),
        ),
      )
      .catch(() => setSessions([]));
  }, [user?.uid]);
  const headline = useMemo(() => insightFor("progresso", sessions), [sessions]);
  const send = (text = message) => {
    const value = text.trim();
    if (!value) return;
    setMessages((items) => [
      ...items,
      { role: "user", text: value },
      { role: "coach", text: insightFor(value, sessions) },
    ]);
    setMessage("");
  };
  return (
    <div className="coach-screen">
      <PageHeader
        title="Fyzen AI"
        description="Leituras claras do seu treino, baseadas nos registros que você decidiu salvar."
      />
      <section className="coach-insight">
        <Sparkles size={19} />
        <div>
          <strong>Análise Fyzen</strong>
          <p>{headline}</p>
        </div>
      </section>
      <section className="coach-chat" aria-label="Conversa com Fyzen AI">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <MessageCircle size={26} />
              <p>Pergunte sobre seu plano, esforço, evolução ou exercícios.</p>
            </div>
          )}
          {messages.map((item, index) => (
            <p key={index} className={`chat-message ${item.role}`}>
              {item.text}
            </p>
          ))}
        </div>
        <div className="prompt-row">
          {prompts.map((prompt) => (
            <button key={prompt} type="button" onClick={() => send(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <label className="sr-only" htmlFor="coach-message">
            Pergunte ao Fyzen AI
          </label>
          <input
            id="coach-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Pergunte ao Fyzen AI"
          />
          <button
            className="btn-primary"
            type="submit"
            aria-label="Enviar mensagem"
          >
            <Send size={18} />
          </button>
        </form>
      </section>
      <p className="coach-safety">
        Fyzen AI interpreta registros de treino; não substitui orientação
        médica, fisioterapêutica ou nutricional.
      </p>
    </div>
  );
}
