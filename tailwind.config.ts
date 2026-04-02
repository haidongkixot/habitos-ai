import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          base: '#0c0c0f',
          card: '#1c1c22',
          elevated: '#16161a',
        },
        accent: {
          amber: '#f59e0b',
        },
      },
      borderRadius: {
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};
export default config;
