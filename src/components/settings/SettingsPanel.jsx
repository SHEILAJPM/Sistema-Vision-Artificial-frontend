import { useEffect, useState } from "react";
import { Toast, ToastContainer, Placeholder } from "react-bootstrap";
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
        className="w-full accent-green-500"
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
      <div className="space-y-6">
        {[100, 85, 70].map((width, i) => (
          <Card key={i}>
            <Placeholder as="p" animation="glow" className="mb-4">
              <Placeholder xs={3} size="sm" style={{ borderRadius: 6 }} />
            </Placeholder>
            <Placeholder as="div" animation="glow">
              <Placeholder xs={width > 90 ? 12 : width > 75 ? 9 : 6} style={{ height: 14, borderRadius: 6 }} />
            </Placeholder>
          </Card>
        ))}
      </div>
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
      </div>

      {/* Sin la prop `position` de ToastContainer: internamente genera clases de
          posicionamiento de Bootstrap (position-fixed, bottom-0, end-0) que
          viven en helpers.scss -- justo el módulo que no se importa porque
          colisiona con las utilidades de Tailwind. Mismo resultado con estilo inline. */}
      <ToastContainer className="p-4" style={{ position: "fixed", bottom: 0, right: 0, zIndex: 1080 }}>
        <Toast onClose={() => setSaved(false)} show={saved} delay={2500} autohide>
          <Toast.Body className="flex items-center gap-2 text-teal-600">
            {/* Mismo anillo pulsante que el punto "en vivo" del último dato de
                TrendChart (animate-radar-ping) -- acá marca el momento puntual
                de "guardado", no un estado continuo, pero reusa el mismo
                vocabulario en vez de inventar una animación de éxito nueva. */}
            <span className="relative flex h-[15px] w-[15px] shrink-0 items-center justify-center">
              <Check size={15} strokeWidth={2.5} className="relative" />
              <span className="absolute inset-0 rounded-full bg-teal-500/40 animate-radar-ping" />
            </span>
            Configuración guardada
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
