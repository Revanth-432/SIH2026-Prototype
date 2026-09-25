/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // All pairs below meet WCAG AA (4.5:1) on white / canvas.
        artisan: {
          primary: "#B4461F",    // Terracotta — main actions
          dark: "#8F3517",       // Pressed / deep clay
          light: "#F7E9E1",      // Terracotta tint — selected backgrounds
          amber: "#B45309",      // Saffron — pending / in review
          slate: "#1C1917",      // Main text
          muted: "#57534E",      // Secondary text (never lighter than this)
          canvas: "#FAF6F0",     // Warm paper background
          card: "#FFFFFF",       // Card surface
          border: "#E7DDD2",     // Warm neutral border
          success: "#15803D",    // Live / delivered / done
          error: "#B91C1C",      // Error / cancel
        },
      },
      fontFamily: {
        sans: ["Mukta_400Regular"],
        medium: ["Mukta_500Medium"],
        semibold: ["Mukta_600SemiBold"],
        bold: ["Mukta_700Bold"],
      },
    },
  },
  plugins: [],
};
