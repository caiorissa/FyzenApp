import PageHeader from "../components/PageHeader.jsx";
import { LoadingState, ErrorState } from "../components/ScreenState.jsx";
import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  TrendingUp,
  Activity,
  Flame,
} from "lucide-react";
import {
  calculateWorkoutVolume,
  formatVolume,
} from "../lib/workout/analytics.js";

import { db } from "../lib/firebaseConfig";
import { subscribeAuth } from "../lib/subscribeAuth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

const fadeIn = {
  initial: false,
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" },
};

const DIAS = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

export default function ProgressScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [treinos, setTreinos] = useState([]);
  const [porDia, setPorDia] = useState({});
  const [porSemana, setPorSemana] = useState([]);
  const [diasAtivos, setDiasAtivos] = useState(0);
  const [totalMes, setTotalMes] = useState(0);
  const [sessionsV2, setSessionsV2] = useState([]);

  const processar = useCallback((lista) => {
    if (!lista || lista.length === 0) {
      setPorDia({});
      setPorSemana([]);
      setDiasAtivos(0);
      setTotalMes(0);
      return;
    }

    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    inicioMes.setHours(0, 0, 0, 0);

    const mapaPorDia = {
      domingo: 0,
      segunda: 0,
      terça: 0,
      quarta: 0,
      quinta: 0,
      sexta: 0,
      sábado: 0,
    };

    const diasAtivosSet = new Set();
    let totalMesCalc = 0;

    lista.forEach((t) => {
      const ts = t.timestamp;
      if (!ts) return;
      const data = ts?.toDate?.() ? ts.toDate() : new Date(ts);

      const diaNome = DIAS[data.getDay()];
      mapaPorDia[diaNome] = (mapaPorDia[diaNome] || 0) + 1;

      diasAtivosSet.add(data.toDateString());

      if (data >= inicioMes && data <= hoje) {
        totalMesCalc++;
      }
    });

    setPorDia(mapaPorDia);
    setDiasAtivos(diasAtivosSet.size);
    setTotalMes(totalMesCalc);

    const semanal = DIAS.map((d) => ({
      dia: d,
      total: mapaPorDia[d] || 0,
    }));
    setPorSemana(semanal);
  }, []);

  const carregarTreinos = useCallback(
    async (uid) => {
      setError("");
      try {
        const ref = collection(db, "historicoTreino", uid, "registros");
        const q = query(ref, orderBy("timestamp", "asc"));
        const snap = await getDocs(q);
        const lista = snap.docs.map((d) => d.data());
        let modern = [];
        try {
          const modernSnap = await getDocs(
            collection(db, "workoutSessions", uid, "sessions"),
          );
          modern = modernSnap.docs
            .map((item) => item.data())
            .filter((item) => item.status === "completed");
        } catch {
          // Legacy history remains a complete fallback for existing accounts.
        }
        setTreinos(lista);
        setSessionsV2(modern);
        processar(lista);
      } catch (err) {
        console.error("Erro ao carregar progresso:", err);
        setError("Não foi possível carregar seu histórico. Tente novamente.");
      }
    },
    [processar],
  );

  useEffect(() => {
    const unsub = subscribeAuth(async (u) => {
      if (!u) {
        setUser(null);
        setTreinos([]);
        setLoading(false);
        return;
      }
      setUser(u);
      setLoading(true);
      await carregarTreinos(u.uid);
      setLoading(false);
    });

    return () => unsub();
  }, [carregarTreinos]);

  const mediaSemanal = porSemana.length
    ? (
        porSemana.reduce((acc, d) => acc + d.total, 0) / porSemana.length
      ).toFixed(1)
    : 0;
  const volumeTotal = sessionsV2.reduce(
    (total, session) => total + calculateWorkoutVolume(session.exercises),
    0,
  );
  const totalSets = sessionsV2.reduce(
    (total, session) => total + (session.totalSets || 0),
    0,
  );

  if (loading) {
    return <LoadingState label="Carregando seu progresso…" />;
  }

  if (!user) {
    return (
      <p className="text-slate-400 text-sm">
        Faça login para acompanhar seu progresso.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cada treino conta"
        description="Acompanhe sua atividade e reconheça a evolução na sua rotina."
      />
      {error && (
        <ErrorState message={error} onRetry={() => carregarTreinos(user.uid)} />
      )}
      {!error && treinos.length === 0 && (
        <div className="empty-state">
          <p className="text-slate-100 font-medium mb-1">
            Sua história está começando.
          </p>
          <p>
            Conclua um grupo de exercícios no treino para ver sua atividade
            aqui.
          </p>
        </div>
      )}
      <motion.div {...fadeIn} className="grid md:grid-cols-3 gap-4">
        <Card
          icon={CheckCircle}
          label="Dias ativos"
          value={diasAtivos}
          helper="Dias com pelo menos um treino"
          color="text-fyzen-accent"
        />

        <Card
          icon={Flame}
          label="Treinos este mês"
          value={totalMes}
          helper="Total confirmado no mês atual"
          color="text-amber-300"
        />

        <Card
          icon={Activity}
          label="Média por dia da semana"
          value={mediaSemanal}
          helper="Distribuição de todo o histórico"
          color="text-fyzen-accent"
        />
      </motion.div>

      {sessionsV2.length > 0 && (
        <motion.section {...fadeIn} className="progress-v2-grid">
          <div className="progress-feature-card">
            <span>Volume registrado</span>
            <strong>{formatVolume(volumeTotal)}</strong>
            <p>Soma de carga × repetições nas sessões detalhadas.</p>
          </div>
          <div className="progress-feature-card">
            <span>Séries concluídas</span>
            <strong>{totalSets}</strong>
            <p>Dados do Modo Treino, salvos série a série.</p>
          </div>
          <div className="progress-feature-card">
            <span>Consistência</span>
            <strong>
              {Math.round(
                (sessionsV2.filter(
                  (session) =>
                    (session.completedAt || 0) > Date.now() - 28 * 86400000,
                ).length /
                  4) *
                  100,
              )}
              %
            </strong>
            <p>
              Indicador orientativo: sessões por semana nos últimos 28 dias.
            </p>
          </div>
        </motion.section>
      )}

      <motion.div
        {...fadeIn}
        className="glass-card rounded-3xl p-5 border border-white/5 space-y-3"
      >
        <p className="text-sm text-slate-300 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-fyzen-accent" />
          Distribuição na semana
        </p>

        <div className="space-y-2">
          {DIAS.map((dia) => {
            const qtd = porDia[dia] || 0;
            const max = Math.max(...Object.values(porDia || {}), 1) || 1;
            const perc = max > 0 ? (qtd / max) * 100 : 0;

            return (
              <div key={dia} className="flex items-center gap-3">
                <span className="w-16 text-xs text-slate-400 uppercase">
                  {formatDia(dia)}
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-fyzen-accent"
                    style={{ width: `${perc}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-slate-300">
                  {qtd}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        {...fadeIn}
        className="glass-card rounded-3xl p-5 border border-white/5 space-y-3"
      >
        <p className="text-sm text-slate-300 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-fyzen-accent" />
          Mapa de consistência
        </p>

        <Calendario dias={treinos} />
      </motion.div>
    </div>
  );
}

function Card({ icon: Icon, label, value, helper, color }) {
  return (
    <div className="metric-card">
      <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wide">
        <Icon className={`w-4 h-4 ${color}`} />
        {label}
      </div>
      <p className="metric-value">{value}</p>
      <p className="text-[11px] text-slate-500 mt-1">{helper}</p>
    </div>
  );
}

function Calendario({ dias }) {
  const mapa = (dias || []).reduce((acc, t) => {
    const ts = t.timestamp;
    if (!ts) return acc;
    const data = ts?.toDate?.() ? ts.toDate() : new Date(ts);
    const key = data.toDateString();
    acc[key] = true;
    return acc;
  }, {});

  const hoje = new Date();
  const totalDias = 35;

  const blocos = [...Array(totalDias)].map((_, i) => {
    const d = new Date();
    d.setDate(hoje.getDate() - (totalDias - 1 - i));
    d.setHours(0, 0, 0, 0);
    const key = d.toDateString();
    const ativo = mapa[key];

    return (
      <div
        key={i}
        role="img"
        aria-label={`${d.toLocaleDateString("pt-BR")}: ${ativo ? "treino concluído" : "sem treino registrado"}`}
        title={`${d.toLocaleDateString("pt-BR")}: ${ativo ? "treino concluído" : "sem treino registrado"}`}
        className={`h-8 sm:h-10 rounded-md ${
          ativo ? "bg-emerald-400/80" : "bg-slate-800 border border-white/5"
        }`}
      />
    );
  });

  return <div className="grid grid-cols-7 gap-2">{blocos}</div>;
}

function formatDia(dia) {
  const map = {
    domingo: "Dom",
    segunda: "Seg",
    terça: "Ter",
    terca: "Ter",
    quarta: "Qua",
    quinta: "Qui",
    sexta: "Sex",
    sábado: "Sáb",
    sabado: "Sáb",
  };
  return map[dia?.toLowerCase()] || dia;
}
