/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { primary: '#0F0A06', surface: '#1C1410', card: '#251A13' },
        border: { DEFAULT: '#3D2E22', light: '#4D3E32' },
        accent: { DEFAULT: '#C8853A', light: '#E8A355', muted: 'rgba(200,133,58,0.15)' },
        cream: { DEFAULT: '#F5ECD7', muted: '#A89480', faint: '#6B5A4E' },
        status: { success: '#4CAF6E', error: '#E05252', warning: '#E8A020', info: '#4A9EE8' },
      },
      fontFamily: {
        brand: ['Cormorant Garamond', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideInRight: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
