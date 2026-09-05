import { auth, user } from "./firebase-config.js";
const listeners = new Set();
export function onAuthStateChanged(_, callback) {
  listeners.add(callback);
  queueMicrotask(() => callback(auth.currentUser));
  return () => listeners.delete(callback);
}
export async function signOut() {
  auth.currentUser = null;
  listeners.forEach((callback) => callback(null));
}
auth.signOut = signOut;
export class GoogleAuthProvider {}
export async function signInWithPopup() {
  return { user };
}
export async function signInWithEmailAndPassword(_, email) {
  if (email.startsWith("invalid"))
    throw Object.assign(new Error("Test invalid credential"), {
      code: "auth/invalid-credential",
    });
  auth.currentUser = user;
  listeners.forEach((callback) => callback(user));
  return { user };
}
export async function createUserWithEmailAndPassword() {
  return { user: { ...user, emailVerified: false } };
}
export async function updateProfile() {}
export async function sendEmailVerification() {}
export async function sendPasswordResetEmail() {}
export async function applyActionCode() {}
