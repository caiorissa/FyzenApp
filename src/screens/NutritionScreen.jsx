import PageHeader from "../components/PageHeader.jsx";
import { LoadingState, ErrorState } from "../components/ScreenState.jsx";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Flame, Utensils, Trash } from "lucide-react";
import { useToast } from "../components/Toast.jsx";
import { db } from "../lib/firebaseConfig";
import { subscribeAuth } from "../lib/subscribeAuth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const fadeIn = {
  initial: false,
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

function hojeISO() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const getDiaRef = (uid, diaISO) => doc(db, "nutrition", uid, "days", diaISO);

export default function NutritionScreen() {
  const [user, setUser] = useState(null);
  const [metaCalorica, setMetaCalorica] = useState(0);
  const [diaSelecionado, setDiaSelecionado] = useState(hojeISO());
  const [refeicoes, setRefeicoes] = useState([]);
  const [totalConsumido, setTotalConsumido] = useState(0);
  const [novaRef, setNovaRef] = useState({
    nome: "",
    calorias: "",
    tipo: "almoço",
  });
  const [carregandoDia, setCarregandoDia] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    const unsub = subscribeAuth(async (u) => {
      if (!u) return;
      setUser(u);
      await carregarMeta(u.uid);
    });

    return () => unsub();
  }, []);

  const carregarMeta = async (uid) => {
    try {
      const ref = doc(db, "planos", uid);
      const snap = await getDoc(ref);

      if (snap.exists() && snap.data().nutrition) {
        setMetaCalorica(snap.data().nutrition.total || 0);
      } else {
        setMetaCalorica(0);
      }
    } catch (err) {
      console.error("Erro ao carregar meta:", err);
      setMetaCalorica(0);
    }
  };

  const carregarDia = useCallback(async (uid, diaISO) => {
    const request = ++requestId.current;
    setCarregandoDia(true);
    setLoadError("");
    try {
      const ref = getDiaRef(uid, diaISO);
      const snap = await getDoc(ref);
      if (request !== requestId.current) return;

      if (snap.exists()) {
        const data = snap.data();
        setRefeicoes(data.refeicoes || []);
        setTotalConsumido(data.totalConsumido || 0);
      } else {
        setRefeicoes([]);
        setTotalConsumido(0);
      }
    } catch (err) {
      if (request !== requestId.current) return;
      console.error("Erro ao carregar dia de nutrição:", err);
      setLoadError(
        "Não foi possível carregar as refeições deste dia. Tente novamente antes de editar.",
      );
      setRefeicoes([]);
      setTotalConsumido(0);
    } finally {
      if (request === requestId.current) setCarregandoDia(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !diaSelecionado) return;
    carregarDia(user.uid, diaSelecionado);
  }, [diaSelecionado, user, carregarDia]);

  const salvarDia = async (refeicoesAtualizadas, totalAtualizado) => {
    if (!user || saving || carregandoDia || loadError) return false;
    setSaving(true);
    try {
      const ref = getDiaRef(user.uid, diaSelecionado);
      await setDoc(
        ref,
        {
          refeicoes: refeicoesAtualizadas,
          totalConsumido: totalAtualizado,
          metaCalorica,
          dia: diaSelecionado,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      return true;
    } catch (err) {
      console.error("Erro ao salvar nutrição:", err);
      showToast(
        "Não foi possível salvar a refeição. Tente novamente.",
        "error",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const { showToast } = useToast();
  const adicionarRefeicao = async () => {
    if (!novaRef.nome.trim() || !novaRef.calorias) {
      showToast("Preencha o nome e as calorias.", "error");
      return;
    }

    const caloriasNum = parseInt(novaRef.calorias, 10);
    if (isNaN(caloriasNum) || caloriasNum <= 0) {
      showToast("Informe uma quantidade de calorias maior que zero.", "error");
      return;
    }

    const novaLista = [
      ...refeicoes,
      {
        nome: novaRef.nome,
        calorias: caloriasNum,
        tipo: novaRef.tipo,
      },
    ];

    const novoTotal = totalConsumido + caloriasNum;

    if (await salvarDia(novaLista, novoTotal)) {
      setRefeicoes(novaLista);
      setTotalConsumido(novoTotal);
      setNovaRef({ ...novaRef, nome: "", calorias: "" });
      showToast("Refeição adicionada.");
    }
  };

  const removerRefeicao = async (index) => {
    const alvo = refeicoes[index];
    if (!alvo) return;

    const novaLista = refeicoes.filter((_, i) => i !== index);
    const novoTotal = totalConsumido - (alvo.calorias || 0);

    if (await salvarDia(novaLista, Math.max(0, novoTotal))) {
      setRefeicoes(novaLista);
      setTotalConsumido(Math.max(0, novoTotal));
      showToast("Refeição removida.");
    }
  };

  const handleChangeDia = (e) => {
    if (e.target.value) setDiaSelecionado(e.target.value);
  };

  const percent =
    metaCalorica > 0 ? Math.min((totalConsumido / metaCalorica) * 100, 160) : 0;

  let barClass = "bg-fyzen-accent";
  if (percent >= 90 && percent < 100) {
    barClass = "bg-fyzen-warm";
  } else if (percent >= 100) {
    barClass = "bg-red-400";
  }

  const passouMeta = metaCalorica > 0 && totalConsumido > metaCalorica;

  if (!user) {
    return (
      <div className="p-4">
        <p className="text-slate-400 text-sm">
          Faça login para acessar sua nutrição.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seu diário alimentar"
        description="Registre suas refeições e acompanhe o dia com mais clareza."
      />
      {loadError && (
        <ErrorState
          message={loadError}
          onRetry={() => carregarDia(user.uid, diaSelecionado)}
        />
      )}
      <motion.div
        {...fadeIn}
        className="glass-card rounded-3xl p-5 border border-white/5 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-300" />
            <input
              type="date"
              aria-label="Dia do diário alimentar"
              name="day"
              disabled={saving}
              value={diaSelecionado}
              onChange={handleChangeDia}
              required
              className="bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            />
          </div>

          <div className="flex items-center gap-3">
            <Flame className="w-4 h-4 text-amber-300" />
            <p className="text-sm text-slate-300">
              Meta diária:{" "}
              <span className="font-semibold text-amber-200">
                {metaCalorica > 0 ? `${metaCalorica} kcal` : "não definida"}
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>
              Consumido:{" "}
              <span className="text-slate-100 font-semibold">
                {totalConsumido} kcal
              </span>
            </span>
            {metaCalorica > 0 && <span>{Math.round(percent)}% da meta</span>}
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full ${barClass}`}
              style={{ width: `${metaCalorica > 0 ? percent : 0}%` }}
            />
          </div>

          {passouMeta && (
            <p className="text-xs text-red-300 mt-1">
              Você está acima da meta estimada para hoje. O registro ajuda a
              acompanhar sua rotina ao longo do tempo.
            </p>
          )}
        </div>
      </motion.div>

      <motion.div
        {...fadeIn}
        className="glass-card p-5 rounded-3xl border border-white/5 space-y-4"
      >
        <h3 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-fyzen-accent" />
          Registrar refeição
        </h3>

        <form
          id="meal-form"
          onSubmit={(event) => {
            event.preventDefault();
            adicionarRefeicao();
          }}
          className="grid lg:grid-cols-3 gap-4"
        >
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Nome da refeição</p>
            <input
              type="text"
              aria-label="Nome da refeição"
              name="meal"
              required
              disabled={saving || carregandoDia || !!loadError}
              value={novaRef.nome}
              onChange={(e) =>
                setNovaRef((prev) => ({ ...prev, nome: e.target.value }))
              }
              placeholder="Ex: Arroz, frango e salada"
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-400">Calorias (kcal)</p>
            <input
              type="number"
              min="1"
              aria-label="Calorias (kcal)"
              name="calories"
              required
              disabled={saving || carregandoDia || !!loadError}
              value={novaRef.calorias}
              onChange={(e) =>
                setNovaRef((prev) => ({ ...prev, calorias: e.target.value }))
              }
              placeholder="Ex: 450"
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-400">Tipo</p>
            <select
              aria-label="Tipo de refeição"
              name="mealType"
              disabled={saving || carregandoDia || !!loadError}
              value={novaRef.tipo}
              onChange={(e) =>
                setNovaRef((prev) => ({ ...prev, tipo: e.target.value }))
              }
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              <option value="café da manhã">Café da manhã</option>
              <option value="almoço">Almoço</option>
              <option value="lanche">Lanche</option>
              <option value="jantar">Jantar</option>
            </select>
          </div>
        </form>

        <button
          type="submit"
          form="meal-form"
          disabled={saving || carregandoDia || !!loadError}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          {saving ? "Salvando…" : "Adicionar refeição"}
        </button>
      </motion.div>

      <motion.div
        {...fadeIn}
        className="glass-card p-5 rounded-3xl border border-white/5 space-y-3"
      >
        <h3 className="text-lg font-semibold text-slate-50">
          Refeições do dia
        </h3>

        {carregandoDia && <LoadingState label="Carregando refeições…" />}

        {refeicoes.length === 0 && !carregandoDia && (
          <p className="text-slate-400 text-sm">
            Nenhuma refeição por aqui. Use o formulário acima para registrar a
            primeira.
          </p>
        )}

        <div className="space-y-3">
          {refeicoes.map((r, i) => (
            <div
              key={i}
              className="bg-fyzen-bg rounded-xl px-4 py-3 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-slate-50 font-medium text-sm">{r.nome}</p>
                <p className="text-slate-400 text-xs">
                  {r.tipo} ·{" "}
                  <span className="text-fyzen-accent">{r.calorias} kcal</span>
                </p>
              </div>

              <button
                onClick={() => removerRefeicao(i)}
                aria-label={`Remover refeição: ${r.nome}`}
                disabled={saving || carregandoDia || !!loadError}
                className="icon-button text-fyzen-muted hover:text-red-300"
              >
                <Trash className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
