import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, TriangleAlert, Check, Tag } from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { Card, CardHeader } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { AnnotationCanvas } from "../components/dataset/AnnotationCanvas.jsx";
import {
  getDatasetImage,
  getDatasetClasses,
  getAnnotations,
  putAnnotations,
  putImageClass,
  datasetImageUrl,
} from "../lib/api.js";

export default function AnnotatePage() {
  const { imageId } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [classes, setClasses] = useState([]);
  const [wholeImageClasses, setWholeImageClasses] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getDatasetImage(imageId), getDatasetClasses(), getAnnotations(imageId)])
      .then(([img, cls, ann]) => {
        if (cancelled) return;
        setImage(img);
        setClasses(cls.clases);
        setWholeImageClasses(cls.clases_imagen_completa ?? []);
        setBoxes(ann.boxes);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [imageId]);

  const handleClassify = async (classLabel) => {
    setClassifying(true);
    setError(null);
    try {
      setImage(await putImageClass(imageId, classLabel));
    } catch (err) {
      setError(err.message);
    } finally {
      setClassifying(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = boxes.map(({ class_label, x1, y1, x2, y2 }) => ({ class_label, x1, y1, x2, y2 }));
      const res = await putAnnotations(imageId, payload);
      setBoxes(res.boxes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Anotación"
      subtitle="Dibuja cajas delimitadoras y asigna una clase a cada una"
      headerRight={
        <Button variant="soft" size="sm" icon={ArrowLeft} onClick={() => navigate("/dataset")}>
          Volver al dataset
        </Button>
      }
    >
      {!loading && image && (
        <Card>
          <CardHeader
            icon={Tag}
            title="Clasificación de imagen completa"
            subtitle="Para el Modelo B (clasificador) -- independiente de las cajas de abajo, que son para el Modelo A"
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={image.class_label ?? ""}
              onChange={(e) => e.target.value && handleClassify(e.target.value)}
              disabled={classifying}
              className="focus-ring rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
            >
              <option value="" disabled>
                Sin clasificar
              </option>
              {wholeImageClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {classifying && <span className="text-xs text-ink-faint">Guardando...</span>}
          </div>
        </Card>
      )}

      <Card>
        {loading ? (
          <p className="text-sm text-ink-faint">Cargando imagen...</p>
        ) : !image ? (
          <p className="text-sm text-ink-faint">No se encontró la imagen.</p>
        ) : (
          <>
            <CardHeader
              title={`Imagen #${image.id}`}
              subtitle={`${image.width}×${image.height}px · clases: ${classes.join(", ")}`}
              action={
                <Button variant="primary" size="sm" icon={Save} onClick={handleSave} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar anotaciones"}
                </Button>
              }
            />
            <AnnotationCanvas
              imageUrl={datasetImageUrl(image.url)}
              imageW={image.width}
              imageH={image.height}
              classes={classes}
              boxes={boxes}
              onChange={setBoxes}
            />
          </>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-coral-100 bg-coral-50 px-3.5 py-2.5 text-xs text-coral-600">
            <TriangleAlert size={14} strokeWidth={2} className="shrink-0" />
            {error}
          </div>
        )}
        {saved && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3.5 py-2.5 text-xs text-green-700">
            <Check size={14} strokeWidth={2} className="shrink-0" />
            Anotaciones guardadas
          </div>
        )}
      </Card>
    </AppShell>
  );
}
