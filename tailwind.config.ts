import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
        cursive: ["var(--font-great-vibes)", "cursive"],
      },
      colors: {
     
        brand: {
          red: "#E63946",
          gray: "#1F2937", 
        }
      }
    },
  },
  plugins: [],
};
export default config;