/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
      colors: {
        'primary-red': '#ff3333',
        'primary-blue': '#4da6ff',
        'accent-yellow': '#ffd700',
        'status-green': '#00ff00',
        'dark-bg': '#000000',
        'dark-surface': '#111111',
        'dark-border': '#333333',
      },
      fontFamily: {
        'mono': ['Space Mono', 'Share Tech Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        'display': ['Orbitron', 'Audiowide', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'sans': ['Rajdhani', 'Exo 2', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'tech': ['Electrolize', 'Rajdhani', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'starfield': 'radial-gradient(circle at 1px 1px, rgba(0, 255, 255, 0.15) 1px, transparent 0)',
      },
      backgroundSize: {
        'starfield': '50px 50px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-subtle': 'glow 2s ease-in-out infinite alternate',
      },
            keyframes: {
              glow: {
                '0%': { opacity: '0.5' },
                '100%': { opacity: '1' },
              },
              fadeIn: {
                '0%': { opacity: '0', transform: 'translateY(8px)' },
                '100%': { opacity: '1', transform: 'translateY(0)' },
              },
            },
    },
  },
  plugins: [],
}

