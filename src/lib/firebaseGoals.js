import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

function agoraISO() {
  return new Date().toISOString();
}

export async function salvarMetas(uid, metas) {
  if (!uid) {
    throw new Error("Usuário não autenticado.");
  }

  if (
    !metas.pesoObjetivo ||
    !metas.prazoObjetivo ||
    !metas.passosPorDia ||
    !metas.aguaPorDia
  ) {
    throw new Error("Preencha todos os campos antes de salvar.");
  }

  const ref = doc(db, "metas", uid);

  const dados = {
    pesoObjetivo: Number(metas.pesoObjetivo),
    prazoObjetivo: metas.prazoObjetivo,
    passosPorDia: Number(metas.passosPorDia),
    aguaPorDia: Number(metas.aguaPorDia),
    ultimaAtualizacao: agoraISO(),
    minutosDiariosAlvo: metas.minutosDiariosAlvo
      ? Number(metas.minutosDiariosAlvo)
      : undefined,
    treinosSemanaisAlvo: metas.treinosSemanaisAlvo
      ? Number(metas.treinosSemanaisAlvo)
      : undefined,
  };

  await setDoc(ref, dados, { merge: true });

  return dados;
}

export async function carregarMetas(uid) {
  if (!uid) return null;

  const ref = doc(db, "metas", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) return snap.data();
  return null;
}
