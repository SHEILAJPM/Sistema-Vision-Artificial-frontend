import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Images, PencilRuler, Trash2, TriangleAlert, FolderInput } from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { Card, CardHeader } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { StatCard } from "../components/ui/StatCard.jsx";
import { ImageDropzone } from "../components/inspect/ImageDropzone.jsx";
import {
  getDatasetImages,
  getDatasetStats,
  postDatasetImages,
  deleteDatasetImage,
  postExportYolo,
  datasetImageUrl,
  USE_MOCK_DATA,
} from "../lib/api.js";

const PAGE_SIZE = 24;

export default function DatasetPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [exportInfo, setExportInfo] = useState(null);

  const load = useCallback(async () => {
    if (USE_MOCK_DATA) return;
    try {
      const [imgRes, statsRes] = await Promise.all([
        getDatasetImages({ limit: PAGE_SIZE, offset }),
        getDatasetStats(),
      ]);
      setItems(imgRes.items);
      setTotal(imgRes.total);
      setStats(statsRes);
    } catch (err) {
      setError(err.message);
    }
  }, [offset]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (files) => {
    setUploading(true);
    setError(null);
    try {
      const res = await postDatasetImages(files, null);
      if (res.errores?.length) {
        setError(res.errores.map((e) => `${e.archivo}: ${e.error}`).join(" · "));
      }
      setOffset(0);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDatasetImage(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setExportInfo(null);
    try {
      setExportInfo(await postExportYolo());
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell title="Dataset" subtitle="Banco de imágenes para anotar y reentrenar el Modelo A (YOLO)">
      {USE_MOCK_DATA ? (
        <Card>
          <p className="text-sm text-ink-faint">El módulo de Dataset no está disponible en modo demo.</p>
        </Card>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon={Images} label="Imágenes" tone="idle">
                <p className="text-2xl font-semibold text-ink tnum">{stats.total_imagenes}</p>
              </StatCard>
              <StatCard icon={PencilRuler} label="Anotadas" tone="green">
                <p className="text-2xl font-semibold text-ink tnum">{stats.anotadas}</p>
              </StatCard>
              <StatCard icon={FolderInput} label="Pendientes" tone="gold">
                <p className="text-2xl font-semibold text-ink tnum">{stats.total_imagenes - stats.anotadas}</p>
              </StatCard>
            </div>
          )}

          <Card>
            <CardHeader
              icon={FolderInput}
              title="Subir imágenes"
              subtitle="Se guardan sin anotar -- ábrelas para dibujar las cajas"
              action={
                <Button variant="soft" size="sm" onClick={handleExport} disabled={exporting}>
                  {exporting ? "Exportando..." : "Exportar a formato YOLO"}
                </Button>
              }
            />
            <ImageDropzone onFiles={handleUpload} multiple hint={uploading ? "Subiendo..." : "Soporta JPG, PNG, WEBP (varias a la vez)"} />
            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-coral-100 bg-coral-50 px-3.5 py-2.5 text-xs text-coral-600">
                <TriangleAlert size={14} strokeWidth={2} className="shrink-0" />
                {error}
              </div>
            )}
            {exportInfo && (
              <div className="mt-3 rounded-lg border border-green-100 bg-green-50 px-3.5 py-2.5 text-xs text-green-700">
                Export listo en <span className="font-mono">{exportInfo.export_dir}</span> --{" "}
                {exportInfo.imagenes_train} train / {exportInfo.imagenes_val} val.
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Imágenes" subtitle={`${total} en total`} />
            {items.length === 0 ? (
              <p className="text-sm text-ink-faint">Todavía no subiste ninguna imagen.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {items.map((img) => (
                  <div key={img.id} className="group relative overflow-hidden rounded-lg ring-1 ring-inset ring-line">
                    <button
                      type="button"
                      onClick={() => navigate(`/dataset/${img.id}/anotar`)}
                      className="focus-ring block w-full"
                    >
                      <img src={datasetImageUrl(img.url)} alt="" className="aspect-square w-full object-cover" />
                    </button>
                    <div className="absolute left-1.5 top-1.5">
                      <Badge tone={img.annotated ? "ok" : "warn"} className="!px-1.5 !py-0.5 !text-[10px]">
                        {img.annotated ? "Anotada" : "Sin anotar"}
                      </Badge>
                    </div>
                    <button
                      type="button"
                      aria-label="Eliminar imagen"
                      onClick={() => handleDelete(img.id)}
                      className="focus-ring absolute right-1.5 top-1.5 hidden rounded-md bg-black/50 p-1 text-white group-hover:block hover:bg-coral-500"
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {total > PAGE_SIZE && (
              <div className="mt-4 flex items-center justify-between">
                <Button variant="soft" size="sm" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}>
                  Anterior
                </Button>
                <span className="text-xs text-ink-faint tnum">
                  {offset + 1}-{Math.min(offset + PAGE_SIZE, total)} de {total}
                </span>
                <Button variant="soft" size="sm" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset((o) => o + PAGE_SIZE)}>
                  Siguiente
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </AppShell>
  );
}
