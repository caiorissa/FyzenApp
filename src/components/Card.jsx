import React from "react";

export default function Card({
  step,
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
  className = "",
}) {
  return (
    <div className={`surface-card p-5 ${className}`}>
      <div className="flex gap-4">
        {step != null && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fyzen-accent/15 text-sm font-medium text-fyzen-accent">
            {step}
          </span>
        )}
        {Icon && !step && (
          <Icon className="w-5 h-5 text-fyzen-accent shrink-0 mt-0.5" />
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs text-fyzen-muted mb-0.5">{eyebrow}</p>
          )}
          {title && <p className="font-medium text-slate-100">{title}</p>}
          {description && (
            <p className="text-sm text-fyzen-muted mt-1 leading-relaxed">
              {description}
            </p>
          )}
          {children && (
            <div className="mt-3 text-sm text-slate-300">{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
