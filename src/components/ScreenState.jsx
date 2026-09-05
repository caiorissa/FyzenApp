import { LoaderCircle, AlertCircle } from "lucide-react";

export function LoadingState({ label = "Carregando seus dados…" }) {
  return (
    <div className="screen-state" role="status">
      <LoaderCircle className="animate-spin text-fyzen-accent" size={24} />
      <p>{label}</p>
      <div className="skeleton-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
export function ErrorState({ message, onRetry }) {
  return (
    <div className="status-message error" role="alert">
      <AlertCircle size={18} />
      <div>
        <p>{message}</p>
        {onRetry && (
          <button className="text-link mt-2" onClick={onRetry}>
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
