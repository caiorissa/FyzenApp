import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebaseConfig";
import {
  Bell,
  Dumbbell,
  Target,
  Apple,
  ArrowUpRight,
  Flame,
} from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";

export default function HomeScreen({
  friendlyName = "Atleta",
  onSelectScreen,
}) {
  const name = friendlyName;
  const passos = [
    {
      title: "Seu treino",
      description:
        "Um plano para o seu objetivo, seu nível e o lugar onde você treina.",
      icon: Dumbbell,
      screen: "plan",
      action: "Abrir treino",
    },
    {
      title: "Sua alimentação",
      description:
        "Registre as refeições e acompanhe seu consumo ao longo do dia.",
      icon: Apple,
      screen: "nutrition",
      action: "Registrar refeição",
    },
    {
      title: "Suas metas",
      description:
        "Transforme intenções em pequenas ações que cabem na sua rotina.",
      icon: Target,
      screen: "goals",
      action: "Definir metas",
    },
  ];
  const [notif, setNotif] = useState(null);

  useEffect(() => {
    const qNotif = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(1),
    );

    const unsub = onSnapshot(
      qNotif,
      (snap) => {
        if (snap.empty) {
          setNotif(null);
        } else {
          setNotif({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      },
      (error) => {
        console.error("Erro ao carregar avisos:", error);
      },
    );

    return () => unsub();
  }, []);

  const [streak, setStreak] = useState(
    Number(localStorage.getItem("fitmind-streak") || 0),
  );

  useEffect(() => {
    const atualizar = () => {
      setStreak(Number(localStorage.getItem("fitmind-streak") || 0));
    };

    window.addEventListener("streakUpdate", atualizar);
    window.addEventListener("storage", atualizar);

    return () => {
      window.removeEventListener("streakUpdate", atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Olá, ${name.split(" ")[0]}.`}
        description="Bom ter você por aqui. Reserve um momento para cuidar de você."
      />
      {notif && (
        <div className="status-message">
          <Bell size={18} className="text-fyzen-warm" />
          <div>
            <p className="font-medium text-slate-100">Aviso para você</p>
            <p className="text-fyzen-muted mt-1">{notif.message}</p>
          </div>
        </div>
      )}
      <section className="home-hero">
        <div className="relative z-10">
          <h2>O próximo passo é o de hoje.</h2>
          <p>
            Encontre seu ritmo. Seu treino, sua alimentação e suas metas estão
            aqui.
          </p>
          <button
            className="btn-primary"
            onClick={() => onSelectScreen("plan")}
          >
            <Dumbbell size={17} /> Ir para meu treino
          </button>
        </div>
        <div className="streak-stat">
          <Flame className="text-fyzen-warm mb-2" size={24} />
          <strong>{streak}</strong>
          <div>
            <span className="text-sm text-slate-100">
              {streak === 1 ? "dia seguido" : "dias seguidos"}
            </span>
            <span className="block text-xs text-fyzen-muted mt-1">
              de treino concluído
            </span>
          </div>
        </div>
        <div className="training-track" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </section>
      <section>
        <h2 className="section-heading">Cuide da sua rotina</h2>
        <div className="home-actions">
          {passos.map(({ icon: Icon, ...passo }) => (
            <button
              className="action-card"
              key={passo.screen}
              onClick={() => onSelectScreen(passo.screen)}
            >
              <Icon size={23} className="text-fyzen-accent" />
              <h3>{passo.title}</h3>
              <p>{passo.description}</p>
              <span className="action-link">
                {passo.action}
                <ArrowUpRight size={17} />
              </span>
            </button>
          ))}
        </div>
      </section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-fyzen-border pt-6">
        <p className="text-sm text-fyzen-muted">
          Cada treino conta. Veja o caminho que você já percorreu.
        </p>
        <button
          className="text-link shrink-0"
          onClick={() => onSelectScreen("progress")}
        >
          Ver meu progresso
        </button>
      </div>
    </div>
  );
}
