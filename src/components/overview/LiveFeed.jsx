import { useEffect, useRef, useState } from "react";
import { CameraOff, Radio } from "lucide-react";
import { Card, CardHeader } from "../ui/Card.jsx";
import { Badge } from "../ui/Badge.jsx";
import { ViewfinderCorners } from "../ui/ViewfinderCorners.jsx";
import { useSystem } from "../../context/SystemProvider.jsx";
import { videoFeedUrl, USE_MOCK_DATA } from "../../lib/api.js";

// Feed de la cámara con overlay de cajas YOLOv8 dibujado en el cliente.
//
// El backend expone el stream MJPEG ya listo (endpoint /api/video_feed via
// <img>), que es el método más simple y liviano para OpenCV + Flask/FastAPI.
// Las cajas de detección, en cambio, llegan aparte por WebSocket (mensajes
// {type:"detections", data:{boxes,frame_w,frame_h}}) y se dibujan con divs
// posicionados sobre el video: asi el estilo de las cajas/etiquetas sigue la
// paleta del dashboard en vez de quedar "quemado" en el frame por OpenCV.
// Modelo B (ResNet18) clasifica el frame completo, no localiza limones
// individuales: no tiene sentido pedirle cajas, así que el subtítulo y el
// mensaje del overlay siguen a `seleccion_activa` en vez de asumir YOLOv8.
const MODEL_COPY = {
  A: "Stream en vivo con detección YOLOv8",
  B: "Stream en vivo con clasificación ResNet18 (sin localización)",
  ambos: "Comparando YOLOv8 (A) y ResNet18 (B) en paralelo",
};

export function LiveFeed() {
  const { detections, status, modelStatus } = useSystem();
  const containerRef = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [feedOk, setFeedOk] = useState(true);

  const activeModel = modelStatus?.seleccion_activa;
  const subtitle = modelStatus?.modo_respaldo_heuristico
    ? "Stream en vivo con heurístico de respaldo (sin modelo entrenado)"
    : MODEL_COPY[activeModel] ?? "Stream en vivo de la zona de inspección";
  const showsBoxes = activeModel !== "B";
  // Separados a propósito: en modo mock las cajas de ejemplo SÍ se dibujan
  // sobre la grilla (hay algo que mirar), así que la retícula grande centrada
  // quedaba tapando justo el hueco entre las dos cajas -- un elemento
  // flotante compitiendo con el dato en vez de reforzarlo. La retícula
  // completa queda reservada para cuando de verdad no hay nada que mostrar
  // (cámara real caída, sin cajas posibles); el modo demo se avisa con una
  // franja chica abajo, igual que el aviso de "Modelo B sin cajas".
  const noRealSignal = !USE_MOCK_DATA && !feedOk;
  const isPlaceholder = USE_MOCK_DATA || !feedOk;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setBox({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scaleX = detections.frame_w ? box.w / detections.frame_w : 0;
  const scaleY = detections.frame_h ? box.h / detections.frame_h : 0;
  const resLabel = detections.frame_w && detections.frame_h ? `${detections.frame_w}×${detections.frame_h}` : "—";
  const modelLabel = modelStatus?.modo_respaldo_heuristico
    ? "HEURÍSTICO"
    : activeModel === "ambos"
    ? "A + B"
    : activeModel
    ? `MODELO ${activeModel}`
    : "—";

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5">
        <CardHeader title="Zona de inspección" subtitle={subtitle} />
        <div className="flex items-center gap-2 -mt-4">
          <Badge tone={status?.banda === "running" ? "info" : "neutral"}>
            <Radio size={12} strokeWidth={2.5} />
            {status?.banda === "running" ? "En vivo" : "En espera"}
          </Badge>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative mx-5 mb-5 mt-1 aspect-video overflow-hidden rounded-xl bg-gradient-to-b from-[#16241A] to-[#0B140D] ring-1 ring-inset ring-white/10"
        style={{
          // Grilla tipo instrumento de visión nocturna en vez de un fondo
          // liso -- el tinte verde (no gris/azul neutro) ata la "pantalla"
          // al resto de la paleta agri-tech aunque siga siendo la única
          // superficie oscura del panel.
          backgroundImage:
            "linear-gradient(rgba(111,160,107,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(111,160,107,0.14) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        {feedOk ? (
          <img
            src={USE_MOCK_DATA ? undefined : videoFeedUrl()}
            alt="Stream de cámara de inspección"
            className="h-full w-full object-cover"
            onError={() => setFeedOk(false)}
            style={USE_MOCK_DATA ? { display: "none" } : undefined}
          />
        ) : null}

        {noRealSignal && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-hidden text-white/70">
            {/* Línea de escaneo: la zona "sin señal" es el área más grande de la
                pantalla -- en vez de dejarla plana, hace un guiño al propósito
                real del sistema (inspección visual) sin depender de una cámara real. */}
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_10px_2px_rgba(111,160,107,0.5)] animate-scan" />

            {/* Retícula central tipo mira de cámara, en vez de un ícono suelto */}
            <div className="relative flex h-16 w-16 items-center justify-center">
              <span className="absolute h-16 w-16 rounded-full border border-white/15" />
              <span className="absolute h-9 w-9 rounded-full border border-white/25" />
              <span className="absolute h-16 w-px bg-white/10" />
              <span className="absolute w-16 h-px bg-white/10" />
              <CameraOff size={18} strokeWidth={1.5} className="relative text-white/70" />
            </div>
            <p className="relative text-xs tracking-wide">Sin señal de cámara</p>
          </div>
        )}

        {/* Modo demo: hay cajas de ejemplo dibujadas sobre la grilla, así que
            alcanza con una franja chica -- la retícula grande de arriba
            quedaría flotando justo entre las cajas. */}
        {USE_MOCK_DATA && (
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-[11px] tracking-wide text-white/70 backdrop-blur-sm">
            Vista previa (datos de ejemplo)
          </div>
        )}

        {/* La línea de escaneo es la única señal "en vivo" de esta zona --
            las esquinas quedan fijas (hallazgo P0 de /impeccable critique:
            una señal por zona, no varias apiladas). */}
        <ViewfinderCorners tone="green" />

        {/* Lectura técnica tipo HUD -- resolución del frame y modelo activo,
            monoespaciado para que se lea como instrumento, no como copy de UI.
            El punto de modelo activo NO pulsa (antes tenia animate-pulse-soft):
            corria en paralelo con la línea de escaneo de arriba, dos señales
            ambiente en la misma zona a la vez, justo lo que dice el comentario
            de arriba que no iba a pasar (hallazgo P1 de /impeccable critique). */}
        <div className="pointer-events-none absolute left-3 bottom-3 rounded bg-black/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/70 backdrop-blur-sm">
          {resLabel}px
        </div>
        <div className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 rounded bg-black/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/70 backdrop-blur-sm">
          <span className={`h-1.5 w-1.5 rounded-full ${status?.banda === "running" ? "bg-green-400" : "bg-white/30"}`} />
          {modelLabel}
        </div>

        {!showsBoxes && !isPlaceholder && (
          <div className="absolute bottom-10 left-3 right-3 rounded-lg bg-ink/70 px-3 py-2 text-center text-xs text-white">
            Modelo B clasifica el frame completo — sin cajas de localización individuales
          </div>
        )}

        {/* Overlay de cajas de detección, escalado al tamaño renderizado */}
        {showsBoxes && scaleX > 0 && scaleY > 0 && (USE_MOCK_DATA || feedOk) && (
          <div className="absolute inset-0">
            {detections.boxes.map((det, i) => {
              // Azul/coral: el único par de identidad validado para daltonismo,
              // por eso lo usamos aquí aunque haya varios limones en pantalla
              // a la vez (nunca teal junto a coral, ver notas de paleta).
              const isDefect = det.label?.toLowerCase().includes("defect");
              return (
                <div
                  key={i}
                  className={`absolute rounded-md border-2 ${
                    isDefect ? "border-coral-500" : "border-blue-400"
                  }`}
                  style={{
                    left: det.x * scaleX,
                    top: det.y * scaleY,
                    width: det.w * scaleX,
                    height: det.h * scaleY,
                  }}
                >
                  <span
                    className={`absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium text-white ${
                      isDefect ? "bg-coral-500" : "bg-blue-400"
                    }`}
                  >
                    {isDefect ? "Defectuoso" : "OK"} · {Math.round((det.confidence ?? 0) * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
