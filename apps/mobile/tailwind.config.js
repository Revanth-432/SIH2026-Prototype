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
        artisan: {
          primary: "#C85A32",    // Traditional Terracotta Red
          dark: "#A3411E",       // Deep Clay
          light: "#F5EBE6",      // Muted Terracotta Tint
          amber: "#E58A13",      // Handloom Saffron Gold
          slate: "#1E293B",      // Deep Charcoal
          muted: "#64748B",      // Muted Text
          canvas: "#FAF8F5",     // Warm Khadi / Handmade Paper Tint
          card: "#FFFFFF",       // Clean Surface
          border: "#E2DCD5",     // Warm Neutral Border
          success: "#16A34A",    // Confirmation Green
          error: "#DC2626",      // Error Red
        },
      },
    },
  },
  plugins: [],
};
