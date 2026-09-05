import React, { useState } from "react";
import { auth } from "../lib/firebaseConfig";

function requireAuth() {
  if (!auth?.currentUser) throw new Error("Sessão não encontrada.");
  return auth;
}
import { sendEmailVerification } from "firebase/auth";
import { Mail } from "lucide-react";

export default function VerifyEmailScreen({ onVerified }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkVerification() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const a = requireAuth();
      await a.currentUser.reload();

      if (a.currentUser?.emailVerified) {
        onVerified(a.currentUser);
        window.location.reload();
      } else {
        setError("O e-mail ainda não foi confirmado.");
      }
    } catch {
      setError(
        "Não foi possível verificar. Confira sua conexão e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendEmail() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await sendEmailVerification(requireAuth().currentUser);
      setSuccess("Novo e-mail enviado. Confira sua caixa de entrada.");
    } catch {
      setError(
        "Não foi possível reenviar. Aguarde um pouco e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 fyzen-bg">
      <div className="surface-card max-w-md w-full p-8 shadow-panel">
        <Mail className="text-fyzen-accent w-9 h-9 mx-auto mb-5" />

        <h1 className="font-display text-xl text-slate-50">
          Confirme seu e-mail
        </h1>

        <p className="text-fyzen-muted text-sm mt-3 leading-relaxed">
          Abra o link que enviamos para{" "}
          <strong className="text-slate-300">{auth?.currentUser?.email}</strong>{" "}
          e volte aqui. Se não aparecer, olhe o spam.
        </p>

        {error && (
          <p role="alert" className="status-message error mt-4">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="status-message success mt-4">
            {success}
          </p>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={checkVerification}
          className="btn-primary w-full mt-6"
        >
          Já confirmei
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={resendEmail}
          className="mt-4 text-sm text-fyzen-accent hover:text-fyzen-accent-hover"
        >
          Reenviar e-mail
        </button>

        <button
          type="button"
          onClick={() => auth?.signOut()}
          className="mt-4 block w-full text-sm text-fyzen-muted hover:text-slate-300"
        >
          Usar outro e-mail
        </button>
      </div>
    </div>
  );
}
