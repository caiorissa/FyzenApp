import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc, Timestamp, arrayUnion } from "firebase/firestore";

export async function registrarProgresso(uid, dados) {
  if (!uid) throw new Error("Usuário não autenticado.");

  const ref = doc(db, "progresso", uid);

  const registro = {
    ...dados,
    data: Timestamp.now(),
  };

  await setDoc(
    ref,
    {
      registros: arrayUnion(registro),
    },
    { merge: true },
  );
}

export async function carregarProgresso(uid) {
  if (!uid) return [];

  const ref = doc(db, "progresso", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return [];

  const data = snap.data();
  return Array.isArray(data.registros) ? data.registros : [];
}
