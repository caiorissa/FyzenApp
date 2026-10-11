import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { db } from "../lib/firebaseConfig.js";
import { getCoachHeadline } from "../lib/workout/coachInsights.js";
import { askFyzenAI } from "../lib/coachChatService.js";

const prompts = [
  "Como está meu progresso?",
  "Devo aumentar o peso?",
  "Meu treino está muito fácil.",
  "Por que faço esse exercício?",
];

export default function CoachScreen({ user }) {
  const [sessions, setSessions] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
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
  const headline = useMemo(() => getCoachHeadline(sessions), [sessions]);
  const send = async (text = message) => {
    const value = text.trim();
    if (!value || isSending) return;
    const previousMessages = messages;
    setMessages((items) => [...items, { role: "user", text: value }]);
    setMessage("");
    setIsSending(true);
    try {
      const reply = await askFyzenAI({
        message: value,
        history: previousMessages,
        user,
      });
      setMessages((items) => [...items, { role: "coach", text: reply }]);
    } catch (error) {
      setMessages((items) => [
        ...items,
        {
          role: "coach",
          text:
            error.message ||
            "Não consegui falar com a IA agora. Tente novamente.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
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
        <div
          className="chat-messages"
          aria-live="polite"
          aria-relevant="additions"
        >
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
          {isSending && (
            <p className="chat-message coach" role="status">
              Fyzen está pensando…
            </p>
          )}
        </div>
        <div className="prompt-row">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => send(prompt)}
              disabled={isSending}
            >
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
            maxLength={1200}
            disabled={isSending}
          />
          <button
            className="btn-primary"
            type="submit"
            aria-label="Enviar mensagem"
            disabled={isSending || !message.trim()}
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
