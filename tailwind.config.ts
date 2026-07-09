import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        cyan: {
          50: "#eff6ff",
          100: "#dbeafe",
          400: "#3b82f6",
          500: "#2563eb",
          600: "#1d4ed8",
        },
        magenta: {
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
        },
        accent: "#60a5fa",
        primary: "#2563eb",
        dark: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
          base: "#0a0a0a",
        },
      },
      backgroundColor: {
        glass: "rgba(23, 23, 23, 0.5)",
        "glass-xl": "rgba(23, 23, 23, 0.5)",
      },
      backdropBlur: {
        lg: "8px",
        xl: "12px",
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(37, 99, 235, 0.4), inset 0 0 20px rgba(37, 99, 235, 0.1)",
        "glow-magenta": "0 0 20px rgba(250, 204, 21, 0.4), inset 0 0 20px rgba(250, 204, 21, 0.1)",
        "cyan-lg": "0 0 30px rgba(37, 99, 235, 0.3)",
      },
      keyframes: {
        gradientFlow: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        fadeInUp: {
          from: {
            opacity: "0",
            transform: "translateY(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        slideUp: {
          from: {
            opacity: "0",
            transform: "translateY(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        textGradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        gradientFlow: "gradientFlow 3s ease-in-out infinite",
        float: "float 8s ease-in-out infinite",
        fadeInUp: "fadeInUp 0.6s ease-out",
        slideUp: "slideUp 0.6s ease-out",
        textGradient: "textGradient 3s ease-in-out infinite",
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};

export default config;
