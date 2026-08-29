import PropTypes from "prop-types";

// Extraído del control inline de SettingsPanel.jsx para reusarlo en
// Inspección Manual (umbral de confianza / IoU) sin duplicar el markup.
export function Slider({ value, onChange, min, max, step, format }) {
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-green-500"
      />
      <span className="w-16 shrink-0 text-right text-sm font-medium text-ink tnum">{format(value)}</span>
    </div>
  );
}

Slider.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired,
  format: PropTypes.func.isRequired,
};
