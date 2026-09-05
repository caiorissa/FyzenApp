export default function LockScreen({ title, description, onUpgrade }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="max-w-md surface-card p-8 shadow-panel space-y-5">
        <h2 className="font-display text-xl text-slate-50">{title}</h2>
        <p className="text-sm text-fyzen-muted leading-relaxed">
          {description}
        </p>
        <button
          type="button"
          onClick={onUpgrade}
          className="btn-primary w-full"
        >
          Ver planos
        </button>
      </div>
    </div>
  );
}
