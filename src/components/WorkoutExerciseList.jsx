import React from "react";
import ExerciseVideoLink from "./workout/ExerciseVideoLink.jsx";

function getExerciseDetails(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(.*?)\s*[–—-]\s*((?:\d+\s*x\s*)?\d+(?:\s*[-–]\s*\d+)?(?:\s*(?:reps?|s|segundos?|min(?:utos?)?))?)$/i);
  if (!match) return { name: text, prescription: "" };

  return {
    name: match[1].trim(),
    prescription: match[2].replace(/\s*x\s*/i, " × ").replace(/\s+/g, " "),
  };
}

export default function WorkoutExerciseList({ treino = [] }) {
  if (!Array.isArray(treino) || treino.length === 0) {
    return (
      <p className="text-xs text-slate-500 mt-2">
        Nenhum exercício cadastrado para este grupo.
      </p>
    );
  }

  return (
    <div className="plan-exercises">
      <div className="plan-exercises-heading">
        <span>Exercícios</span>
        <span>{treino.length} exercícios</span>
      </div>
      <ul>
        {treino.map((item, index) => {
          const { name, prescription } = getExerciseDetails(item);
          return (
            <li key={`${item}-${index}`}>
              <span className="plan-exercise-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="plan-exercise-description">
                <span>{name}</span>
                {prescription && <small>{prescription}</small>}
              </div>
              <ExerciseVideoLink exerciseName={item} compact />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
