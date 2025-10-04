/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A1A1A',
        background: '#F5F1EB',
        accent: '#FF6B35',
        'accent-secondary': '#2563EB',
        success: '#22C55E',
        error: '#DC2626',
        'neutral-light': '#F9FAFB',
        'neutral-mid': '#6B7280',
        'neutral-dark': '#111827',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        '12': '12px',
      },
      boxShadow: {
        card: '0 2px 6px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
