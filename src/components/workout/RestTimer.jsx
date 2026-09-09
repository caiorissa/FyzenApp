import { useEffect, useState } from "react";
import { Bell, Minus, Plus, SkipForward } from "lucide-react";

function format(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function RestTimer({
  endsAt,
  onAdjust,
  onSkip,
  vibration = true,
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, Math.ceil(((endsAt || 0) - now) / 1000));
  useEffect(() => {
    if (endsAt && remaining === 0 && vibration && navigator.vibrate)
      navigator.vibrate(80);
  }, [endsAt, remaining, vibration]);
  if (!endsAt) return null;
  return (
    <section className="rest-timer" aria-live="polite">
      <div>
        <span>Descanso</span>
        <strong>{remaining ? format(remaining) : "Pronto"}</strong>
      </div>
      <div className="rest-actions">
        <button
          type="button"
          onClick={() => onAdjust(-15)}
          aria-label="Reduzir 15 segundos"
        >
          <Minus size={16} />
          15s
        </button>
        <button
          type="button"
          onClick={() => onAdjust(30)}
          aria-label="Adicionar 30 segundos"
        >
          <Plus size={16} />
          30s
        </button>
        <button type="button" onClick={onSkip}>
          <SkipForward size={16} />
          Pular
        </button>
      </div>
      {!remaining && <Bell size={18} aria-label="Descanso concluído" />}
    </section>
  );
}
