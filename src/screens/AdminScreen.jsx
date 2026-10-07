import PageHeader from "../components/PageHeader.jsx";
import React, { useState } from "react";
import Card from "../components/Card.jsx";
import {
  Activity,
  Flame,
  Database,
  Loader2,
  Target,
  BarChart,
  Trophy,
  PieChart,
  Bell,
  Users,
} from "lucide-react";
import { usePlanDocument } from "../lib/hooks/usePlanDocument.js";
import { useAdminAnalytics } from "../lib/hooks/useAdminAnalytics.js";
import { useAdminWeeklyAnalytics } from "../lib/hooks/useAdminWeeklyAnalytics.js";
import { db } from "../lib/firebaseConfig";
import { collection, serverTimestamp, addDoc } from "firebase/firestore";

export default function AdminScreen({ user, isAdmin }) {
  const uid = user?.uid ?? null;
  const { data } = usePlanDocument(isAdmin ? uid : null);
  const { stats, loading, error } = useAdminAnalytics(isAdmin);
  const { semanaStats, loadingSemana, errorSemana } =
    useAdminWeeklyAnalytics(isAdmin);

  const [notifText, setNotifText] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");
  if (!isAdmin) {
    return (
      <Card title="Acesso restrito" className="bg-slate-900/70">
        <p className="text-sm text-slate-300">
          Somente o administrador autorizado pode visualizar este painel.
        </p>
      </Card>
    );
  }

  const gruposPopulares = stats?.gruposPopulares || [];
  const planosRecentes = stats?.planosRecentes || [];
  const ranking = stats?.ranking || [];

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifText.trim()) return;

    try {
      setSendingNotif(true);
      setNotifMsg("");

      await addDoc(collection(db, "notifications"), {
        message: notifText.trim(),
        createdAt: serverTimestamp(),
        createdBy: user?.email || user?.uid || "admin",
        type: "broadcast",
      });

      setNotifText("");
      setNotifMsg("Notificação enviada para todos os usuários ✅");
    } catch (err) {
      console.error("Erro ao enviar notificação:", err);
      setNotifMsg("Erro ao enviar notificação. Tente novamente.");
    } finally {
      setSendingNotif(false);
    }
  };

  const diasOrdenados = [
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado",
    "domingo",
  ];
  const labelDia = {
    segunda: "Seg",
    terca: "Ter",
    quarta: "Qua",
    quinta: "Qui",
    sexta: "Sex",
    sabado: "Sáb",
    domingo: "Dom",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão administrativa"
        description="Acompanhe a atividade e gerencie os avisos do Fyzen."
      />

      {loading && (
        <Card className="bg-slate-900/70 flex items-center gap-3 text-slate-200 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-fyzen-accent" />
          Carregando dados administrativos em tempo real...
        </Card>
      )}

      {error && !loading && !stats && (
        <Card className="bg-red-900/30 border border-red-500/10 text-red-200 text-sm">
          {error}
        </Card>
      )}

      {stats && (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <Card
              eyebrow="Usuários com plano salvo"
              title={stats.usuariosAtivos || 0}
              description="Contagem única via Firestore"
              icon={Users}
            />
            <Card
              eyebrow="Planos totais"
              title={stats.totalPlanos || 0}
              description="Documentos na coleção planos"
              icon={Activity}
            />
            <Card
              eyebrow="Planos atualizados hoje"
              title={stats.planosHoje || 0}
              description="Timestamp >= 00h"
              icon={Flame}
            />
            <Card
              eyebrow="Calorias médias sugeridas"
              title={stats.mediaCalorias ? `${stats.mediaCalorias} kcal` : "--"}
              description="Média dos planos ativos"
              icon={BarChart}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card
              eyebrow="Treinos concluídos hoje"
              title={stats.treinosHoje || 0}
              description="Baseado no histórico de treinos"
              icon={Activity}
            />
            <Card
              eyebrow="Objetivo mais buscado"
              title={stats.objetivoPopular || "--"}
              description="Últimos planos gerados"
              icon={Target}
            />
            <Card
              eyebrow="Top atleta da semana"
              title={
                ranking.length ? ranking[0].ownerEmail || ranking[0].uid : "--"
              }
              description={
                ranking.length
                  ? `${ranking[0].totalSemana} treinos na semana`
                  : "Ainda sem ranking"
              }
              icon={Trophy}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card
              title="Treinos por dia da semana"
              className="bg-slate-900/70"
              icon={PieChart}
            >
              {loadingSemana && (
                <p className="text-sm text-slate-400">
                  Calculando resumo semanal...
                </p>
              )}
              {errorSemana && (
                <p className="text-red-400 text-sm">
                  {errorSemana?.message || "Erro ao carregar resumo da semana."}
                </p>
              )}
              {semanaStats && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-end gap-2 h-32">
                    {diasOrdenados.map((d) => {
                      const valor = semanaStats.dias[d] || 0;
                      const max =
                        Math.max(
                          ...Object.values(semanaStats.dias || { 0: 1 }),
                        ) || 1;
                      const altura = (valor / max) * 100;
                      return (
                        <div
                          key={d}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <div
                            className="w-full rounded-full bg-slate-800 overflow-hidden"
                            style={{ height: "100%" }}
                          >
                            <div
                              className="w-full bg-fyzen-accent rounded-full transition-all"
                              style={{ height: `${altura || 4}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {labelDia[d]}
                          </span>
                          <span className="text-[11px] text-slate-300">
                            {valor}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400">
                    Total na semana:{" "}
                    <span className="text-fyzen-accent font-semibold">
                      {semanaStats.totalSemana}
                    </span>{" "}
                    treinos.
                  </p>
                </div>
              )}
            </Card>

            <Card
              title="Objetivos & grupos mais gerados"
              className="bg-slate-900/70"
            >
              {stats.objetivoPopular ? (
                <p className="text-sm text-slate-300 flex items-center gap-2">
                  <Target className="w-4 h-4 text-fyzen-accent" />
                  Objetivo mais buscado:{" "}
                  <span className="text-fyzen-accent font-semibold capitalize">
                    {stats.objetivoPopular}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-slate-400">
                  Nenhum objetivo registrado ainda.
                </p>
              )}
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {gruposPopulares.map((grupo) => (
                  <li key={grupo.grupo} className="flex justify-between">
                    <span className="capitalize">{grupo.grupo}</span>
                    <span className="text-slate-400">
                      {grupo.count} treinos
                    </span>
                  </li>
                ))}
                {!gruposPopulares.length && (
                  <li className="text-slate-500">
                    Sem dados de grupos musculares ainda.
                  </li>
                )}
              </ul>
            </Card>

            <Card
              title="Últimos planos sincronizados"
              className="lg:col-span-1 bg-slate-900/70"
            >
              <div className="max-h-56 overflow-auto custom-scroll">
                <table className="w-full text-xs sm:text-sm text-slate-300">
                  <thead className="sticky top-0 bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/70">
                    <tr className="text-slate-500 uppercase tracking-wide text-[11px]">
                      <th className="text-left py-2 px-1">Usuário</th>
                      <th className="text-left py-2 px-1">Objetivo</th>
                      <th className="text-left py-2 px-1">Local</th>
                      <th className="text-left py-2 px-1">Atualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planosRecentes.map((plan) => (
                      <tr
                        key={plan.id}
                        className="border-t border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td
                          className="py-2 px-1 truncate max-w-[150px]"
                          title={plan.ownerEmail}
                        >
                          {plan.ownerEmail ||
                            plan.ownerName ||
                            plan.ownerUid ||
                            "--"}
                        </td>
                        <td className="py-2 px-1 capitalize">
                          {plan.plan?.info?.objetivo || "--"}
                        </td>
                        <td className="py-2 px-1 capitalize">
                          {plan.plan?.info?.local || "--"}
                        </td>
                        <td className="py-2 px-1 text-slate-400 whitespace-nowrap">
                          {plan.updatedAt
                            ? plan.updatedAt.toDate?.().toLocaleString?.() ||
                              "--"
                            : "--"}
                        </td>
                      </tr>
                    ))}

                    {!planosRecentes.length && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-4 text-center text-slate-500"
                        >
                          Nenhum plano foi salvo ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <Card
            title="Ranking dos usuários (treinos na semana)"
            className="bg-slate-900/80"
            icon={Trophy}
          >
            {ranking.length === 0 && (
              <p className="text-sm text-slate-400">
                Ainda não há treinos registrados nesta semana.
              </p>
            )}

            {ranking.length > 0 && (
              <div className="max-h-64 overflow-auto custom-scroll">
                <table className="w-full text-xs sm:text-sm text-slate-300">
                  <thead>
                    <tr className="text-slate-500 uppercase tracking-wide text-[11px]">
                      <th className="text-left py-2 px-1">#</th>
                      <th className="text-left py-2 px-1">Usuário</th>
                      <th className="text-left py-2 px-1">Treinos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((r, idx) => (
                      <tr
                        key={r.uid}
                        className="border-t border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-2 px-1 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-1 truncate max-w-[200px]">
                          {r.ownerEmail || r.uid}
                        </td>
                        <td className="py-2 px-1">{r.totalSemana} treinos</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {data && (
        <Card title="Plano do administrador" className="bg-slate-900/80">
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-200">
            <p>
              Objetivo:{" "}
              <span className="text-fyzen-accent font-medium">
                {data.plan?.info?.objetivo || "--"}
              </span>
            </p>
            <p>
              Local:{" "}
              <span className="text-slate-50 font-medium">
                {data.plan?.info?.local || "--"}
              </span>
            </p>
            <p>
              Atualizado em:{" "}
              <span className="text-slate-50 font-medium">
                {data.updatedAt?.seconds
                  ? new Date(data.updatedAt.seconds * 1000).toLocaleString()
                  : "Ainda não sincronizado"}
              </span>
            </p>
            <p>
              Calorias sugeridas:{" "}
              <span className="text-fyzen-accent font-medium">
                {data.nutrition?.total || "--"} kcal
              </span>
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
            <Database className="w-3.5 h-3.5" /> Informações reais do documento
            do admin.
          </p>
        </Card>
      )}

      <Card
        title="Enviar notificação para os usuários"
        className="bg-slate-900/80"
        icon={Bell}
      >
        <form onSubmit={handleSendNotification} className="space-y-3">
          <textarea
            aria-label="Mensagem do aviso"
            name="notification"
            value={notifText}
            onChange={(e) => setNotifText(e.target.value)}
            rows={3}
            className="w-full rounded-2xl bg-slate-950/70 border border-white/10 text-sm text-slate-100 px-3 py-2 outline-none focus:ring-1 focus:ring-teal-400"
            placeholder="Escreva uma mensagem rápida para todos os usuários (ex: nova atualização, manutenção, etc.)"
          />
          <div className="flex items-center justify-between gap-3">
            <button
              type="submit"
              disabled={sendingNotif || !notifText.trim()}
              className={`px-4 py-2 rounded-2xl text-sm font-medium flex items-center gap-2 transition ${
                sendingNotif || !notifText.trim()
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-fyzen-accent text-slate-900 hover:brightness-105"
              }`}
            >
              <Bell className="w-4 h-4" />
              {sendingNotif ? "Enviando..." : "Enviar notificação"}
            </button>
            {notifMsg && <p className="text-xs text-slate-400">{notifMsg}</p>}
          </div>
        </form>
      </Card>
    </div>
  );
}
