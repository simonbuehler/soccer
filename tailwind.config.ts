import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,html,vue}"],
  theme: {
    extend: {
      screens: {
        print: { raw: "print" },
      },
      keyframes: {
        "pulse-scale": {
          "0%, 100%": { transform: "translate(-50%, -50%) scale(1)" },
          "50%": { transform: "translate(-50%, -50%) scale(1.25)" },
        },
      },
      animation: {
        "pulse-scale": "pulse-scale 1s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
