import { validarPlanoAlimentarSemanal } from "./mealPlanValidation.js";

const API_URL = (import.meta.env?.VITE_AI_WORKOUT_API_URL || "").replace(/\/$/, "");

export async function gerarPlanoAlimentarSemanal(
  user,
  preferences,
  fetchImpl = fetch,
  apiUrl = API_URL,
) {
  if (!user || typeof user.getIdToken !== "function") {
    throw new Error("Entre na sua conta para gerar o plano alimentar.");
  }
  if (!apiUrl) throw new Error("O serviço Fyzen AI não está configurado.");
  if (!preferences?.allergies?.trim() || !preferences?.restrictions?.trim()) {
    throw new Error("Informe suas alergias e restrições; se não houver, escreva ‘Nenhuma conhecida’.");
  }

  let token;
  try {
    token = await user.getIdToken();
  } catch {
    throw new Error("Sua sessão expirou. Entre novamente para continuar.");
  }
  if (!token) throw new Error("Sua sessão expirou. Entre novamente para continuar.");

  let response;
  try {
    response = await fetchImpl(`${apiUrl.replace(/\/$/, "")}/meal/weekly-plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        allergies: preferences.allergies,
        restrictions: preferences.restrictions,
        preferences: preferences.preferences || "",
        clinicalDietRequired: preferences.clinicalDietRequired === true,
      }),
    });
  } catch {
    throw new Error("Não foi possível conectar ao Fyzen AI. Verifique sua conexão e tente novamente.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("O Fyzen AI retornou uma resposta inválida. Tente novamente.");
  }
  if (!response.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : "Não foi possível gerar o plano alimentar.");
  }
  validarPlanoAlimentarSemanal(data?.plan, preferences);
  return data.plan;
}
