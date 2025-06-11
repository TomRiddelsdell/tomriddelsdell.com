import { ViteDevServer, createServer as createViteServer } from "vite";
import type { Express } from "express";
import type { Server } from "http";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  try {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.resolve(import.meta.dirname, "..", "..", "web-frontend"),
    });

    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      // Skip API routes
      if (url.startsWith('/api/') || url.startsWith('/health') || url.startsWith('/test-frontend')) {
        return next();
      }

      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "..",
          "web-frontend",
          "index.html",
        );

        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        console.error('Vite transform error:', e);
        res.status(500).send('Frontend build error');
      }
    });
  } catch (error) {
    console.error('Failed to setup Vite:', error);
    // Fallback to serving static HTML without Vite
    app.use("*", async (req, res, next) => {
      if (req.url.startsWith('/api/') || req.url.startsWith('/health') || req.url.startsWith('/test-frontend')) {
        return next();
      }
      
      try {
        const template = await fs.promises.readFile(
          path.resolve(import.meta.dirname, "..", "..", "web-frontend", "index.html"),
          "utf-8"
        );
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        res.status(500).send('Frontend not available');
      }
    });
  }
}

export function serveStatic(app: Express) {
  const clientDistPath = path.resolve(import.meta.dirname, "..", "..", "web-frontend", "dist");
  // Static file serving would go here in production
  
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(clientDistPath, "index.html"));
  });
}