const VARIANTS = {
  primary: "bg-blue-500 text-white hover:bg-blue-600 border border-blue-500",
  danger: "bg-coral-500 text-white hover:bg-coral-600 border border-coral-500",
  soft: "bg-panel-alt text-ink hover:bg-line border border-line",
  outline: "bg-canvas text-ink-soft hover:text-ink hover:border-line-strong border border-line",
};

const SIZES = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
};

export function Button({
  children,
  variant = "soft",
  size = "md",
  icon: Icon,
  disabled,
  className = "",
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={`focus-ring inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === "sm" ? 14 : 16} strokeWidth={2} />}
      {children}
    </button>
  );
}
