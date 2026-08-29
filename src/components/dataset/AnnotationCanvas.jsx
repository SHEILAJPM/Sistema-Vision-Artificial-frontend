import { useRef, useState } from "react";
import PropTypes from "prop-types";
import { Trash2, Eraser } from "lucide-react";
import { Button } from "../ui/Button.jsx";

const DEFECT_CLASSES = new Set(["mancha", "deformacion", "color_irregular", "podrido"]);
let nextTempId = 1;

// Editor de cajas delimitadoras a mano (mini-CVAT): click-arrastra dibuja
// una caja nueva, click en una caja existente la selecciona, el tacho la
// borra. Sin mover/redimensionar cajas ya puestas -- para ese caso es más
// simple borrar y volver a dibujar que mantener handles de resize, y
// mantiene este componente chico. Coordenadas en % del contenedor (mismo
// truco que DetectionOverlay.jsx): el contenedor fija su aspect-ratio al de
// la imagen real, así el % coincide con píxeles de imagen sin medir nada.
export function AnnotationCanvas({ imageUrl, imageW, imageH, classes, boxes, onChange }) {
  const containerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(null); // {x1,y1,x2,y2} en px de imagen, mientras se arrastra

  const clientToImagePx = (clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    return { x: Math.round(px * imageW), y: Math.round(py * imageH) };
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    const start = clientToImagePx(e.clientX, e.clientY);
    setSelected(null);
    setDraft({ x1: start.x, y1: start.y, x2: start.x, y2: start.y });

    const handleMove = (moveEvt) => {
      const cur = clientToImagePx(moveEvt.clientX, moveEvt.clientY);
      setDraft((prev) => (prev ? { ...prev, x2: cur.x, y2: cur.y } : prev));
    };
    const handleUp = (upEvt) => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      const end = clientToImagePx(upEvt.clientX, upEvt.clientY);
      const box = {
        x1: Math.min(start.x, end.x),
        y1: Math.min(start.y, end.y),
        x2: Math.max(start.x, end.x),
        y2: Math.max(start.y, end.y),
      };
      setDraft(null);
      // Descarta trazos accidentales (click sin arrastrar): mínimo ~1% del
      // lado más chico de la imagen.
      const minSize = Math.min(imageW, imageH) * 0.01;
      if (box.x2 - box.x1 < minSize || box.y2 - box.y1 < minSize) return;
      const newBox = { tempId: nextTempId++, class_label: classes[0], ...box };
      onChange([...boxes, newBox]);
      setSelected(boxes.length);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  const updateBox = (index, patch) => {
    onChange(boxes.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };

  const removeBox = (index) => {
    onChange(boxes.filter((_, i) => i !== index));
    if (selected === index) setSelected(null);
  };

  const pct = (v, total) => `${(v / total) * 100}%`;

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className="relative w-full select-none overflow-hidden rounded-xl bg-panel-alt ring-1 ring-inset ring-line cursor-crosshair"
        style={{ aspectRatio: imageW && imageH ? `${imageW} / ${imageH}` : "4 / 3" }}
      >
        {imageUrl && (
          <img src={imageUrl} alt="Imagen a anotar" draggable={false} className="pointer-events-none h-full w-full object-contain" />
        )}

        {boxes.map((box, i) => {
          const isDefect = DEFECT_CLASSES.has(box.class_label);
          const isSelected = selected === i;
          return (
            <div
              key={box.id ?? box.tempId}
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelected(i);
              }}
              className={`absolute rounded-md border-2 ${isDefect ? "border-coral-500" : "border-blue-400"} ${
                isSelected ? "ring-2 ring-offset-1 ring-gold-500" : ""
              }`}
              style={{
                left: pct(box.x1, imageW),
                top: pct(box.y1, imageH),
                width: pct(box.x2 - box.x1, imageW),
                height: pct(box.y2 - box.y1, imageH),
              }}
            >
              <span
                className={`absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium text-white ${
                  isDefect ? "bg-coral-500" : "bg-blue-400"
                }`}
              >
                {box.class_label}
              </span>
            </div>
          );
        })}

        {draft && (
          <div
            className="absolute rounded-md border-2 border-dashed border-green-500 bg-green-500/10"
            style={{
              left: pct(Math.min(draft.x1, draft.x2), imageW),
              top: pct(Math.min(draft.y1, draft.y2), imageH),
              width: pct(Math.abs(draft.x2 - draft.x1), imageW),
              height: pct(Math.abs(draft.y2 - draft.y1), imageH),
            }}
          />
        )}
      </div>

      {boxes.length === 0 ? (
        <p className="text-sm text-ink-faint">Dibuja una caja arrastrando sobre la imagen.</p>
      ) : (
        <ul className="space-y-2">
          {boxes.map((box, i) => (
            <li
              key={box.id ?? box.tempId}
              onMouseEnter={() => setSelected(i)}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                selected === i ? "border-gold-300 bg-gold-50" : "border-line bg-canvas"
              }`}
            >
              <select
                value={box.class_label}
                onChange={(e) => updateBox(i, { class_label: e.target.value })}
                className="focus-ring flex-1 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-sm text-ink"
              >
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="text-xs text-ink-faint tnum">
                {box.x1},{box.y1} → {box.x2},{box.y2}
              </span>
              <Button variant="danger" size="sm" icon={Trash2} aria-label="Eliminar caja" onClick={() => removeBox(i)} />
            </li>
          ))}
        </ul>
      )}

      {boxes.length > 0 && (
        <Button variant="outline" size="sm" icon={Eraser} onClick={() => onChange([])}>
          Borrar todas las cajas
        </Button>
      )}
    </div>
  );
}

AnnotationCanvas.propTypes = {
  imageUrl: PropTypes.string,
  imageW: PropTypes.number.isRequired,
  imageH: PropTypes.number.isRequired,
  classes: PropTypes.arrayOf(PropTypes.string).isRequired,
  boxes: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
};
