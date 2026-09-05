import { getActivePlan } from "./subscriptionStatus.js";
import { db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export async function subscriptionEngine(uid) {
  if (!db) {
    return { plano: "free" };
  }

  try {
    const ref = doc(db, "assinaturas", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return { plano: "free" };
    }

    return { plano: getActivePlan(snap.data()) };
  } catch {
    return { plano: "free" };
  }
}
