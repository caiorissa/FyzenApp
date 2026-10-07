import React, { useState } from "react";
import { Play } from "lucide-react";
import ExerciseVideoModal from "./ExerciseVideoModal.jsx";
import {
  getExerciseVideoUrl,
  getYouTubeEmbedUrl,
} from "@/lib/workout/exerciseVideos.js";

function getSearchName(exerciseName = "") {
  const rawName =
    typeof exerciseName === "object" ? exerciseName?.name : exerciseName;

  return String(rawName || "")
    .replace(/\s*[–—-]\s*\d+\s*x\s*\d+(?:\s*[-–]\s*\d+)?(?:\s*.*)?$/i, "")
    .replace(/\s*[–—-]\s*\d+\s*(?:reps?|s|segundos?|min(?:utos?)?)\b.*$/i, "")
    .trim();
}

export default function ExerciseVideoLink({
  exerciseName,
  videoUrl,
  compact = false,
}) {
  const name = getSearchName(exerciseName);
  const [isOpen, setIsOpen] = useState(false);
  if (!name) return null;

  const query = encodeURIComponent(`${name} execução correta exercício`);
  const href = `https://www.youtube.com/results?search_query=${query}`;
  const directUrl = videoUrl || getExerciseVideoUrl(exerciseName);
  const embedUrl = getYouTubeEmbedUrl(directUrl);
  const className = `inline-flex w-fit items-center gap-1.5 rounded-lg border border-fyzen-accent/25 bg-fyzen-accent/[0.06] text-fyzen-accent transition hover:bg-fyzen-accent/15 ${
    compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
  }`;

  return (
    <>
      {embedUrl ? (
        <button
          type="button"
          aria-label={`Ver vídeo de demonstração de ${name}`}
          className={className}
          onClick={() => setIsOpen(true)}
        >
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          Vídeo de exemplo
        </button>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Buscar vídeos de demonstração de ${name}`}
          className={className}
        >
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          Vídeo de exemplo
        </a>
      )}
      {isOpen && embedUrl && (
        <ExerciseVideoModal
          exerciseName={name}
          embedUrl={embedUrl}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
