# InspectaLine — Dashboard de monitoreo y control

Panel web para el sistema de inspeccion visual automatizado (banda transportadora +
Arduino + L298N + rele de iluminacion + servo de rechazo + deteccion con YOLOv8).
Se conecta a un backend Python (Flask o FastAPI) que habla con el Arduino por serial
y corre el modelo de vision.

**Stack**: React 18 + Vite + Tailwind CSS + Recharts + lucide-react + react-router-dom.
Se eligio React/Tailwind (no HTML/CSS/JS puro) porque el panel tiene bastante estado
compartido en tiempo real (estado del sistema, stats, eventos, detecciones) que varios
componentes necesitan leer y escribir a la vez — un Context de React evita pasar props
manualmente por todos los niveles y hace trivial que cualquier componente nuevo se
suscriba al mismo estado.

## 1. Puesta en marcha

```bash
npm install
cp .env.example .env   # ajustar las URLs del backend
npm run dev            # http://localhost:5173
```

Para revisar el diseno sin backend ni Arduino conectados, pon `VITE_USE_MOCK_DATA=true`
en `.env`: todas las paginas se llenan con datos de ejemplo (`src/data/mockData.js`) y
la app deja de intentar hablar con el backend.

```bash
npm run build     # build de produccion en dist/
npm run preview   # sirve el build de produccion localmente
npm run lint       # eslint
```

## 2. Variables de entorno (`.env`)

| Variable | Ejemplo | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base de todos los endpoints REST |
| `VITE_WS_URL` | `ws://localhost:8000/ws` | Canal WebSocket de estado/eventos/detecciones |
| `VITE_VIDEO_FEED_PATH` | `/api/video_feed` | Path del stream MJPEG (se concatena a `VITE_API_BASE_URL`) |
| `VITE_POLL_INTERVAL_MS` | `1500` | Intervalo de polling de respaldo si el WS no responde |
| `VITE_USE_MOCK_DATA` | `false` | `true` = usar datos de ejemplo, sin llamar al backend |

Ver `.env.example` para la plantilla completa.

## 3. Tiempo real: WebSocket + polling de respaldo — por que ambos

El dashboard **usa WebSocket como canal principal** (`src/lib/useWebSocket.js`,
consumido desde `src/context/SystemProvider.jsx`) porque el feed de detecciones y los
eventos de piezas procesadas llegan varias veces por segundo: con polling HTTP a ese
ritmo se desperdicia ancho de banda y CPU del backend (reconstruir la respuesta JSON
completa en cada tick) y se introduce latencia innecesaria entre el evento real y lo
que ve el operador.

Sin embargo, **el polling REST no se elimina, queda como respaldo**:

- Al montar la app siempre se hace una carga inicial por REST (`getStatus`, `getStats`,
  `getEvents`) para tener datos utiles de inmediato, sin esperar el primer mensaje WS.
- Si el WebSocket no logra conectar (backend sin soporte WS, proxy que lo bloquea,
  firewall de planta), el hook reintenta con backoff exponencial (1s, 2s, 4s... hasta
  15s) y mientras tanto el `SystemProvider` sigue haciendo polling cada
  `VITE_POLL_INTERVAL_MS` para que el panel no se quede congelado.
- Con el WS conectado, el polling sigue corriendo a 4x el intervalo normal, solo como
  red de seguridad por si se pierde algun mensaje.

Los **comandos de control** (`POST /api/control`) se mandan siempre por REST, nunca por
WS: son acciones puntuales que necesitan una respuesta clara de exito/error (por
ejemplo, si el Arduino no confirma el comando), algo que un mensaje WS "fire and
forget" no garantiza tan naturalmente como un request/response HTTP.

El **video** se sirve como `<img src=".../api/video_feed">` apuntando a un stream MJPEG
(`multipart/x-mixed-replace`), no por WebSocket ni como snapshots en base64: es el
patron mas simple y liviano de servir desde Flask/FastAPI + OpenCV, el navegador lo
decodifica de forma nativa (sin JS extra) y no compite por el mismo socket que el
estado/los eventos.

## 4. Contrato con el backend

### REST

| Metodo | Endpoint | Descripcion |
|---|---|---|
| `GET` | `/api/status` | `{ banda, luz, arduino, backend, serialPort, baudrate }` |
| `POST` | `/api/control` | body `{ command }`, `command` ∈ `START`, `STOP`, `LIGHT_ON`, `LIGHT_OFF`, `TEST_SERVO`, `RECONNECT_ARDUINO` |
| `GET` | `/api/stats` | `{ today: { inspected, rejected, rejectRate }, trend: [...], distribution: { ok, defectuosas } }` |
| `GET` | `/api/events?limit=50` | `[{ id, timestamp, result: "ok"\|"rejected", action, confidence, thumbnail }]` |
| `GET` | `/api/settings` | `{ pwmSpeed, confidenceThreshold, camera, cameras, serialPort, baudrate, ports, baudrates }` |
| `POST` | `/api/settings` | body: subconjunto de lo anterior a actualizar |
| `GET` | `/api/video_feed` | Stream MJPEG (`multipart/x-mixed-replace`) usado directo como `src` de un `<img>` |

`/api/settings` no estaba en la lista original del pedido pero es necesario para que
la pantalla de Configuracion (velocidad de banda, umbral de confianza, camara, puerto
serial/baudrate) lea y guarde valores reales; si el backend aun no lo expone, el panel
sigue funcionando igual con `VITE_USE_MOCK_DATA=true`.

### WebSocket (`VITE_WS_URL`)

Mensajes JSON con forma `{ "type": "...", "data": {...} }`:

```jsonc
{ "type": "status", "data": { "banda": "running", "luz": "on", "arduino": "connected" } }
{ "type": "stats", "data": { "today": { "inspected": 875, "rejected": 63, "rejectRate": 7.2 } } }
{ "type": "event", "data": { "id": "EVT-1042", "timestamp": "2026-08-23T19:04:00Z", "result": "ok", "action": "Sin accion", "confidence": 0.97, "thumbnail": null } }
{ "type": "detections", "data": { "frame_w": 1280, "frame_h": 720, "boxes": [
  { "x": 480, "y": 260, "w": 260, "h": 220, "label": "OK", "confidence": 0.97 },
  { "x": 860, "y": 340, "w": 190, "h": 170, "label": "defectuoso", "confidence": 0.89 }
] } }
```

`detections` es lo que dibuja las cajas sobre el feed de camara
(`src/components/overview/LiveFeed.jsx`): llegan aparte del video en vez de venir
"quemadas" en el frame por OpenCV, para que el color/tipografia de las cajas siga la
paleta del dashboard y no dependa de `cv2.rectangle`/`cv2.putText` en el backend.
`frame_w`/`frame_h` son el tamano del frame original que uso YOLOv8 (no el tamano en
pantalla) — el frontend escala las cajas al tamano real renderizado del `<img>`.

Si el backend todavia no tiene estos mensajes, el panel sigue funcionando con
polling REST puro (sin cajas de deteccion en vivo, ya que esas si dependen del WS).

## 5. Estructura del proyecto

```
src/
  main.jsx                  Entry point (Router + SystemProvider)
  App.jsx                   Rutas
  index.css                 Tokens Tailwind base + utilidades globales
  lib/
    api.js                  Cliente REST (fetch centralizado)
    useWebSocket.js          Hook de WebSocket con reconexion exponencial
  context/
    SystemProvider.jsx       Estado global: status, stats, events, settings, detections
  data/
    mockData.js               Datos de ejemplo (VITE_USE_MOCK_DATA=true)
  components/
    layout/
      Sidebar.jsx             Navegacion lateral
      AppShell.jsx             Layout comun (sidebar + banner + header + contenido)
      ConnectionBanner.jsx     Banner de advertencia (backend/Arduino desconectado)
    ui/
      Card.jsx, Badge.jsx, Button.jsx, Toggle.jsx, StatDot.jsx
    overview/
      KpiCards.jsx             KPIs: banda, luz, inspeccionadas, rechazadas
      LiveFeed.jsx              Stream MJPEG + overlay de cajas YOLOv8
      TrendChart.jsx            Linea: inspeccionadas vs. rechazadas
      DistributionChart.jsx    Dona: OK vs. defectuosas
      EventsTable.jsx           Tabla de eventos (reusada en Historial y Rechazadas)
    control/
      ControlPanel.jsx        Control manual + indicador de conexion serial
    settings/
      SettingsPanel.jsx        PWM, umbral de confianza, camara, puerto serial/baudrate
  pages/
    OverviewPage.jsx, HistoryPage.jsx, RejectedPage.jsx, SettingsPage.jsx, HelpPage.jsx
```

## 6. Guia de estilo aplicada

- Fondo `#FFFFFF` puro, paneles en gris calido muy suave (`#F7F7F4`), sin negros ni
  fondos oscuros en ningun componente (no hay modo oscuro implementado).
- Paleta: azul suave (`#4273B0`, marca / navegacion / accion primaria), teal apagado
  (`#006955`–`#3C8A76`, estados "conectado"/"bueno" puntuales) y beige
  (`#876114`/`#F7F2E7`, acentos neutros) — todo mate, sin brillos ni saturacion neon.
- El unico par usado para **identificar datos que aparecen lado a lado** (cajas de
  deteccion simultaneas, lineas del grafico de tendencia, dona OK/defectuosas, badges
  de la tabla de eventos) es **azul/coral**: es el unico par de la paleta que valida
  limpio contra daltonismo protanopia/deuteranopia (verificado con el validador de
  paletas de datavis del equipo, ΔE ≈ 15–24 en todos los checks). El teal se reservo
  para estados de un solo valor a la vez (punto de conexion, badge "En vivo") donde
  nunca compite visualmente junto a un elemento coral.
- Texto en gris oscuro (`#2B2E33`), nunca negro puro; los valores numericos de los KPIs
  se mantienen en ese mismo tono de texto — el color de identidad (OK/rechazo) lo
  llevan solo el badge/icono junto al numero, no el numero mismo.
- Tarjetas con esquina redondeada (`rounded-2xl`) y sombra sutil de dos capas
  (`shadow-card` en `tailwind.config.js`), nunca bordes duros ni sombras marcadas.
  Tipografia: IBM Plex Sans (texto) + IBM Plex Mono para cifras que cambian en vivo
  (`.tnum`, `font-variant-numeric: tabular-nums`), cargadas desde Google Fonts en
  `index.html`.

## 7. Responsive

- **Escritorio (≥1024px, `lg`)**: sidebar completo con etiquetas, grillas de 3–4
  columnas en KPIs y graficos — layout principal, el que se probo con mas detalle.
- **Tablet (640–1024px, `sm`–`lg`)**: sidebar colapsa a un riel de solo iconos, las
  grillas pasan a 1–2 columnas y las tarjetas se apilan verticalmente.
- Por debajo de `sm` el sidebar se oculta (no hay menu hamburguesa): el pedido original
  marca el escritorio como uso principal y la tablet como el limite de adaptacion
  razonable, asi que no se invirtio en un layout movil completo.

## 8. Como se ve cada seccion

Capturas tomadas en modo demo (`VITE_USE_MOCK_DATA=true`) a 1440px de ancho.

- **Resumen en vivo**: fila de 4 KPI cards (banda/luz con boton de accion inline,
  inspeccionadas y rechazadas con badge de porcentaje) → feed de camara con cajas de
  deteccion superpuestas + panel de control manual a la derecha → grafico de tendencia
  (linea) y dona de distribucion lado a lado → tabla de eventos recientes con miniatura,
  hora, badge de resultado, accion y confianza.
- **Historial de inspecciones**: 3 tarjetas resumen (eventos en pantalla, OK, % de
  rechazo acumulado) seguidas de la tabla completa de eventos con fecha y hora.
- **Piezas rechazadas**: 2 tarjetas resumen (rechazadas hoy, % de rechazo) y la misma
  tabla filtrada solo a `result: "rejected"`.
- **Configuracion**: 3 tarjetas — banda (slider PWM 0–255), modelo (slider de umbral de
  confianza 10–99% + selector de camara), conexion serial (selector de puerto y
  baudrate) — y un boton "Guardar configuracion" que hace `POST /api/settings`.
- **Ayuda**: 4 tarjetas de preguntas frecuentes (banda no arranca, luz no enciende,
  como probar el servo, como cambiar puerto/baudrate) mas una nota sobre el paro de
  emergencia fisico.
- **Banner de conexion**: franja superior color coral suave (nunca rojo saturado) que
  aparece automaticamente cuando el backend no responde o el Arduino esta
  desconectado; mientras tanto, todos los contadores y controles caen a un estado
  neutro seguro (ceros, "Sin senal de camara", "Sin conexion serial") en vez de mostrar
  datos obsoletos o romper la UI.

Todas las paginas y el banner se verificaron renderizando la app real con Playwright
(sin errores de consola) en tres estados: datos de ejemplo, ancho de tablet, y backend
inalcanzable.
