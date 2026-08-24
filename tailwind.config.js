/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  // Sin modo oscuro: el panel es de modo claro unicamente por requisito de
  // diseno, asi que el proyecto no usa variantes `dark:` en ningun lado.
  theme: {
    extend: {
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        // Neutros calidos (nunca negro puro / blanco identidad de marca)
        canvas: "#FFFFFF",
        panel: "#F7F7F4",
        "panel-alt": "#F1F1EC",
        line: "#E6E4DD",
        "line-strong": "#D6D3C8",
        ink: {
          DEFAULT: "#2B2E33",
          soft: "#5B6167",
          faint: "#8B9096",
        },
        // Azul suave -- color primario de marca / dato "OK - Inspeccionadas"
        blue: {
          50: "#EEF3F8",
          100: "#D9E4EF",
          400: "#5C84B4",
          500: "#4273B0",
          600: "#355E93",
          700: "#1D4D87",
        },
        // Teal apagado -- estado "bueno" / conectado
        teal: {
          50: "#EAF3F0",
          100: "#D2E6DF",
          500: "#3C8A76",
          600: "#006955",
        },
        // Beige -- acento neutro calido
        beige: {
          50: "#F7F2E7",
          100: "#EFE6D2",
          400: "#C7AD79",
          500: "#AD8E57",
          600: "#876114",
        },
        // Coral suave -- estado "rechazado" / advertencia (nunca rojo neon)
        coral: {
          50: "#FBEEEC",
          100: "#F3D9D5",
          400: "#D07A73",
          500: "#CA5551",
          600: "#A12F2F",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(43, 46, 51, 0.04), 0 4px 16px rgba(43, 46, 51, 0.06)",
        "card-hover": "0 2px 4px rgba(43, 46, 51, 0.05), 0 8px 24px rgba(43, 46, 51, 0.08)",
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
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
