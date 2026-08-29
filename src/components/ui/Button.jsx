import PropTypes from "prop-types";

const VARIANTS = {
  primary: "bg-green-500 text-white hover:bg-green-600 border border-green-500",
  danger: "bg-terracotta-500 text-white hover:bg-terracotta-600 border border-terracotta-500",
  soft: "bg-panel-alt text-ink hover:bg-line border border-line",
  outline: "bg-canvas text-ink-soft hover:text-ink hover:border-line-strong border border-line",
};

const SIZES = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-sm px-5 py-3 gap-2.5",
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
      className={`focus-ring inline-flex items-center justify-center rounded-lg font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-card active:translate-y-0 active:scale-[0.97] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} strokeWidth={2} />}
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(Object.keys(VARIANTS)),
  size: PropTypes.oneOf(Object.keys(SIZES)),
  icon: PropTypes.elementType,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};
