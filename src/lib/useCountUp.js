import { useEffect, useRef, useState } from "react";

// Anima un número desde su valor anterior hasta el nuevo con ease-out, en vez
// de saltar de golpe -- en un panel donde los datos cambian solos (polling/WS)
// esto es lo que hace que "se sienta vivo" en vez de "se sienta que refresca".
// Arranca en 0 a propósito (no en `value`): así el primer render también
// cuenta hacia arriba en vez de aparecer ya con el número final -- si no,
// con datos de ejemplo estáticos el conteo nunca se llega a ver.
export function useCountUp(value, duration = 600) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (!Number.isFinite(to) || from === to) {
      fromRef.current = to;
      setDisplay(to);
      return undefined;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return display;
}
