/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:          '#5F6FFF',
        'primary-dark':   '#4A57E8',
        secondary:        '#F0F4FF',
        accent:           '#00C8A0',
        'text-primary':   '#1A1A2E',
        'text-secondary': '#6B7280',
        border:           '#E5E7EB',
        error:            '#EF4444',
        warning:          '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
