import React, { createContext, useContext } from "react";

const PremiumContext = createContext({
  nivel: "ultra",
  isUltra: true,
});

export function PremiumProvider({ children }) {
  return (
    <PremiumContext.Provider value={{ nivel: "ultra", isUltra: true }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
