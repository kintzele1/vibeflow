import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // VibeFlow Sorbet Palette
        teal: {
          DEFAULT: "#05AD98",
          light: "#E6FAF8",
          dark: "#038C7A",
        },
        lavender: {
          DEFAULT: "#BBBBFB",
          light: "#EEEEFF",
          dark: "#9898E8",
        },
        brand: {
          dark: "#1F1F1F",
          gray: "#878787",
          white: "#FFFFFF",
          bg: "#F8F8F8",
        },
      },
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        dm: ["var(--font-dm-sans)", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease forwards",
        "spark-out": "sparkOut 1.4s ease forwards",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        sparkOut: {
          from: { opacity: "0", transform: "scale(0.6)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
