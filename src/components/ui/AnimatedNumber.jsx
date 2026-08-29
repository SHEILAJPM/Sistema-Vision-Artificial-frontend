import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { animate } from "motion";

// Anima un valor numerico "contando" hacia el nuevo valor en vez de saltar,
// para que las cifras en vivo (inspeccionados, rechazados, % de rechazo) se
// sientan como parte de un sistema activo. `format` recibe el numero
// intermedio (con decimales) en cada frame.
export function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString("es"), duration = 0.6 }) {
  const [display, setDisplay] = useState(value ?? 0);
  const prev = useRef(value ?? 0);

  useEffect(() => {
    const target = value ?? 0;
    const controls = animate(prev.current, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = target;
    return () => controls.stop();
  }, [value, duration]);

  return <span className="tnum">{format(display)}</span>;
}

AnimatedNumber.propTypes = {
  value: PropTypes.number,
  format: PropTypes.func,
  duration: PropTypes.number,
};
