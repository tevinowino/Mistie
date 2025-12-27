/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Mistie "Vibrant Love" Palette
        'm-primary': '#FF4B7D',    // Hot Pink
        'm-secondary': '#FF8E53',  // Coral
        'm-bg': '#FFF5F7',         // Pale Pink Background
        'm-card': '#FFFFFF',       // White Cards
        'm-text': '#2D2D2D',       // Dark Gray Text
        'm-muted': '#9E9E9E',      // Light Gray Text
      },
      fontFamily: {
        'outfit': ['Outfit', 'system-ui', 'sans-serif'],
        'quicksand': ['Quicksand', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '32px', // Standard for GlassCards
      }
    },
  },
  plugins: [],
};