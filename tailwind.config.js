/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  // Sin modo oscuro: el panel es de modo claro unicamente por requisito de
  // diseno, asi que el proyecto no usa variantes `dark:` en ningun lado.
  theme: {
    extend: {
      fontFamily: {
        // Hanken Grotesk -- sans-serif humanista (no geometrica/grotesca
        // como la IBM Plex Sans anterior): remates mas calidos en las curvas,
        // que es lo que pide la estetica "Agri-Tech Premium" en vez del look
        // mas tecnico/frio de Plex. Elegida en vez de Plus Jakarta Sans /
        // Inter / Geist / Space Grotesk / Fraunces -- esas son las fuentes
        // que todo generador de UI con IA repite, y dejan de leerse como una
        // decision de marca (hallazgo del hook de diseño). IBM Plex Mono se
        // mantiene aparte, solo para lecturas tipo HUD (resolucion de frame,
        // modelo activo) donde sí conviene que se lea como instrumento, no
        // como marca.
        sans: ["'Hanken Grotesk'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        // Rediseño "Agri-Tech Premium" -- base beige cálida en vez de blanco
        // puro. `panel` (superficie de tarjeta) queda MÁS clara que `canvas`
        // (fondo de página) a propósito: las tarjetas deben despegar del
        // fondo, no fundirse con él. line/line-strong dan la estructura de
        // bordes/divisores.
        // Profundizadas respecto al beige original (F4EFE1/FCFAF4/...): mismo
        // hue cálido, menos "lavado" -- pedido explícito de que el fondo se
        // sienta con más cuerpo sin cruzar a modo oscuro. ink/ink-soft/ink-faint
        // no se tocan: oscurecer el fondo solo sube su contraste contra ellos,
        // nunca lo baja, así que el AA ya validado (ver comentario de `ink`)
        // sigue de pie.
        canvas: "#EBE1C7",
        panel: "#F9F3E4",
        "panel-alt": "#E7DBB9",
        line: "#D2C093",
        "line-strong": "#B69A5C",
        ink: {
          DEFAULT: "#2A2721",
          soft: "#4E4A3B",
          // ~6:1 contra `panel`, ~5:1 contra `canvas` -- se mantiene el
          // mínimo AA (4.5:1) que ya se había corregido antes en la paleta
          // fría (hallazgo P0 histórico de /impeccable critique), no
          // reintroducirlo al recalentar los neutros.
          faint: "#655F4C",
        },
        // Verde bosque profundo -- color de marca / "activo-bueno" (hero KPI,
        // logo, nav activo, botones primarios). Reemplaza al azul como color
        // primario de marca.
        green: {
          50: "#E9F1E6",
          100: "#CFE2C9",
          400: "#6FA06B",
          500: "#2F5233",
          600: "#213B25",
          700: "#17291A",
        },
        // Verde medio/fresco -- estados "conectado"/"en vivo" puntuales
        // (StatDot, pill de Arduino conectado): un escalón más claro que el
        // verde de marca para no competir con él, misma familia cromática.
        teal: {
          50: "#EAF3EA",
          100: "#CFE6CE",
          500: "#4C8A4E",
          600: "#3A6D3C",
        },
        // Beige dorado -- acento neutro (avatar, chips secundarios).
        beige: {
          50: "#F3EAD4",
          100: "#E8D8AF",
          400: "#B99655",
          500: "#9C7B3E",
          600: "#7A5E28",
        },
        // Dorado cálido -- estado "iluminación/relé" y advertencias suaves.
        // Nuevo respecto a la paleta anterior: la tarjeta de iluminación
        // necesitaba su propio tono, no forzar el verde o el beige en algo
        // que no es ni "activo" ni "neutro".
        gold: {
          50: "#FBF3DC",
          100: "#F5E4B0",
          400: "#D9AE49",
          500: "#C6952A",
          600: "#9C7317",
        },
        // Terracota/cobre -- estado "rechazado"/alerta. Reemplaza al coral
        // como color de peligro en toda la interfaz.
        terracotta: {
          50: "#FBEEE6",
          100: "#F1D2BE",
          300: "#DCA37D",
          400: "#C67C4D",
          500: "#A6532E",
          600: "#803E22",
        },
        // blue/coral se CONGELAN a propósito con sus valores originales: son
        // el único par de la paleta validado contra daltonismo protanopia/
        // deuteranopia (ver comentario histórico), y quedan reservados
        // exclusivamente para la identidad OK/Defectuoso dentro de la zona de
        // inspección (cajas de detección, viewfinder) y los gráficos
        // Inspeccionados-vs-Rechazados (TrendChart/DistributionChart) -- ahí
        // el par verde/terracota (ambos en el eje rojo-verde) sería
        // justamente el peor caso para esa discapacidad. En el resto de la
        // interfaz (botones, chips, badges, nav) el "peligro" ahora es
        // terracotta, no coral, así que ese par no convive con blue en
        // ningún otro lado -- ya no hace falta que sea distinguible de él.
        blue: {
          50: "#EEF3F8",
          100: "#D9E4EF",
          400: "#5C84B4",
          500: "#4273B0",
          600: "#355E93",
          700: "#1D4D87",
        },
        coral: {
          50: "#FBEEEC",
          100: "#F3D9D5",
          400: "#D07A73",
          500: "#CA5551",
          600: "#A12F2F",
        },
      },
      // rgba tintada con el `ink` cálido actual (#2A2721 -> 42,39,33), no con
      // el `ink` frío de antes del rediseño (#2B2E33 -> 43,46,51) -- sombra
      // pura gris-azulada sobre una paleta beige se nota, aunque sea sutil
      // (hallazgo real de /redesign-existing-projects: "tint shadows to
      // match the background hue").
      boxShadow: {
        card: "0 1px 2px rgba(42, 39, 33, 0.05), 0 4px 16px rgba(42, 39, 33, 0.07)",
        "card-hover": "0 2px 4px rgba(42, 39, 33, 0.06), 0 8px 24px rgba(42, 39, 33, 0.09)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scan: {
          "0%": { transform: "translateY(-8%)", opacity: "0" },
          "15%": { opacity: "1" },
          "85%": { opacity: "1" },
          "100%": { transform: "translateY(108%)", opacity: "0" },
        },
        "row-in": {
          "0%": { opacity: "0", transform: "translateY(-6px)", backgroundColor: "rgba(66, 115, 176, 0.12)" },
          "55%": { opacity: "1", transform: "translateY(0)" },
          "100%": { backgroundColor: "rgba(66, 115, 176, 0)" },
        },
        // Punto "radar" del ultimo dato de TrendChart -- reemplaza un SMIL
        // <animate> nativo de SVG que prefers-reduced-motion no podia
        // apagar (hallazgo P1 de /impeccable critique). Referenciada desde
        // una className real (`animate-radar-ping`), asi que a diferencia
        // de grow-y/breathe el JIT si la detecta.
        "radar-ping": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.55" },
          "50%": { transform: "scale(2.75)", opacity: "0" },
        },
        // Guiones que "fluyen" a lo largo de las líneas de conexión entre las
        // tarjetas KPI y la zona de inspección -- sugiere datos moviéndose
        // hacia el instrumento, no solo una línea decorativa estática.
        // Barrido de un solo sentido que nunca para -> linear, misma
        // categoría que `scan` (no ease-in-out, que frenaría en cada vuelta).
        "flow-dash": {
          to: { strokeDashoffset: "-24" },
        },
        // `grow-y` y `breathe` NO viven aca -- ver src/index.css. Tailwind
        // solo emite el @keyframes de una entrada de este bloque si detecta
        // la clase `animate-<nombre>` como substring literal en el codigo
        // escaneado (`content` de este archivo). KpiCards.jsx las usa desde
        // un `style={{ animation: "grow-y ..." }}` inline -- nunca aparece
        // el string `animate-grow-y` en ningun lado -- asi que el JIT nunca
        // generaba esos @keyframes: el sparkline del hero corria una
        // animation-name invalida, ignorada en silencio (sin error de build
        // ni de consola), y nunca crecio ni respiro. Confirmado grepeando el
        // CSS de `npm run build`, no solo leyendo este archivo (hallazgo de
        // /impeccable critique). Definirlas como @keyframes planos en
        // index.css evita que vuelva a pasar con cualquier otra animacion
        // referenciada solo por `style` en vez de `className`.
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        // ease-in-out porque es un pulso simetrico (crece y vuelve), misma
        // familia que pulse-soft/breathe -- no un barrido de un solo
        // sentido, que es lo que reserva `linear` en este proyecto.
        "radar-ping": "radar-ping 2.2s ease-in-out infinite",
        // Un solo token de ease-out fuerte en todo el proyecto -- antes
        // convivían cubic-bezier(0.16,1,0.3,1) (fade-up/grow-y) y
        // cubic-bezier(0.23,1,0.32,1) (ping-soft/$transition-fade), dos
        // curvas casi iguales. Se unificó a esta.
        "fade-up": "fade-up 0.6s cubic-bezier(0.23, 1, 0.32, 1) both",
        // scan/shimmer barren de un extremo al otro y reinician de golpe --
        // son "constant motion" (categoria marquee/progress de la guia de
        // animacion), no un morph en pantalla, asi que van en linear, no
        // ease-in-out (que frenaria y volveria a acelerar en cada vuelta).
        scan: "scan 3.2s linear infinite",
        // Mismo keyframe que `scan`, pero de un solo pase: no es un barrido
        // constante que reinicia (esa es la categoria que reserva linear),
        // es una entrada -- la foto de marca del login "se activa" una vez
        // al cargar, como si el instrumento recien encendiera, asi que usa
        // el ease-out fuerte del proyecto en vez de linear.
        "scan-once": "scan 1.6s cubic-bezier(0.23, 1, 0.32, 1) 500ms both",
        // 700ms era demasiado lento: los eventos pueden llegar varias veces
        // por segundo (ver README), y a esa frecuencia una entrada tan larga
        // se siente pegajosa en vez de viva.
        "row-in": "row-in 0.35s ease-out both",
        "flow-dash": "flow-dash 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
