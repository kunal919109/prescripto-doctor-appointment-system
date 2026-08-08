/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5F6FFF",
        'primary-dark': "#4A57E8",
        secondary: "#F0F4FF",
        accent: "#00C8A0",
        border: "#E5E7EB",
        error: "#EF4444",
        warning: "#F59E0B",
        text: {
          primary: "#1A1A2E",
          secondary: "#6B7280",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
