import { Check } from "lucide-react";

export default function SetRow({ set, active, onChange }) {
  return (
    <div className={`set-row ${set.completed ? "is-complete" : ""}`}>
      <span className="set-number">{set.setNumber}</span>
      <label>
        <span className="sr-only">Carga da série {set.setNumber} em kg</span>
        <input
          inputMode="decimal"
          type="text"
          value={set.weight}
          placeholder="—"
          onChange={(event) =>
            onChange({ weight: event.target.value.replace(",", ".") })
          }
          disabled={set.completed || !active}
        />
      </label>
      <label>
        <span className="sr-only">Repetições da série {set.setNumber}</span>
        <input
          inputMode="numeric"
          type="number"
          min="0"
          value={set.reps}
          placeholder="—"
          onChange={(event) => onChange({ reps: event.target.value })}
          disabled={set.completed || !active}
        />
      </label>
      <span
        className="set-state"
        role="img"
        aria-label={
          set.completed
            ? `Série ${set.setNumber} concluída`
            : `Série ${set.setNumber} pendente`
        }
      >
        {set.completed && <Check size={16} />}
      </span>
    </div>
  );
}
