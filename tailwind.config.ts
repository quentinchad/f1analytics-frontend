import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        f1red: '#E10600',
        f1dark: '#15151E',
        f1mid: '#1E1E2E',
        f1card: '#242438',
        f1border: '#38384E',
        f1text: '#F0F0F0',
        f1muted: '#888899',
      },
      fontFamily: {
        f1: ['Formula1', 'Titillium Web', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
