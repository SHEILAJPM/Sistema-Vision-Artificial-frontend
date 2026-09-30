import PropTypes from "prop-types";

const COLORS = {
  ok: "bg-teal-500",
  rejected: "bg-terracotta-500",
  idle: "bg-ink-faint",
  info: "bg-blue-500",
  gold: "bg-gold-500",
};

// Punto de estado con pulso sutil para indicar actividad en vivo (conexión,
// banda en marcha, etc). El pulso es una animación de opacidad, sin brillo.
export function StatDot({ tone = "idle", pulse = false, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className={`inline-flex h-2 w-2 rounded-full ${COLORS[tone]} ${pulse ? "animate-pulse-soft" : ""}`} />
      </span>
      {label && <span className="text-xs text-ink-soft">{label}</span>}
    </span>
  );
}

StatDot.propTypes = {
  tone: PropTypes.oneOf(Object.keys(COLORS)),
  pulse: PropTypes.bool,
  label: PropTypes.node,
};
