const scenario = new URLSearchParams(location.search).get("scenario");
const plan = new URLSearchParams(location.search).get("plan") || "free";
const data = JSON.parse(sessionStorage.getItem("qa-documents") || "{}");
const form = {
  sexo: "feminino",
  idade: "29",
  peso: "65",
  altura: "168",
  nivel: "iniciante",
  objetivo: "hipertrofia",
  local: "academia",
  exerciciosPorGrupo: "3",
};
if (!data["planos/qa-user"] && scenario !== "empty")
  data["planos/qa-user"] = {
    form,
    analysis: { imc: "23.0", classificacao: "Normal", gasto: 2100 },
    nutrition: { total: 2500 },
    plan: {
      treinos: ["Peito", "Costas", "Pernas", "Ombros", "Core"].map((grupo) => ({
        grupo,
        exercicios: [
          "Agachamento livre – 3x12",
          "Prancha – 3x30s",
          "Afundo – 3x10",
        ],
      })),
    },
  };
if (plan !== "free")
  data["assinaturas/qa-user"] = {
    plano: plan,
    ativo: true,
    renovaEm: new URLSearchParams(location.search).has("expired")
      ? Date.now() - 1000
      : Date.now() + 86400000 * 30,
    metodo: "Stripe",
  };
export const collection = (_, ...parts) => ({ path: parts.join("/") });
export const doc = (base, ...parts) => ({
  path: [
    ...(base.path ? [base.path] : []),
    ...(parts.length ? parts : [crypto.randomUUID()]),
  ].join("/"),
});
export const query = (ref) => ref;
export const orderBy = () => ({});
export const limit = () => ({});
export const where = () => ({});
export const serverTimestamp = () => Date.now();
export const Timestamp = { now: () => Date.now() };
export const arrayUnion = (...items) => items;
const snapshot = (path, value) => ({
  id: path.split("/").pop(),
  exists: () => value !== undefined,
  data: () => value,
});
export async function getDoc(ref) {
  return snapshot(ref.path, data[ref.path]);
}
export async function getDocs(ref) {
  const docs = Object.entries(data)
    .filter(
      ([path]) =>
        path.startsWith(`${ref.path}/`) &&
        path.split("/").length === ref.path.split("/").length + 1,
    )
    .map(([path, value]) => snapshot(path, value));
  return {
    docs,
    empty: !docs.length,
    size: docs.length,
    forEach: (fn) => docs.forEach(fn),
  };
}
export function onSnapshot(ref, callback) {
  let live = true;
  (ref.path.split("/").length % 2 === 0 ? getDoc(ref) : getDocs(ref)).then(
    (snap) => {
      if (live) callback(snap);
    },
  );
  return () => {
    live = false;
  };
}
export async function setDoc(ref, payload, options) {
  if (sessionStorage.getItem("qa-fail-save"))
    throw new Error("Simulated write failure");
  data[ref.path] = options?.merge ? { ...data[ref.path], ...payload } : payload;
  sessionStorage.setItem("qa-documents", JSON.stringify(data));
}
export const updateDoc = (ref, payload) =>
  setDoc(ref, payload, { merge: true });
export async function addDoc(ref, payload) {
  const target = doc(ref);
  await setDoc(target, payload);
  return target;
}
