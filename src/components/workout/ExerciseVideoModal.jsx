import { X } from "lucide-react";
import Dialog from "../Dialog.jsx";

export default function ExerciseVideoModal({
  exerciseName,
  embedUrl,
  onClose,
}) {
  return (
    <Dialog
      onClose={onClose}
      label={`Vídeo de demonstração: ${exerciseName}`}
      className="w-full max-w-3xl"
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              Vídeo de exemplo
            </h2>
            <p className="mt-1 text-sm text-slate-400">{exerciseName}</p>
          </div>
          <button
            type="button"
            aria-label="Fechar vídeo"
            className="icon-button shrink-0"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="aspect-video overflow-hidden rounded-xl bg-black">
          <iframe
            key={embedUrl}
            title={`Vídeo de demonstração de ${exerciseName}`}
            src={embedUrl}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </Dialog>
  );
}
