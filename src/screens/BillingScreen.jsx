import PageHeader from "../components/PageHeader.jsx";
import Dialog from "../components/Dialog.jsx";
import { LoadingState, ErrorState } from "../components/ScreenState.jsx";
import { useToast } from "../components/Toast.jsx";
import React, { useEffect, useState } from "react";
import { auth, db } from "../lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { subscriptionEngine } from "../lib/subscriptionEngine";
import { Crown, AlertTriangle } from "lucide-react";

export default function BillingScreen({ onSelectScreen }) {
  const [assinatura, setAssinatura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("free");
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const ref = doc(db, "assinaturas", user.uid);
        const snap = await getDoc(ref);
        const subData = snap.exists() ? snap.data() : null;

        setAssinatura(subData);
        const result = await subscriptionEngine(user.uid);

        setStatus(result.plano);
      } catch (err) {
        console.error("Erro ao carregar billing:", err);
        setError("Não foi possível carregar sua assinatura.");
      }

      setLoading(false);
    }

    load();
  }, []);

  const agora = Date.now();
  const cancelado = assinatura?.canceladoEm && assinatura.canceladoEm <= agora;
  const futuroCancelado =
    assinatura?.canceladoEm && assinatura.canceladoEm > agora;
  const expirado = assinatura?.renovaEm && assinatura.renovaEm <= agora;

  const metodo = assinatura?.metodo || "desconhecido";
  const plano = assinatura?.plano || "free";

  async function cancelarRenovacao() {
    setCanceling(true);
    try {
      const ref = doc(db, "assinaturas", auth.currentUser.uid);
      await updateDoc(ref, {
        canceladoEm: agora,
        ativo: false,
      });

      showToast("Renovação cancelada.");
      window.location.reload();
    } catch (err) {
      console.error(err);
      showToast("Não foi possível cancelar. Tente novamente.", "error");
    } finally {
      setCanceling(false);
      setConfirmCancel(false);
    }
  }

  if (loading) {
    return <LoadingState label="Carregando sua assinatura…" />;
  }

  if (error)
    return (
      <ErrorState message={error} onRetry={() => window.location.reload()} />
    );

  if (status === "free") {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Minha assinatura"
          description="Consulte seu plano e gerencie seu acesso ao Fyzen."
        />
        <p className="text-slate-400 text-sm">
          Você está no plano <span className="text-fyzen-accent">FREE</span>.
        </p>

        <button
          onClick={() => onSelectScreen("premium")}
          className="bg-teal-500/20 border border-teal-300/30 px-4 py-2 rounded-xl text-fyzen-accent hover:bg-teal-400/20 transition"
        >
          Ver planos Premium
        </button>
      </div>
    );
  }

  const nomePlano = plano.toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minha assinatura"
        description="Consulte seu plano e gerencie seu acesso ao Fyzen."
      />

      <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-5">
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-yellow-300" />
          <div>
            <p className="text-slate-50 font-semibold">{nomePlano}</p>

            {!cancelado && !expirado && (
              <p className="text-emerald-400 text-sm">Assinatura ativa</p>
            )}

            {cancelado && (
              <p className="text-red-400 text-sm">Cancelada — sem acesso</p>
            )}

            {futuroCancelado && (
              <p className="text-yellow-300 text-sm">
                Renovação cancelada — acesso até{" "}
                {new Date(assinatura.canceladoEm).toLocaleDateString()}
              </p>
            )}

            {expirado && !cancelado && (
              <p className="text-red-400 text-sm">Plano expirado</p>
            )}
          </div>
        </div>

        <div className="text-sm text-slate-300 space-y-1">
          <p>
            <strong>Renovação em:</strong>{" "}
            {assinatura?.renovaEm
              ? new Date(assinatura.renovaEm).toLocaleDateString()
              : "--"}
          </p>
          <p>
            <strong>Método:</strong> {metodo}
          </p>

          {cancelado && (
            <p className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              Cancelado em:{" "}
              {new Date(assinatura.canceladoEm).toLocaleDateString()}
            </p>
          )}
        </div>

        {!cancelado && !expirado && (
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setConfirmCancel(true)}
              className="flex-1 bg-red-500/10 border border-red-400/30 text-red-400 px-4 py-2 rounded-xl hover:bg-red-500/20 transition"
            >
              Cancelar renovação
            </button>

            <button
              onClick={() => onSelectScreen("premium")}
              className="flex-1 bg-slate-700/40 border border-white/10 text-slate-200 px-4 py-2 rounded-xl hover:bg-slate-700/60 transition"
            >
              Mudar de plano
            </button>
          </div>
        )}

        {expirado && !cancelado && (
          <button
            onClick={() => onSelectScreen("premium")}
            className="w-full bg-teal-500/20 border border-teal-300/30 text-fyzen-accent px-4 py-2 rounded-xl hover:bg-teal-400/20 transition"
          >
            Renovar assinatura
          </button>
        )}
      </div>
      {confirmCancel && (
        <Dialog
          label="Cancelar renovação"
          onClose={() => {
            if (!canceling) setConfirmCancel(false);
          }}
        >
          <h2 className="text-xl mb-3">Cancelar renovação?</h2>
          <p className="text-sm text-fyzen-muted leading-relaxed">
            Ao confirmar, sua assinatura será desativada e o acesso aos recursos
            pagos será encerrado.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              className="btn-primary"
              disabled={canceling}
              onClick={() => setConfirmCancel(false)}
            >
              Manter assinatura
            </button>
            <button
              className="btn-ghost text-red-300"
              disabled={canceling}
              onClick={cancelarRenovacao}
            >
              {canceling ? "Cancelando…" : "Confirmar cancelamento"}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
