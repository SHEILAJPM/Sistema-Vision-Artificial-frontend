import { useEffect, useRef, useState } from "react";
import { ScanSearch, TriangleAlert, CheckCircle2, XCircle, Gauge } from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { Card, CardHeader } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { StatCard } from "../components/ui/StatCard.jsx";
import { Slider } from "../components/ui/Slider.jsx";
import { ImageDropzone } from "../components/inspect/ImageDropzone.jsx";
import { DetectionOverlay } from "../components/inspect/DetectionOverlay.jsx";
import { JsonViewer } from "../components/inspect/JsonViewer.jsx";
import { postInspectImage, USE_MOCK_DATA } from "../lib/api.js";

export default function ManualInspectionPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [conf, setConf] = useState(0.35);
  const [iou, setIou] = useState(0.45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const objectUrlRef = useRef(null);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    []
  );

  const handleFiles = ([picked]) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(picked);
    objectUrlRef.current = url;
    setFile(picked);
    setPreviewUrl(url);
    setResult(null);
    setError(null);
  };

  const handleClear = () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const handleInspect = async () => {
    if (!file) return;
    if (USE_MOCK_DATA) {
      setError("La inspección manual no está disponible en modo demo.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setResult(await postInspectImage(file, { conf, iou }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const conteo = result?.conteo;

  return (
    <AppShell
      title="Inspección Manual"
      subtitle="Sube una imagen suelta y corre el modelo activo sin pasar por la banda transportadora"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader icon={ScanSearch} title="Imagen a inspeccionar" />
            {previewUrl ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl ring-1 ring-inset ring-line">
                  <img src={previewUrl} alt="Vista previa" className="w-full object-contain max-h-64" />
                </div>
                <Button variant="outline" size="sm" onClick={handleClear} className="w-full">
                  Elegir otra imagen
                </Button>
              </div>
            ) : (
              <ImageDropzone onFiles={handleFiles} hint="Soporta JPG, PNG, WEBP (un limón o un lote)" />
            )}
          </Card>

          <Card>
            <CardHeader icon={Gauge} title="Parámetros de inferencia" subtitle="Solo aplican al Modelo A (YOLO)" />
            <div className="space-y-4">
              <div>
                <p className="text-sm text-ink mb-1.5">
                  Umbral de confianza <span className="text-ink-faint">(conf)</span>
                </p>
                <Slider value={conf} onChange={setConf} min={0.05} max={0.95} step={0.01} format={(v) => `${Math.round(v * 100)}%`} />
              </div>
              <div>
                <p className="text-sm text-ink mb-1.5">
                  Supresión no máximos <span className="text-ink-faint">(IoU)</span>
                </p>
                <Slider value={iou} onChange={setIou} min={0.05} max={0.95} step={0.01} format={(v) => `${Math.round(v * 100)}%`} />
              </div>
            </div>
          </Card>

          <Button variant="primary" size="lg" className="w-full" disabled={!file || loading} onClick={handleInspect}>
            {loading ? "Inspeccionando..." : "Inspeccionar"}
          </Button>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-coral-100 bg-coral-50 px-3.5 py-2.5 text-xs text-coral-600">
              <TriangleAlert size={14} strokeWidth={2} className="shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {conteo && (
            <div className="grid grid-cols-3 gap-4">
              <StatCard icon={ScanSearch} label="Total" tone="idle">
                <p className="text-2xl font-semibold text-ink tnum">{conteo.total}</p>
              </StatCard>
              <StatCard icon={CheckCircle2} label="Sanos" tone="teal">
                <p className="text-2xl font-semibold text-ink tnum">{conteo.sanos}</p>
              </StatCard>
              <StatCard icon={XCircle} label="Defectuosos" tone="coral">
                <p className="text-2xl font-semibold text-ink tnum">{conteo.defectuosos}</p>
              </StatCard>
            </div>
          )}

          <Card>
            <CardHeader
              title="Visualizador de detección"
              subtitle={result ? `Latencia total: ${result.latencia_total_ms} ms` : "Sube una imagen para iniciar la inspección"}
            />
            <DetectionOverlay
              imageSrc={previewUrl}
              imageW={result?.image_w ?? 0}
              imageH={result?.image_h ?? 0}
              boxes={result?.cajas ?? []}
            />
          </Card>

          {result && <JsonViewer data={result} />}
        </div>
      </div>
    </AppShell>
  );
}
