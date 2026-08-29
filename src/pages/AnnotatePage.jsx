import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, TriangleAlert, Check } from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { Card, CardHeader } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { AnnotationCanvas } from "../components/dataset/AnnotationCanvas.jsx";
import { getDatasetImage, getDatasetClasses, getAnnotations, putAnnotations, datasetImageUrl } from "../lib/api.js";

export default function AnnotatePage() {
  const { imageId } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [classes, setClasses] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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
        setBoxes(ann.boxes);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [imageId]);

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
