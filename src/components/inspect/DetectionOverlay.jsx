import PropTypes from "prop-types";

// Imagen + cajas de detección superpuestas, en porcentaje del tamaño de la
// imagen original -- igual idea que LiveFeed.jsx pero sin ResizeObserver:
// el contenedor fija su aspect-ratio al de la imagen real (evita el
// letterboxing de object-contain), así el % de cada caja coincide sin
// medir píxeles en pantalla.
export function DetectionOverlay({ imageSrc, imageW, imageH, boxes = [] }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-panel-alt ring-1 ring-inset ring-line"
      style={{ aspectRatio: imageW && imageH ? `${imageW} / ${imageH}` : "4 / 3" }}
    >
      {imageSrc && <img src={imageSrc} alt="Imagen inspeccionada" className="h-full w-full object-contain" />}
      {imageW > 0 &&
        imageH > 0 &&
        boxes.map((box, i) => {
          // Modelos A/B etiquetan con el defecto especifico (mancha,
          // deformacion, ...); el heuristico C usa la clase gruesa
          // "DEFECTUOSO" -- reconocer ambas formas, ver mismo criterio en
          // app/api/inspect_routes.py.
          const label = (box.etiqueta ?? "").toLowerCase();
          const isDefect = ["mancha", "deformacion", "color_irregular", "podrido", "defectuoso"].includes(label);
          return (
            <div
              key={i}
              className={`absolute rounded-md border-2 ${isDefect ? "border-coral-500" : "border-blue-400"}`}
              style={{
                left: `${(box.x / imageW) * 100}%`,
                top: `${(box.y / imageH) * 100}%`,
                width: `${(box.w / imageW) * 100}%`,
                height: `${(box.h / imageH) * 100}%`,
              }}
            >
              <span
                className={`absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium text-white ${
                  isDefect ? "bg-coral-500" : "bg-blue-400"
                }`}
              >
                {box.etiqueta} · {Math.round((box.confianza ?? 0) * 100)}%
              </span>
            </div>
          );
        })}
    </div>
  );
}

DetectionOverlay.propTypes = {
  imageSrc: PropTypes.string,
  imageW: PropTypes.number,
  imageH: PropTypes.number,
  boxes: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      w: PropTypes.number,
      h: PropTypes.number,
      etiqueta: PropTypes.string,
      confianza: PropTypes.number,
    })
  ),
};
