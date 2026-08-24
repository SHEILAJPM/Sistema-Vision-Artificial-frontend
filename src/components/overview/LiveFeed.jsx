import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CameraOff, Radio } from "lucide-react";
import { Card, CardHeader } from "../ui/Card.jsx";
import { Badge } from "../ui/Badge.jsx";
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
export function LiveFeed() {
  const { detections, status } = useSystem();
  const containerRef = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [feedOk, setFeedOk] = useState(true);

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

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5">
        <CardHeader title="Zona de inspección" subtitle="Stream en vivo con detección YOLOv8" />
        <div className="flex items-center gap-2 -mt-4">
          <Badge tone={status?.banda === "running" ? "info" : "neutral"}>
            <Radio size={12} strokeWidth={2.5} />
            {status?.banda === "running" ? "En vivo" : "En espera"}
          </Badge>
        </div>
      </div>

      <div ref={containerRef} className="relative mx-5 mb-5 mt-1 aspect-video overflow-hidden rounded-xl bg-ink">
        {feedOk ? (
          <img
            src={USE_MOCK_DATA ? undefined : videoFeedUrl()}
            alt="Stream de cámara de inspección"
            className="h-full w-full object-cover"
            onError={() => setFeedOk(false)}
            style={USE_MOCK_DATA ? { display: "none" } : undefined}
          />
        ) : null}

        {(USE_MOCK_DATA || !feedOk) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-panel-alt text-ink-faint">
            <CameraOff size={22} strokeWidth={1.5} />
            <p className="text-xs">
              {USE_MOCK_DATA ? "Vista previa (datos de ejemplo)" : "Sin señal de cámara"}
            </p>
          </div>
        )}

        {/* Overlay de cajas de detección, escalado al tamaño renderizado */}
        {scaleX > 0 && scaleY > 0 && (USE_MOCK_DATA || feedOk) && (
          <div className="absolute inset-0">
            <AnimatePresence>
              {detections.boxes.map((det, i) => {
                // Azul/coral: el único par de identidad validado para daltonismo,
                // por eso lo usamos aquí aunque haya varios limones en pantalla
                // a la vez (nunca teal junto a coral, ver notas de paleta).
                const isDefect = det.label?.toLowerCase().includes("defect");
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
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
                      className={`absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium text-white ${
                        isDefect ? "bg-coral-500" : "bg-blue-400"
                      }`}
                    >
                      {isDefect ? "Defectuoso" : "OK"} · {Math.round((det.confidence ?? 0) * 100)}%
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Card>
  );
}
