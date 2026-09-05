import React from "react";
import { usePremium } from "../../context/PremiumContext.jsx";
import LockScreen from "../LockScreen.jsx";

export function RequirePaid({ children, onUpgrade }) {
  const { nivel, loading } = usePremium();

  if (loading) return null;

  if (nivel === "free") {
    return (
      <LockScreen
        title="Recurso Premium"
        description="Este recurso é exclusivo para assinantes PRO ou ULTRA."
        onUpgrade={onUpgrade}
      />
    );
  }

  return children;
}

export function RequirePro({ children, onUpgrade }) {
  const { nivel, loading } = usePremium();

  if (loading) return null;

  if (nivel !== "pro" && nivel !== "ultra") {
    return (
      <LockScreen
        title="Acesso PRO"
        description="Assine para desbloquear este recurso."
        onUpgrade={onUpgrade}
      />
    );
  }

  return children;
}

export function RequireUltra({ children, onUpgrade }) {
  const { nivel, loading } = usePremium();

  if (loading) return null;

  if (nivel !== "ultra") {
    return (
      <LockScreen
        title="Acesso ULTRA"
        description="Este recurso é exclusivo para usuários ULTRA."
        onUpgrade={onUpgrade}
      />
    );
  }

  return children;
}
