/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        secondary: '#4ECDC4',
        error: '#FF6B6B',
        success: '#51CF66',
        bg: '#F8F7FF',
        text: '#2D3436',
        subtle: '#636E72'
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
        pill: '24px'
      }
    }
  },
  plugins: []
}
