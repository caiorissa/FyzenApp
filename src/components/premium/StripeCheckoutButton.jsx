import { useToast } from "../Toast.jsx";
// src/components/premium/StripeCheckoutButton.jsx
import React, { useEffect, useState } from "react";
import { auth } from "../../lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { iniciarCheckoutStripe } from "../../lib/stripeService";

export default function StripeCheckoutButton({ priceId, plano = "pro" }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsub();
  }, []);

  const handleClick = async () => {
    try {
      if (!currentUser) {
        showToast("Entre na sua conta para assinar.", "error");
        return;
      }

      setLoading(true);

      await iniciarCheckoutStripe({
        priceId,
        uid: currentUser.uid,
        email: currentUser.email,
        plano,
      });
    } catch (err) {
      console.error("Erro Stripe:", err);
      showToast(
        "Não foi possível abrir o pagamento. Tente novamente.",
        "error",
      );
      setLoading(false);
    }
  };

  return (
    <button
      className="btn-primary w-full py-3 text-base disabled:opacity-50"
      disabled={loading || !currentUser}
      onClick={handleClick}
    >
      {loading ? "Redirecionando..." : "Assinar com Stripe"}
    </button>
  );
}
