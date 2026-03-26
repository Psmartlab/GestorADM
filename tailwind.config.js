/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [

    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--smartlab-bg)",
        surface: "var(--smartlab-surface)",
        "surface-container": "var(--smartlab-surface-low)",
        "surface-container-low": "var(--smartlab-surface-low)",
        "on-background": "var(--smartlab-on-surface)",
        "on-surface": "var(--smartlab-on-surface)",
        "on-surface-variant": "var(--smartlab-on-surface-variant)",
        primary: "var(--smartlab-primary)",
        error: "var(--danger)",
        success: "var(--success)",
        warning: "var(--warning)",
        "inverse-surface": "#2f3131",
        "inverse-on-surface": "#f0f1f1",
      },

      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
