const API_URL = (import.meta.env?.VITE_AI_WORKOUT_API_URL || "").replace(
  /\/$/,
  "",
);

export async function askFyzenAI({ message, history = [], user }) {
  if (!API_URL)
    throw new Error("O endereço do serviço Fyzen AI não está configurado.");
  if (typeof user?.getIdToken !== "function")
    throw new Error("Entre na sua conta para conversar com o Fyzen AI.");

  const idToken = await user.getIdToken();
  if (!idToken) throw new Error("Sua sessão expirou. Entre novamente.");

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(`${API_URL}/coach/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        message: String(message || "")
          .trim()
          .slice(0, 1200),
        history: history.slice(-8).map((item) => ({
          role: item.role === "coach" ? "assistant" : "user",
          content: String(item.text || "").slice(0, 1200),
        })),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (response.status === 404) {
      throw new Error(
        "O chat de IA ainda não está ativo no servidor. Publique a atualização do Fyzen Backend e tente de novo.",
      );
    }
    if (!response.ok)
      throw new Error(
        data.error || "Não consegui falar com a IA agora. Tente novamente.",
      );
    if (typeof data.reply !== "string" || !data.reply.trim())
      throw new Error("A IA retornou uma resposta vazia. Tente novamente.");

    return data.reply.trim();
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error("A resposta demorou demais. Tente novamente.");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
