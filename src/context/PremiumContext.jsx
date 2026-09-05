import { getActivePlan } from "../lib/subscriptionStatus.js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseConfig";
import { subscribeAuth } from "../lib/subscribeAuth";

const PremiumContext = createContext({
  nivel: "free",
  isFree: true,
  isPro: false,
  isUltra: false,
});

export function PremiumProvider({ children, userPlan = "free", onPlanChange }) {
  const [nivel, setNivel] = useState(String(userPlan || "free").toLowerCase());

  useEffect(() => {
    setNivel(String(userPlan || "free").toLowerCase());
  }, [userPlan]);

  useEffect(() => {
    if (!db) return undefined;

    let unsubFirestore = () => {};
    const updatePlan = (next) => {
      setNivel(next);
      onPlanChange?.(next);
    };

    const unsubAuth = subscribeAuth((user) => {
      unsubFirestore();

      if (!user) {
        updatePlan("free");
        return;
      }

      const ref = doc(db, "assinaturas", user.uid);
      unsubFirestore = onSnapshot(
        ref,
        (snap) => {
          updatePlan(getActivePlan(snap.data()));
        },
        () => updatePlan("free"),
      );
    });

    return () => {
      unsubAuth();
      unsubFirestore();
    };
  }, [onPlanChange]);

  const value = {
    nivel,
    isFree: nivel === "free",
    isPro: nivel === "pro" || nivel === "ultra",
    isUltra: nivel === "ultra",
  };

  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
