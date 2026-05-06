import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        f1: {
          bg: "#15151E",
          surface: "#1E1E2D",
          red: "#E10600",
          grey: "#97989B",
          gain: "#00FF87",
          loss: "#FF4444",
          gold: "#FFD700",
        },
        tire: {
          soft: "#DA291C",
          medium: "#FFD700",
          hard: "#FFFFFF",
        },
        team: {
          "red-bull": "#3671C6",
          ferrari: "#E8002D",
          mclaren: "#FF8000",
          mercedes: "#27F4D2",
          rb: "#6692FF",
          williams: "#64C4FF",
          alpine: "#0093CC",
          "aston-martin": "#229971",
          sauber: "#52E252",
          haas: "#B6BABD",
        },
      },
      fontFamily: {
        display: ["var(--font-orbitron)", "sans-serif"],
        body: ["var(--font-chakra)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
