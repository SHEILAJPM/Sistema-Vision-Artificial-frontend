import { useEffect, useState } from "react";
import { Check, Gauge, ScanEye as ScanIcon, Cable } from "lucide-react";
import { Card, CardHeader } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { useSystem } from "../../context/SystemProvider.jsx";

function Field({ label, hint, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-2 md:gap-6 py-4 border-b border-line last:border-0">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint && <p className="text-xs text-ink-faint mt-0.5">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Slider({ value, onChange, min, max, step, format }) {
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
      <span className="w-16 shrink-0 text-right text-sm font-medium text-ink tnum">{format(value)}</span>
    </div>
  );
}

const selectClass =
  "focus-ring w-full max-w-xs rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink";

export function SettingsPanel() {
  const { settings, saveSettings } = useSystem();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (!form) {
    return (
      <Card>
        <p className="text-sm text-ink-faint">Cargando configuración del backend...</p>
      </Card>
    );
  }

  const update = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const handleSave = async () => {
    const res = await saveSettings(form);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader icon={Gauge} title="Banda transportadora" subtitle="Velocidad enviada al L298N via PWM" />
        <Field label="Velocidad de la banda" hint="Duty cycle PWM enviado al driver L298N">
          <Slider
            value={form.pwmSpeed}
            onChange={(v) => update({ pwmSpeed: v })}
            min={0}
            max={255}
            step={1}
            format={(v) => `${v} / 255`}
          />
        </Field>
      </Card>

      <Card>
        <CardHeader icon={ScanIcon} title="Modelo de inspección" subtitle="YOLOv8 y selección de cámara" />
        <Field
          label="Umbral de confianza"
          hint="Confianza mínima para marcar un limón como defectuoso"
        >
          <Slider
            value={form.confidenceThreshold}
            onChange={(v) => update({ confidenceThreshold: v })}
            min={0.1}
            max={0.99}
            step={0.01}
            format={(v) => `${Math.round(v * 100)}%`}
          />
        </Field>
        <Field label="Cámara" hint="Fuente de video usada para la inspección">
          <select
            className={selectClass}
            value={form.camera}
            onChange={(e) => update({ camera: e.target.value })}
          >
            {form.cameras?.map((cam) => (
              <option key={cam.id} value={cam.id}>
                {cam.label}
              </option>
            ))}
          </select>
        </Field>
      </Card>

      <Card>
        <CardHeader icon={Cable} title="Conexión serial" subtitle="Puerto y velocidad de comunicación con el Arduino" />
        <Field label="Puerto serial">
          <select
            className={selectClass}
            value={form.serialPort}
            onChange={(e) => update({ serialPort: e.target.value })}
          >
            {form.ports?.map((port) => (
              <option key={port} value={port}>
                {port}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Baudrate">
          <select
            className={selectClass}
            value={form.baudrate}
            onChange={(e) => update({ baudrate: Number(e.target.value) })}
          >
            {form.baudrates?.map((rate) => (
              <option key={rate} value={rate}>
                {rate}
              </option>
            ))}
          </select>
        </Field>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="primary" icon={Check} onClick={handleSave}>
          Guardar configuración
        </Button>
        {saved && <span className="text-xs text-teal-600">Configuración guardada</span>}
      </div>
    </div>
  );
}
