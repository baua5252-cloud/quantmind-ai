/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: "#080b12",
          50: "#0d1117",
          100: "#111820",
          200: "#151d28",
          300: "#1c2636",
          400: "#263044",
          500: "#334155",
        },
        brand: {
          DEFAULT: "#00d4aa",
          light: "#34ebc6",
          dark: "#00a880",
        },
      },
    },
  },
  plugins: [],
};
