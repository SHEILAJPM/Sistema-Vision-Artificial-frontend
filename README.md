# InspectaLine — Dashboard de monitoreo y control

Panel web para un sistema de control de calidad de limones por vision artificial
(banda transportadora + Arduino + L298N + rele de iluminacion + servo de rechazo +
deteccion de defectos con YOLOv8, con opcion de comparar contra un segundo modelo
clasificador). Se conecta a un backend Python (Flask o FastAPI) que habla con el
Arduino por serial y corre los modelos de vision.

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

## 3. Autenticacion

Toda la app (menos `/login`) esta detras de un login (`src/context/AuthProvider.jsx`):

- Al enviar el formulario se llama `POST /api/auth/login` con `{ username, password }`;
  el backend responde `{ token, user: { name, role } }`. El token se guarda en
  `localStorage` (`inspectaline_token`) y se manda como `Authorization: Bearer <token>`
  en cada request REST (`src/lib/api.js`).
- El WebSocket no soporta headers custom desde el navegador, asi que el mismo token va
  como query param: `VITE_WS_URL?token=...` — el backend debe leerlo de ahi.
- Al recargar la pagina, si hay un token guardado se valida con `GET /api/auth/me` antes
  de mostrar el dashboard (pantalla de "Verificando sesion..." mientras tanto). Si el
  token ya no es valido, se limpia y se manda a `/login`.
- Si **cualquier** request REST responde `401` a mitad de sesion (token vencido o
  revocado), se cierra sesion automaticamente y se vuelve a `/login` — no hay que
  esperar a la siguiente recarga para notarlo.
- Rutas protegidas: `src/components/auth/RequireAuth.jsx` es una layout route que
  redirige a `/login` si no hay sesion, recordando la pagina de origen para volver ahi
  despues de iniciar sesion. `SystemProvider` (WS + polling + `/api/status`, etc.) se
  monta solo dentro del arbol autenticado, asi que `/login` nunca dispara esas llamadas.
- El boton de "Cerrar sesion" (pie del sidebar) llama `POST /api/auth/logout` (best
  effort) y limpia el token local.
- **Modo demo** (`VITE_USE_MOCK_DATA=true`): el login no llama al backend, acepta
  cualquier usuario/contrasena no vacios y crea una sesion falsa en `localStorage` para
  poder navegar todo el panel sin tener `/api/auth/*` implementado todavia.

## 4. Tiempo real: WebSocket + polling de respaldo — por que ambos

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

## 5. Contrato con el backend

### REST

| Metodo | Endpoint | Descripcion |
|---|---|---|
| `POST` | `/api/auth/login` | body `{ username, password }` → `{ token, user: { name, role } }` |
| `GET` | `/api/auth/me` | Valida el token guardado → `{ name, role }` (401 si vencio) |
| `POST` | `/api/auth/logout` | Invalida el token en el backend (best effort) |
| `GET` | `/api/status` | `{ banda, luz, arduino, backend, serialPort, baudrate }` |
| `POST` | `/api/control` | body `{ command }`, `command` ∈ `START`, `STOP`, `LIGHT_ON`, `LIGHT_OFF`, `TEST_SERVO`, `RECONNECT_ARDUINO` |
| `GET` | `/api/stats` | `{ today: { inspected, rejected, rejectRate }, trend: [...], distribution: { ok, defectuosos } }` |
| `GET` | `/api/events?limit=50` | `[{ id, timestamp, result: "ok"\|"rejected", action, confidence, thumbnail }]` |
| `GET` | `/api/settings` | `{ pwmSpeed, confidenceThreshold, camera, cameras, serialPort, baudrate, ports, baudrates }` |
| `POST` | `/api/settings` | body: subconjunto de lo anterior a actualizar |
| `GET` | `/api/model/status` | `{ seleccion_activa, modelo_decision, modelo_a_cargado, modelo_b_cargado, modo_respaldo_heuristico, errores_carga }` |
| `POST` | `/api/model/select` | body `{ modelo: "A" \| "B" \| "ambos" }` — cual modelo evalua cada limon |
| `GET` | `/api/model/comparacion` | `{ por_modelo: { A, B }, comparacion_directa, modelo_activo }` — metricas de acuerdo entre A y B |
| `GET` | `/api/video_feed` | Stream MJPEG (`multipart/x-mixed-replace`) usado directo como `src` de un `<img>` |

`/api/settings`, `/api/auth/*` y `/api/model/*` no estaban en la lista original del
pedido. `/api/settings` es necesario para que la pantalla de Configuracion (velocidad
de banda, umbral de confianza, camara, puerto serial/baudrate) lea y guarde valores
reales; `/api/auth/*` es lo que pide el login (ver seccion 3); `/api/model/*` es lo que
consume la pantalla de Modelos de IA para elegir entre el modelo A (YOLOv8, deteccion y
localizacion), el modelo B (clasificador ResNet18) o correr ambos en paralelo y comparar
que tan de acuerdo estan. `modo_respaldo_heuristico` indica que ningun modelo entrenado
esta cargado y el sistema esta usando un heuristico simple sin pesos, solo para poder
seguir probando banda/luz/servo. Si el backend aun no expone alguno de estos, el panel
sigue funcionando igual con `VITE_USE_MOCK_DATA=true`.

Todos los endpoints salvo `/api/auth/login` esperan el header
`Authorization: Bearer <token>` una vez el usuario inicio sesion.

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

## 6. Estructura del proyecto

```
src/
  main.jsx                  Entry point (Router + AuthProvider)
  App.jsx                   Rutas (publica /login + arbol protegido con SystemProvider)
  index.css                 Tokens Tailwind base + utilidades globales
  lib/
    api.js                  Cliente REST (fetch centralizado, token, endpoints de auth)
    useWebSocket.js          Hook de WebSocket con reconexion exponencial
  context/
    AuthProvider.jsx         Sesion: token, usuario, login/logout, 401 -> logout automatico
    SystemProvider.jsx       Estado global: status, stats, events, settings, detections
  data/
    mockData.js               Datos de ejemplo (VITE_USE_MOCK_DATA=true)
  assets/
    cosecha-limones-piura.jpg  Foto usada en el panel de marca del login
  components/
    auth/
      RequireAuth.jsx         Layout route que redirige a /login si no hay sesion
      SplashScreen.jsx         Pantalla breve mientras se valida el token guardado
    layout/
      Sidebar.jsx             Navegacion lateral + tarjeta de usuario/logout
      AppShell.jsx             Layout comun (sidebar + banner + header + contenido)
      ConnectionBanner.jsx     Banner de advertencia (backend/Arduino desconectado)
    ui/
      Card.jsx, Badge.jsx, Button.jsx, Toggle.jsx, StatDot.jsx
    overview/
      KpiCards.jsx             KPIs: banda, luz, limones inspeccionados, rechazados
      LiveFeed.jsx              Stream MJPEG + overlay de cajas YOLOv8
      TrendChart.jsx            Linea: limones inspeccionados vs. rechazados
      DistributionChart.jsx    Dona: OK vs. defectuosos
      EventsTable.jsx           Tabla de eventos (reusada en Historial y Rechazados)
    control/
      ControlPanel.jsx        Control manual + indicador de conexion serial
    models/
      ModelComparisonPanel.jsx Selector de modelo (A/B/ambos) + comparacion de metricas
    settings/
      SettingsPanel.jsx        PWM, umbral de confianza, camara, puerto serial/baudrate
  pages/
    LoginPage.jsx, OverviewPage.jsx, HistoryPage.jsx, RejectedPage.jsx, ModelsPage.jsx,
    SettingsPage.jsx, HelpPage.jsx
```

## 7. Guia de estilo aplicada

- Fondo `#FFFFFF` puro, paneles en gris calido muy suave (`#F7F7F4`), sin negros ni
  fondos oscuros en ningun componente (no hay modo oscuro implementado).
- Paleta: azul suave (`#4273B0`, marca / navegacion / accion primaria), teal apagado
  (`#006955`–`#3C8A76`, estados "conectado"/"bueno" puntuales) y beige
  (`#876114`/`#F7F2E7`, acentos neutros) — todo mate, sin brillos ni saturacion neon.
- El unico par usado para **identificar datos que aparecen lado a lado** (cajas de
  deteccion simultaneas, lineas del grafico de tendencia, dona OK/defectuosos, badges
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

## 8. Responsive

- **Escritorio (≥1024px, `lg`)**: sidebar completo con etiquetas, grillas de 3–4
  columnas en KPIs y graficos — layout principal, el que se probo con mas detalle.
- **Tablet (640–1024px, `sm`–`lg`)**: sidebar colapsa a un riel de solo iconos, las
  grillas pasan a 1–2 columnas y las tarjetas se apilan verticalmente.
- Por debajo de `sm` el sidebar se oculta (no hay menu hamburguesa): el pedido original
  marca el escritorio como uso principal y la tablet como el limite de adaptacion
  razonable, asi que no se invirtio en un layout movil completo.

## 9. Como se ve cada seccion

Capturas tomadas en modo demo (`VITE_USE_MOCK_DATA=true`) a 1440px de ancho.

- **Login**: pantalla partida en dos en escritorio — panel izquierdo en degrade azul
  con logo, titular, y una foto real de la cosecha de limon en Piura en una tarjeta
  contenida (no a pantalla completa: la foto fuente es de baja resolucion y se pixela
  si se estira mas alla de su tamano nativo); panel derecho blanco con el formulario
  (usuario, contrasena con boton de mostrar/ocultar, banner de error en coral suave si
  falla, aviso de "modo demo" cuando `VITE_USE_MOCK_DATA=true`). En pantallas chicas
  colapsa a una sola columna centrada.
- **Resumen en vivo**: fila de 4 KPI cards (banda/luz con boton de accion inline,
  inspeccionadas y rechazadas con badge de porcentaje) → feed de camara con cajas de
  deteccion superpuestas + panel de control manual a la derecha → grafico de tendencia
  (linea) y dona de distribucion lado a lado → tabla de eventos recientes con miniatura,
  hora, badge de resultado, accion y confianza.
- **Historial de inspecciones**: 3 tarjetas resumen (eventos en pantalla, OK, % de
  rechazo acumulado) seguidas de la tabla completa de eventos con fecha y hora.
- **Limones rechazados**: 2 tarjetas resumen (rechazados hoy, % de rechazo) y la misma
  tabla filtrada solo a `result: "rejected"`.
- **Modelos de IA**: tarjeta con 3 opciones para elegir que evalua cada limon (Modelo A
  YOLOv8, Modelo B ResNet18, o "Comparar ambos"); banner beige si el sistema esta en
  modo de respaldo heuristico (sin modelo entrenado cargado); dos tarjetas de estado de
  carga por modelo; tabla comparativa (inspecciones, confianza promedio, latencia
  promedio, defectuosos detectados por modelo); y una tarjeta de acuerdo entre A y B
  (coincidencias, discrepancias, % de acuerdo) cuando estan corriendo en paralelo.
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
(sin errores de consola) en varios estados: datos de ejemplo, ancho de tablet, backend
inalcanzable, y el flujo completo de login → sesion persistida tras recargar → logout →
intento de visitar una ruta protegida sin sesion (rebota a `/login`).
