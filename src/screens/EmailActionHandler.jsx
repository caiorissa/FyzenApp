import React, { useEffect, useState } from "react";
import { auth } from "../lib/firebaseConfig";
import { applyActionCode } from "firebase/auth";

export default function EmailActionHandler() {
  const [status, setStatus] = useState("Processando verificação...");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

    if (mode !== "verifyEmail" || !oobCode) {
      setStatus("Link de verificação inválido ou expirado.");
      return;
    }

    applyActionCode(auth, oobCode)
      .then(() => {
        setStatus("Email verificado com sucesso! Redirecionando...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      })
      .catch((err) => {
        console.error("Erro ao verificar email:", err);
        setStatus("Erro ao verificar email. Tente novamente.");
      });
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="surface-card p-8 max-w-md space-y-5">
        <h1 className="text-2xl text-slate-100">Verificação de e-mail</h1>
        <p role="status" className="text-fyzen-muted text-sm">
          {status}
        </p>
        <a href="/" className="btn-ghost">
          Voltar ao Fyzen
        </a>
      </div>
    </main>
  );
}
