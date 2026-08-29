import { useId, useMemo } from "react";
import PropTypes from "prop-types";

// Reemplaza el sparkline de barras de las tarjetas hero por una línea que
// sugiere flujo de datos en tiempo real: se dibuja al montar (stroke-dashoffset
// vía --line-length, ver @keyframes draw-line en index.css -- el largo real
// del trazo es dinámico según los datos, así que no puede ir por className)
// y el último punto respira + pulsa en vivo (mismo patrón que la LiveDot de
// TrendChart), para que la tarjeta siga "viva" mucho después del primer
// render, no solo en el instante en que aparece.
export function MiniTrendLine({ data, color, height = 40 }) {
  const gradientId = useId();
  const width = 100;

  const { linePath, areaPath, lastPoint, length } = useMemo(() => {
    if (!data.length) return { linePath: "", areaPath: "", lastPoint: null, length: 0 };
    const max = Math.max(1, ...data);
    const min = Math.min(0, ...data);
    const range = Math.max(1, max - min);
    const stepX = data.length > 1 ? width / (data.length - 1) : 0;
    const points = data.map((v, i) => ({
      x: i * stepX,
      y: height - ((v - min) / range) * (height - 6) - 3,
    }));
    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
    const area = `${line} L${points[points.length - 1].x.toFixed(2)},${height} L0,${height} Z`;
    // Aproximación suficiente para el dashoffset -- no hace falta la
    // longitud exacta del path, solo que sea mayor o igual a ella.
    const approxLength = points.reduce((acc, p, i) => {
      if (i === 0) return 0;
      const prev = points[i - 1];
      return acc + Math.hypot(p.x - prev.x, p.y - prev.y);
    }, 0);
    return { linePath: line, areaPath: area, lastPoint: points[points.length - 1], length: Math.ceil(approxLength) + 4 };
  }, [data, height]);

  if (!linePath) return null;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          "--line-length": length,
          strokeDasharray: length,
          animation: `draw-line 0.9s cubic-bezier(0.23,1,0.32,1) both, breathe 3.2s ease-in-out 0.9s infinite`,
        }}
      />
      {lastPoint && (
        <g>
          <circle cx={lastPoint.x} cy={lastPoint.y} r="2.2" fill={color} stroke="white" strokeWidth="1" />
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="2.2"
            fill={color}
            opacity={0.55}
            className="animate-radar-ping"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        </g>
      )}
    </svg>
  );
}

MiniTrendLine.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number).isRequired,
  color: PropTypes.string.isRequired,
  height: PropTypes.number,
};
