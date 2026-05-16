/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scan every TSX file under app/ and components/
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0B0B0F',     // dark mode primary bg
          elevated: '#16161D',    // cards
          subtle: '#1F1F28',      // hover states
        },
        ink: {
          DEFAULT: '#F4F4F5',     // primary foreground
          muted: '#9CA0A8',       // secondary text
          subtle: '#6B7280',      // tertiary
        },
        brand: {
          DEFAULT: '#7C5CFF',     // violet primary (per brief recommendation)
          contrast: '#FFFFFF',
          subtle: '#221F3A',
        },
        ok: '#22C55E',
        warn: '#F59E0B',
        danger: '#EF4444',
        border: '#26262F',
      },
      fontFamily: {
        sans: ['System'],   // SF Pro on iOS, default system on Android
      },
      borderRadius: {
        DEFAULT: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
}
