/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
      },
      colors: {
        fyzen: {
          bg: "#0c171a",
          surface: "#142327",
          border: "rgba(255, 255, 255, 0.07)",
          accent: "#89d5bf",
          "accent-hover": "#a3e3d0",
          warm: "#d8bc8b",
          muted: "#a0b3b7",
        },
      },
      borderRadius: {
        card: "16px",
        panel: "24px",
      },
      boxShadow: {
        panel:
          "0 1px 0 rgba(255,255,255,0.04) inset, 0 22px 48px -28px rgba(0,0,0,0.65)",
      },
    },
  },
  plugins: [],
};
