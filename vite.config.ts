import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 4567,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),

    // ── Dev-only: serve public/landing.html when the user hits "/"
    // This mirrors the Vercel rewrite so localhost and production behave identically.
    mode === "development" && {
      name: "landing-at-root",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Match bare "/" and "/?param=value" but not "/login", "/app", etc.
          if (/^\/(\?.*)?$/.test(req.url ?? "")) {
            const landingPath = path.resolve(__dirname, "public/landing.html");
            if (fs.existsSync(landingPath)) {
              res.setHeader("Content-Type", "text/html; charset=utf-8");
              res.end(fs.readFileSync(landingPath, "utf-8"));
              return;
            }
          }
          next();
        });
      },
    },
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
