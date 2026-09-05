export function atualizarStreak() {
  if (typeof window === "undefined") return 0;

  const hoje = new Date().toISOString().slice(0, 10);
  const ultimoDia = localStorage.getItem("fitmind-streak-lastDay");
  let streakAtual = Number(localStorage.getItem("fitmind-streak") || 0);

  if (!ultimoDia) {
    localStorage.setItem("fitmind-streak-lastDay", hoje);
    localStorage.setItem("fitmind-streak", "1");
    return 1;
  }

  if (ultimoDia === hoje) {
    return streakAtual || 1;
  }

  const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (ultimoDia === ontem) {
    streakAtual = (streakAtual || 0) + 1;
  } else {
    streakAtual = 1;
  }

  localStorage.setItem("fitmind-streak-lastDay", hoje);
  localStorage.setItem("fitmind-streak", String(streakAtual));

  return streakAtual;
}
