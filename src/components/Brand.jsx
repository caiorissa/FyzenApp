import { Activity } from "lucide-react";

export default function Brand({ compact = false }) {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Activity size={23} strokeWidth={2.2} aria-hidden="true" />
      </span>
      {!compact && (
        <span>
          fyzen<span className="text-fyzen-accent">.</span>
        </span>
      )}
    </span>
  );
}
