import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function registrarPagamento({ uid, plano, metodo, gatewayInfo }) {
  const ref = doc(db, "assinaturas", uid);

  const snap = await getDoc(ref);
  const agora = Date.now();
  const renovaEm = agora + 30 * 24 * 60 * 60 * 1000;

  let statusAtual = snap.exists() ? snap.data() : null;
  let planoAnterior = statusAtual?.plano || "free";

  const upgradeOuDowngrade = planoAnterior !== plano;

  await setDoc(
    ref,
    {
      plano,
      ativo: true,
      metodo,
      criadoEm: statusAtual?.criadoEm || agora,
      renovaEm,
      ultimaVerificacao: agora,

      planoAnterior: statusAtual?.plano || null,
      upgradeOuDowngrade,

      gatewayInfo,
    },
    { merge: true },
  );

  return true;
}
