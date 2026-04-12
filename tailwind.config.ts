import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./src/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bgBase: "var(--bg-base)",
        bgSurface: "var(--bg-surface)",
        textPrimary: "var(--text-primary)",
        textMuted: "var(--text-muted)",
        accentBlue: "var(--accent-blue)",
        accentTeal: "var(--accent-teal)",
        accentPurple: "var(--accent-purple)",
      },
      borderRadius: {
        glass: "16px",
      },
      backdropBlur: {
        glass: "var(--glass-blur)",
      },
      width: {
        sidebar: "var(--sidebar-w)",
      },
      boxShadow: {
        glow: "0 8px 30px rgba(2, 12, 31, 0.3)",
      },
      keyframes: {
        "fade-slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-slide-up": "fade-slide-up 0.45s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
