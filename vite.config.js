import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  // Allow the sandbox preview host (and any host) when running `vite preview`.
  preview: {
    host: true,
    allowedHosts: true,
  },
  server: {
    host: true,
    allowedHosts: true,
  },
  build: {
    // Split big vendor libraries into their own cached chunks so the main app
    // bundle is much smaller and the browser can parallel-download + cache them.
    // This is the single biggest win for the mobile performance score.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined
          // Big, independently-cacheable libraries get their own chunks.
          // Everything else (incl. React core) is left to Vite's default
          // chunking to avoid circular-chunk references.
          if (id.includes("swiper")) return "swiper"
          if (id.includes("fortawesome") || id.includes("react-icons")) return "icons"
          if (id.includes("hls.js") || id.includes("artplayer")) return "player"
          if (id.includes("@supabase") || id.includes("supabase-js")) return "supabase"
          if (id.includes("axios")) return "axios"
          if (
            id.includes("react-router") ||
            id.includes("react-dom") ||
            id.includes("/react/") ||
            id.includes("react/jsx-runtime") ||
            id.includes("/scheduler/") ||
            id.includes("use-sync-external-store")
          )
            return "react-vendor"
          return undefined
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})
