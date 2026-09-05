import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

/** Observa login/logout com a API modular do Firebase v9+. */
export function subscribeAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
