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
  console.log('Setting up direct HTML serving (Vite disabled for debugging)');
  
  // Direct HTML serving without Vite middleware
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    console.log(`Direct serving handling request: ${req.method} ${url}`);

    // Skip API routes
    if (url.startsWith('/api/') || url.startsWith('/health') || url.startsWith('/test-frontend') || url.startsWith('/auth/')) {
      console.log(`Skipping ${url} - API route`);
      return next();
    }

    try {
      console.log(`Processing frontend request for: ${url}`);
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "web-frontend",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      console.log(`Template loaded, serving directly for: ${url}`);
      
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      console.error('Direct serve error:', e);
      res.status(500).send('Frontend build error');
    }
  });
}

export function serveStatic(app: Express) {
  const clientDistPath = path.resolve(import.meta.dirname, "..", "..", "web-frontend", "dist");
  // Static file serving would go here in production
  
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(clientDistPath, "index.html"));
  });
}