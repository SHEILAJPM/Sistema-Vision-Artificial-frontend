import PropTypes from "prop-types";

export function Toggle({ checked, onChange, disabled, label }) {
  return (
    <label className={`inline-flex items-center gap-2.5 ${disabled ? "opacity-40" : "cursor-pointer"}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`focus-ring relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ${
          checked ? "bg-green-500" : "bg-line-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
      {label && <span className="text-sm text-ink-soft">{label}</span>}
    </label>
  );
}

Toggle.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  label: PropTypes.node,
};
