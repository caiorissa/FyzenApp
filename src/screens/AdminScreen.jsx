import PageHeader from "../components/PageHeader.jsx";
import React, { useEffect, useState } from "react";
import Card from "../components/Card.jsx";
import {
  Users,
  Activity,
  Flame,
  Database,
  Loader2,
  Target,
  BarChart,
  Trophy,
  PieChart,
  Bell,
} from "lucide-react";
import { usePlanDocument } from "../lib/hooks/usePlanDocument.js";
import { useAdminAnalytics } from "../lib/hooks/useAdminAnalytics.js";
import { useAdminWeeklyAnalytics } from "../lib/hooks/useAdminWeeklyAnalytics.js";
import { db } from "../lib/firebaseConfig";
import {
  collection,
  serverTimestamp,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  where,
} from "firebase/firestore";

export default function AdminScreen({ user, isAdmin }) {
  const uid = user?.uid ?? null;
  const { data } = usePlanDocument(isAdmin ? uid : null);
  const { stats, loading, error } = useAdminAnalytics(isAdmin);
  const { semanaStats, loadingSemana, errorSemana } =
    useAdminWeeklyAnalytics(isAdmin);

  const [notifText, setNotifText] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");
  const [logs, setLogs] = useState([]);
  const [accessForm, setAccessForm] = useState({
    email: "",
    plano: "pro",
    dias: "30",
  });
  const [grantingAccess, setGrantingAccess] = useState(false);
  const [accessMessage, setAccessMessage] = useState("");

  async function corrigirAssinaturas() {
    if (
      !window.confirm("Corrigir documentos quebrados da coleção 'assinaturas'?")
    ) {
      return;
    }

    setLogs((prev) => [...prev, "🔍 Iniciando correção..."]);

    try {
      const snap = await getDocs(collection(db, "assinaturas"));
      let corrigidos = 0;
      let detalhes = [];

      for (const docSnap of snap.docs) {
        const uid = docSnap.id;
        const data = docSnap.data();
        const problemas = [];

        if (data.renovaEn) problemas.push("renovaEn → renovaEm");
        if (!data.plano) problemas.push("plano ausente");
        if (!data.criadoEm) problemas.push("criadoEm ausente");
        if (!data.metodo) problemas.push("metodo ausente");

        if (problemas.length === 0) {
          detalhes.push(`✔ ${uid}: Nenhuma correção necessária`);
          continue;
        }

        const renovaEmCorrigido =
          typeof data.renovaEn === "number" ? data.renovaEn : data.renovaEm;

        const novoDoc = {
          plano: (data.plano || "free").toLowerCase(),
          ativo: data.ativo !== false,
          metodo: data.metodo || "manual",
          criadoEm: data.criadoEm || Date.now(),
          renovaEm: renovaEmCorrigido || Date.now() + 30 * 86400000,
          ultimaVerificacao: Date.now(),
        };

        await setDoc(doc(db, "assinaturas", uid), novoDoc, { merge: false });

        corrigidos++;
        detalhes.push(`🔧 ${uid}: Corrigido → ${problemas.join(", ")}`);
      }

      setLogs((prev) => [
        ...prev,
        `✅ Concluído: ${corrigidos} assinatura(s) corrigida(s).`,
        ...detalhes,
      ]);
    } catch (err) {
      console.error("Erro ao corrigir assinaturas", err);
      setLogs((prev) => [
        ...prev,
        "❌ Erro ao corrigir assinaturas (veja o console).",
      ]);
    }
  }

  async function concederAcesso(event) {
    event.preventDefault();
    const email = accessForm.email.trim().toLowerCase();
    const dias = Number(accessForm.dias);

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setAccessMessage("Informe um e-mail válido.");
      return;
    }
    if (!["pro", "ultra"].includes(accessForm.plano)) {
      setAccessMessage("Escolha Pro ou Ultra.");
      return;
    }
    if (!Number.isInteger(dias) || dias < 1 || dias > 3650) {
      setAccessMessage("Informe uma validade entre 1 e 3.650 dias.");
      return;
    }

    setGrantingAccess(true);
    setAccessMessage("");
    try {
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("email", "==", email)),
      );
      const usuario = usersSnap.docs[0];
      if (!usuario) {
        setAccessMessage("Nenhum usuário foi encontrado com este e-mail.");
        return;
      }

      const targetUid = usuario.id;
      const ref = doc(db, "assinaturas", targetUid);
      const atual = await getDoc(ref);
      const agora = Date.now();
      await setDoc(
        ref,
        {
          plano: accessForm.plano,
          ativo: true,
          metodo: "admin_manual",
          criadoEm: atual.exists() ? atual.data().criadoEm || agora : agora,
          concedidoEm: agora,
          concedidoPor: user?.uid || "admin",
          renovaEm: agora + dias * 86400000,
          canceladoEm: null,
          ultimaVerificacao: agora,
        },
        { merge: true },
      );
      setAccessMessage(
        `${accessForm.plano.toUpperCase()} liberado por ${dias} dia${dias === 1 ? "" : "s"}.`,
      );
      setAccessForm((current) => ({ ...current, email: "" }));
    } catch (err) {
      console.error("Erro ao conceder plano:", err);
      setAccessMessage("Não foi possível conceder o acesso. Tente novamente.");
    } finally {
      setGrantingAccess(false);
    }
  }

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

  function PremiumUsersList() {
    const [lista, setLista] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      async function carregar() {
        setLoading(true);

        const snap = await getDocs(collection(db, "assinaturas"));
        const temp = [];

        for (const docAss of snap.docs) {
          const data = docAss.data();
          const uid = docAss.id;

          if (!data.plano || data.plano === "free") continue;

          const userSnap = await getDoc(doc(db, "users", uid));
          const user = userSnap.exists() ? userSnap.data() : {};

          temp.push({
            uid,
            nome: user.nome || "Usuário",
            email: user.email || "",
            plano: data.plano,
            ativo: data.ativo,
            metodo: data.metodo || "--",
            renovaEm: data.renovaEm,
            criadoEm: data.criadoEm,
            canceladoEm: data.canceladoEm,
          });
        }

        setLista(temp);
        setLoading(false);
      }

      carregar();
    }, []);

    if (loading)
      return (
        <p className="text-sm text-slate-400 py-2">
          Carregando usuários premium…
        </p>
      );

    if (!lista.length)
      return (
        <p className="text-sm text-slate-500">
          Nenhum usuário premium encontrado.
        </p>
      );

    return (
      <div className="max-h-80 overflow-auto custom-scroll">
        <table className="w-full text-sm text-slate-300">
          <thead className="bg-slate-900/60 sticky top-0 backdrop-blur">
            <tr className="text-slate-500 text-xs uppercase tracking-wide">
              <th className="py-2 px-2 text-left">Usuário</th>
              <th className="py-2 px-2 text-left">Plano</th>
              <th className="py-2 px-2 text-left">Status</th>
              <th className="py-2 px-2 text-left">Método</th>
              <th className="py-2 px-2 text-left">Renova</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => (
              <tr
                key={u.uid}
                className="border-t border-white/5 hover:bg-white/5 transition"
              >
                <td className="py-2 px-2">
                  <p className="font-medium text-slate-100">{u.nome}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </td>

                <td className="py-2 px-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      u.plano === "ultra"
                        ? "bg-teal-500/20 text-fyzen-accent border border-teal-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {u.plano.toUpperCase()}
                  </span>
                </td>

                <td className="py-2 px-2">
                  {u.ativo ? (
                    <span className="text-fyzen-accent text-xs">Ativo</span>
                  ) : (
                    <span className="text-red-300 text-xs">Cancelado</span>
                  )}
                </td>

                <td className="py-2 px-2 text-xs text-slate-400">{u.metodo}</td>

                <td className="py-2 px-2 text-xs text-slate-400">
                  {u.renovaEm
                    ? new Date(u.renovaEm).toLocaleDateString("pt-BR")
                    : "--"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão administrativa"
        description="Acompanhe a atividade, consulte os planos e gerencie os avisos do Fyzen."
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

      <Card
        title="Conceder acesso Premium"
        className="bg-slate-900/80"
        icon={Users}
      >
        <form onSubmit={concederAcesso} className="space-y-4">
          <p className="text-sm text-fyzen-muted leading-relaxed">
            Libere Pro ou Ultra manualmente usando o e-mail cadastrado do
            usuário.
          </p>
          <div className="grid sm:grid-cols-[minmax(0,1fr)_130px_130px] gap-3">
            <label>
              <span className="field-label">E-mail do usuário</span>
              <input
                className="input-style"
                type="email"
                inputMode="email"
                value={accessForm.email}
                onChange={(event) =>
                  setAccessForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="nome@exemplo.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              <span className="field-label">Plano</span>
              <select
                aria-label="Plano"
                value={accessForm.plano}
                onChange={(event) =>
                  setAccessForm((current) => ({
                    ...current,
                    plano: event.target.value,
                  }))
                }
              >
                <option value="pro">Pro</option>
                <option value="ultra">Ultra</option>
              </select>
            </label>
            <label>
              <span className="field-label">Validade</span>
              <select
                aria-label="Validade"
                value={accessForm.dias}
                onChange={(event) =>
                  setAccessForm((current) => ({
                    ...current,
                    dias: event.target.value,
                  }))
                }
              >
                <option value="7">7 dias</option>
                <option value="30">30 dias</option>
                <option value="90">90 dias</option>
                <option value="365">1 ano</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="btn-primary"
              disabled={grantingAccess || !accessForm.email.trim()}
            >
              {grantingAccess
                ? "Concedendo…"
                : `Conceder ${accessForm.plano.toUpperCase()}`}
            </button>
            {accessMessage && (
              <p
                role={
                  /não foi|informe|nenhum|escolha/i.test(accessMessage)
                    ? "alert"
                    : "status"
                }
                className={
                  /não foi|informe|nenhum|escolha/i.test(accessMessage)
                    ? "text-sm text-red-300"
                    : "text-sm text-fyzen-accent"
                }
              >
                {accessMessage}
              </p>
            )}
          </div>
        </form>
      </Card>

      <Card
        title="Usuários Premium (PRO e ULTRA)"
        className="bg-slate-900/80"
        icon={Users}
      >
        <PremiumUsersList />
      </Card>

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
      {logs.length > 0 && (
        <div className="mt-6 p-4 glass-card border border-white/10 rounded-xl max-h-80 overflow-y-auto text-sm space-y-1">
          <p className="text-fyzen-accent font-semibold mb-2">
            Logs da manutenção:
          </p>
          {logs.map((log, i) => (
            <p key={i} className="text-slate-300">
              {log}
            </p>
          ))}
        </div>
      )}

      <button
        onClick={corrigirAssinaturas}
        className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 transition"
      >
        Corrigir assinaturas quebradas
      </button>
    </div>
  );
}
