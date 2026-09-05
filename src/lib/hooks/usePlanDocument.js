import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

export function usePlanDocument(uid) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) {
      setData(null);
      setLoading(false);
      return;
    }

    const ref = doc(db, "planos", uid);

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setData({ id: snap.id, ...snap.data() });
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Erro ao escutar planos:", err);
        setError("Não foi possível carregar seu plano.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [uid]);

  return { data, loading, error };
}

export async function savePlanToCollection() {
  return true;
}
