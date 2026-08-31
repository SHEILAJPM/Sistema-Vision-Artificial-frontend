import { useEffect, useState, useCallback } from "react";
import { ProgressBar } from "react-bootstrap";
import { Cpu, Play, Rocket, Ban, TriangleAlert, CircleCheck } from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { Card, CardHeader } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { useSystem } from "../context/SystemProvider.jsx";
import { postTrainStart, getTrainRuns, postTrainCancel, postTrainPromote, USE_MOCK_DATA } from "../lib/api.js";

const TARGET_LABELS = {
  A: "Modelo A (YOLOv8, cajas)",
  B: "Modelo B (clasificador ResNet18)",
  D: "Modelo D (YOLOv12, cajas)",
  E: "Modelo E (YOLO26, cajas)",
  F: "Modelo F (clasificador MobileNetV3)",
};

const CLASSIFIER_TARGETS = ["B", "F"];

const STATUS_TONE = {
  queued: "neutral",
  running: "info",
  done: "ok",
  error: "rejected",
  cancelado: "warn",
};

const RUNS_POLL_MS = 5000;

export default function TrainingPage() {
  const { trainingProgress } = useSystem();
  const [target, setTarget] = useState("A");
  const [epochs, setEpochs] = useState(20);
  const [batchSize, setBatchSize] = useState(8);
  const [imgsz, setImgsz] = useState(320);
  const [allowMissing, setAllowMissing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [runs, setRuns] = useState([]);
  const [promotingId, setPromotingId] = useState(null);

  const loadRuns = useCallback(async () => {
    if (USE_MOCK_DATA) return;
    try {
      setRuns(await getTrainRuns(20));
    } catch {
      // el error de fondo no tapa el panel -- se ve reflejado si el usuario intenta iniciar un run
    }
  }, []);

  useEffect(() => {
    loadRuns();
    const id = setInterval(loadRuns, RUNS_POLL_MS);
    return () => clearInterval(id);
  }, [loadRuns]);

  // Cuando llega progreso en vivo por WS, refresca el historial más rápido
  // que el poll de 5s en vez de esperar al próximo ciclo.
  useEffect(() => {
    if (trainingProgress) loadRuns();
  }, [trainingProgress, loadRuns]);

  const activeRun = runs.find((r) => r.status === "running" || r.status === "queued");

  const handleStart = async () => {
    if (USE_MOCK_DATA) {
      setError("El entrenamiento no está disponible en modo demo.");
      return;
    }
    setStarting(true);
    setError(null);
    try {
      await postTrainStart({
        target,
        epochs,
        batch_size: batchSize,
        imgsz,
        allow_missing_classes: allowMissing,
      });
      await loadRuns();
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleCancel = async (id) => {
    await postTrainCancel(id);
    await loadRuns();
  };

  const handlePromote = async (id) => {
    setPromotingId(id);
    setError(null);
    try {
      await postTrainPromote(id);
      await loadRuns();
    } catch (err) {
      setError(err.message);
    } finally {
      setPromotingId(null);
    }
  };

  const liveForRun = (runId) => (trainingProgress?.run_id === runId ? trainingProgress : null);

  return (
    <AppShell title="Entrenamiento" subtitle="Reentrena cualquier modelo en background y promueve el resultado a producción">
      <Card>
        <CardHeader icon={Cpu} title="Nuevo entrenamiento" subtitle="Corre en un hilo aparte -- puedes seguir usando el dashboard" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="block text-xs text-ink-faint mb-1">Modelo objetivo</span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="focus-ring w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
            >
              <option value="A">Modelo A (YOLOv8, cajas)</option>
              <option value="B">Modelo B (clasificador ResNet18)</option>
              <option value="D">Modelo D (YOLOv12, cajas)</option>
              <option value="E">Modelo E (YOLO26, cajas)</option>
              <option value="F">Modelo F (clasificador MobileNetV3)</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-xs text-ink-faint mb-1">Épocas</span>
            <input
              type="number"
              min={1}
              max={300}
              value={epochs}
              onChange={(e) => setEpochs(Number(e.target.value))}
              className="focus-ring w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="text-sm">
            <span className="block text-xs text-ink-faint mb-1">Batch size</span>
            <input
              type="number"
              min={1}
              max={128}
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="focus-ring w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
            />
          </label>
          {!CLASSIFIER_TARGETS.includes(target) && (
            <label className="text-sm">
              <span className="block text-xs text-ink-faint mb-1">Tamaño de imagen (imgsz)</span>
              <input
                type="number"
                min={64}
                max={1280}
                step={32}
                value={imgsz}
                onChange={(e) => setImgsz(Number(e.target.value))}
                className="focus-ring w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
              />
            </label>
          )}
          {CLASSIFIER_TARGETS.includes(target) && (
            <label className="flex items-center gap-2 text-sm text-ink self-end pb-2">
              <input
                type="checkbox"
                checked={allowMissing}
                onChange={(e) => setAllowMissing(e.target.checked)}
                className="accent-green-500"
              />
              Entrenar aunque falten fotos de alguna clase
            </label>
          )}
        </div>

        <p className="mt-3 text-xs text-ink-faint">
          Sin GPU en este equipo: entrenar corre en CPU. Empieza con pocas épocas para validar el flujo antes de un
          entrenamiento largo.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <Button variant="primary" icon={Play} onClick={handleStart} disabled={starting || !!activeRun}>
            {starting ? "Iniciando..." : "Iniciar entrenamiento"}
          </Button>
          {activeRun && <span className="text-xs text-ink-faint">Ya hay un run activo (#{activeRun.id}) -- espera a que termine.</span>}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-coral-100 bg-coral-50 px-3.5 py-2.5 text-xs text-coral-600">
            <TriangleAlert size={14} strokeWidth={2} className="shrink-0" />
            {error}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Historial de entrenamientos" subtitle="Más reciente primero" />
        {runs.length === 0 ? (
          <p className="text-sm text-ink-faint">Todavía no corriste ningún entrenamiento.</p>
        ) : (
          <ul className="space-y-3">
            {runs.map((run) => {
              const live = liveForRun(run.id);
              const epoch = live?.epoch ?? run.epoch_actual;
              const epochTotal = live?.epoch_total ?? run.epoch_total;
              const progressPct = epochTotal ? Math.round((epoch / epochTotal) * 100) : 0;
              const isRunning = run.status === "running" || run.status === "queued";

              return (
                <li key={run.id} className="rounded-lg border border-line bg-canvas px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-ink">
                        Run #{run.id} -- {TARGET_LABELS[run.target] ?? run.target}
                      </span>
                      <Badge tone={STATUS_TONE[run.status] ?? "neutral"}>{run.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {isRunning && (
                        <Button variant="outline" size="sm" icon={Ban} onClick={() => handleCancel(run.id)}>
                          Cancelar
                        </Button>
                      )}
                      {run.status === "done" && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Rocket}
                          onClick={() => handlePromote(run.id)}
                          disabled={promotingId === run.id}
                        >
                          {promotingId === run.id ? "Promoviendo..." : "Promover a producción"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isRunning && (
                    <div className="mt-2.5">
                      <ProgressBar now={progressPct} label={`${progressPct}%`} className="!h-2" />
                      <p className="mt-1 text-xs text-ink-faint tnum">
                        Época {epoch}/{epochTotal || "?"}
                        {live?.loss != null && ` · loss=${live.loss.toFixed(4)}`}
                      </p>
                    </div>
                  )}

                  {run.status === "done" && (
                    <p className="mt-1.5 text-xs text-ink-faint">
                      {run.metrics?.best_val_acc != null && `val_acc=${(run.metrics.best_val_acc * 100).toFixed(1)}% · `}
                      {run.metrics?.["metrics/mAP50(B)"] != null && `mAP50=${(run.metrics["metrics/mAP50(B)"] * 100).toFixed(1)}% · `}
                      checkpoint listo para promover
                    </p>
                  )}

                  {run.status === "error" && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-coral-600">
                      <TriangleAlert size={12} strokeWidth={2} className="shrink-0" />
                      {run.error_message}
                    </p>
                  )}

                  {run.status === "done" && promotingId !== run.id && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-faint">
                      <CircleCheck size={12} strokeWidth={2} className="shrink-0" />
                      No reemplaza el modelo en producción hasta que lo promuevas.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
