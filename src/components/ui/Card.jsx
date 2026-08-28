export function Card({ children, className = "", padded = true }) {
  return (
    <div className={`panel-card ${padded ? "p-5" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-start gap-2.5">
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <Icon size={14} strokeWidth={2} />
          </span>
        )}
        <div>
          <h3 className="text-sm font-semibold text-ink tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-ink-faint mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
