import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: '/PriceSync/',
  plugins: [
    react(),
    tailwindcss(), // This enables the Tailwind CSS v4 engine
  ],
  resolve: {
    alias: {
      // This allows you to use the "@" shortcut for the "src" folder
      "@": path.resolve(__dirname, "./src"),
    },
  },
})