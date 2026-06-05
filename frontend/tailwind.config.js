/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#64748B',
        error: '#DC2626',
        success: '#16A34A',
        bg: '#F1F5F9',
        text: '#0F172A',
        subtle: '#64748B',
        border: '#E2E8F0',
      },
      borderRadius: {
        card: '8px',
        btn: '6px',
        pill: '9999px',
      }
    }
  },
  plugins: []
}
