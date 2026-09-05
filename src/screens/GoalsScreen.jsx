import { useEffect, useState } from "react";
import { Target, Plus, Trash2, Clock, Check } from "lucide-react";
import { db } from "../lib/firebaseConfig";
import { subscribeAuth } from "../lib/subscribeAuth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "../components/Toast.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { LoadingState, ErrorState } from "../components/ScreenState.jsx";

export default function GoalsScreen() {
  const [user, setUser] = useState(null);
  const [minutosAlvo, setMinutosAlvo] = useState(30);
  const [treinosSemanaisAlvo, setTreinosSemanaisAlvo] = useState(20);
  const [personalGoals, setPersonalGoals] = useState([]);
  const [novoGoal, setNovoGoal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  async function carregarMetas(uid) {
    setLoading(true);
    setError("");
    try {
      const snap = await getDoc(doc(db, "metas", uid));
      if (snap.exists()) {
        const data = snap.data();
        setMinutosAlvo(data.minutosDiariosAlvo ?? 30);
        setTreinosSemanaisAlvo(data.treinosSemanaisAlvo ?? 20);
        setPersonalGoals(data.personalGoals ?? []);
      }
    } catch (err) {
      console.error("Erro ao carregar metas:", err);
      setError(
        "Não foi possível carregar suas metas. Tente novamente antes de editar.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(
    () =>
      subscribeAuth((u) => {
        setUser(u);
        if (u) carregarMetas(u.uid);
        else setLoading(false);
      }),
    [],
  );

  async function persistir(dados, message) {
    if (!user || saving) return false;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "metas", user.uid),
        { ...dados, updatedAt: serverTimestamp() },
        { merge: true },
      );
      showToast(message);
      return true;
    } catch (err) {
      console.error("Erro ao salvar metas:", err);
      showToast(
        "Não foi possível salvar. Suas metas anteriores foram mantidas.",
        "error",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }
  async function salvarMetas(event) {
    event.preventDefault();
    await persistir(
      {
        minutosDiariosAlvo: Number(minutosAlvo),
        treinosSemanaisAlvo: Number(treinosSemanaisAlvo),
      },
      "Metas de atividade salvas.",
    );
  }
  async function adicionarGoal(event) {
    event.preventDefault();
    if (!novoGoal.trim()) return;
    const lista = [
      ...personalGoals,
      { id: Date.now(), texto: novoGoal.trim() },
    ];
    if (await persistir({ personalGoals: lista }, "Meta adicionada.")) {
      setPersonalGoals(lista);
      setNovoGoal("");
    }
  }
  async function removerGoal(id) {
    const lista = personalGoals.filter((g) => g.id !== id);
    if (await persistir({ personalGoals: lista }, "Meta removida."))
      setPersonalGoals(lista);
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Metas que movem você"
        description="Pequenos compromissos, feitos no seu ritmo. Defina o que quer manter na sua rotina."
      />
      {loading ? (
        <LoadingState label="Carregando suas metas…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => carregarMetas(user.uid)} />
      ) : (
        <>
          <section className="surface-card p-6 sm:p-8">
            <div className="flex items-start gap-3 mb-6">
              <Clock size={22} className="text-fyzen-accent" />
              <div>
                <h2 className="text-xl">Metas de atividade</h2>
                <p className="text-sm text-fyzen-muted mt-2">
                  Escolha uma frequência que você consiga sustentar.
                </p>
              </div>
            </div>
            <form onSubmit={salvarMetas} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-5">
                <label>
                  <span className="field-label">
                    Minutos de atividade por dia
                  </span>
                  <input
                    type="number"
                    name="dailyMinutes"
                    min="1"
                    max="1440"
                    required
                    className="input-style"
                    value={minutosAlvo}
                    onChange={(e) => setMinutosAlvo(e.target.value)}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span className="field-label">Exercícios por semana</span>
                  <input
                    type="number"
                    name="weeklyExercises"
                    min="1"
                    required
                    className="input-style"
                    value={treinosSemanaisAlvo}
                    onChange={(e) => setTreinosSemanaisAlvo(e.target.value)}
                    disabled={saving}
                  />
                </label>
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving || !user}
              >
                <Check size={17} />
                {saving ? "Salvando…" : "Salvar metas"}
              </button>
            </form>
          </section>
          <section className="surface-card p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-3">
              <Target size={22} className="text-fyzen-accent" />
              <div>
                <h2 className="text-xl">Seus compromissos</h2>
                <p className="text-sm text-fyzen-muted mt-2">
                  Além do treino, o que você quer fazer por você?
                </p>
              </div>
            </div>
            <form
              onSubmit={adicionarGoal}
              className="flex flex-col sm:flex-row gap-3"
            >
              <label className="flex-1 min-w-0">
                <span className="sr-only">Nova meta personalizada</span>
                <input
                  type="text"
                  name="personalGoal"
                  className="input-style"
                  placeholder="Ex.: caminhar depois do almoço"
                  value={novoGoal}
                  onChange={(e) => setNovoGoal(e.target.value)}
                  required
                  disabled={saving}
                />
              </label>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving || !novoGoal.trim() || !user}
              >
                <Plus size={17} />
                Adicionar
              </button>
            </form>
            {personalGoals.length === 0 ? (
              <div className="empty-state">
                <p className="text-slate-200 font-medium mb-1">
                  Um novo hábito começa aqui.
                </p>
                <p>Adicione sua primeira meta no campo acima.</p>
              </div>
            ) : (
              <ul className="divide-y divide-fyzen-border">
                {personalGoals.map((goal) => (
                  <li key={goal.id} className="flex items-center gap-4 py-4">
                    <span className="h-2 w-2 rounded-full bg-fyzen-accent shrink-0" />
                    <span className="text-sm text-slate-200 flex-1 min-w-0 break-words">
                      {goal.texto}
                    </span>
                    <button
                      className="icon-button text-fyzen-muted hover:text-red-300"
                      aria-label={`Remover meta: ${goal.texto}`}
                      disabled={saving}
                      onClick={() => removerGoal(goal.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
