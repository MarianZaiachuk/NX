/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        nx: {
          lightBg: "#FFFFFF",
          lightSurface: "#F8FBFA",
          lightText: "#111111",
          lightPanel: "#1C1C1E",
          darkBg: "#111111",
          darkSurface: "#0B0F19",
          darkPanel: "#1C1C1E",
          blue: "#3882F6",
          lime: "#CCFF00",
          gain: "#32C776",
          loss: "#EF476F",
        },
        app: {
          bg: "rgb(var(--color-bg) / <alpha-value>)",
          surface: "rgb(var(--color-surface) / <alpha-value>)",
          panel: "rgb(var(--color-panel) / <alpha-value>)",
          text: "rgb(var(--color-text) / <alpha-value>)",
          muted: "rgb(var(--color-muted) / <alpha-value>)",
          border: "rgb(var(--color-border) / <alpha-value>)",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(204, 255, 0, 0.22), 0 18px 40px rgba(0, 0, 0, 0.26)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

