import { Trophy } from "lucide-react";
import { formatVolume } from "../../lib/workout/analytics.js";

export default function WorkoutSummary({ session, prs = [], onClose }) {
  const duration = Math.max(
    1,
    Math.round(
      ((session.completedAt || Date.now()) - session.startedAt) / 60000,
    ),
  );
  return (
    <div className="workout-summary">
      <span className="summary-check">✓</span>
      <p>Treino concluído</p>
      <h1>{session.name}</h1>
      <div className="summary-stats">
        <div>
          <strong>{duration} min</strong>
          <span>duração</span>
        </div>
        <div>
          <strong>{session.totalSets}</strong>
          <span>séries</span>
        </div>
        <div>
          <strong>{formatVolume(session.totalVolume)}</strong>
          <span>volume</span>
        </div>
      </div>
      {prs.length > 0 && (
        <div className="pr-banner">
          <Trophy size={20} />
          <div>
            <strong>Novo recorde</strong>
            <p>
              {prs[0].exercise.name} · {prs[0].set.weight} kg ×{" "}
              {prs[0].set.reps}
            </p>
          </div>
        </div>
      )}
      <button className="btn-primary w-full" type="button" onClick={onClose}>
        Ver meu progresso
      </button>
    </div>
  );
}
