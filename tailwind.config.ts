import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "slide-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        "pulse-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 5px hsl(var(--primary) / 0.3)"
          },
          "50%": { 
            boxShadow: "0 0 20px hsl(var(--primary) / 0.6), 0 0 30px hsl(var(--primary) / 0.3)"
          }
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" }
        },
        "glow-pulse": {
          "0%, 100%": { 
            textShadow: "0 0 5px hsl(var(--primary) / 0.3)"
          },
          "50%": { 
            textShadow: "0 0 15px hsl(var(--primary) / 0.6), 0 0 25px hsl(var(--primary) / 0.3)"
          }
        },
        "sparkle": {
          "0%, 100%": { 
            transform: "scale(1) rotate(0deg)",
            opacity: "0.8"
          },
          "50%": { 
            transform: "scale(1.1) rotate(180deg)",
            opacity: "1"
          }
        },
        "rotate-slow": {
          "from": { transform: "rotate(0deg)" },
          "to": { transform: "rotate(360deg)" }
        },
        "particle-flow": {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "50%": { transform: "rotate(180deg) scale(1.1)" },
          "100%": { transform: "rotate(360deg) scale(1)" }
        },
        "particles-float": {
          "0%": { backgroundPosition: "0 0, 0 0" },
          "100%": { backgroundPosition: "50px 50px, -80px -80px" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.6s ease-out",
        "float": "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shimmer": "shimmer 3s linear infinite",
        "bounce-slow": "bounce-slow 4s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "sparkle": "sparkle 1.5s ease-in-out infinite",
        "rotate-slow": "rotate-slow 8s linear infinite",
        "particle-flow": "particle-flow 3s linear infinite",
        "particles-float": "particles-float 20s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;