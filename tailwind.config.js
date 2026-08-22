/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1E2761",
          light: "#2D3A8C",
        },
        accent: "#4F8EF7",
        surface: "#F8FAFC",
        card: "#FFFFFF",
        ink: "#1A1A2E",
        line: "#E2E8F0",
      },
      fontFamily: {
        sans: ["var(--font-ibm-plex)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 4px 16px -2px rgb(0 0 0 / 0.08)",
        "card-hover":
          "0 4px 12px 0 rgb(0 0 0 / 0.08), 0 12px 32px -4px rgb(0 0 0 / 0.12)",
      },
    },
  },
  plugins: [],
};
