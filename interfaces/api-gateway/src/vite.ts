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
    console.log('Setting up Vite development server...');
    // Get current Replit domain dynamically
    const replitDomain = process.env.REPL_SLUG && process.env.REPL_OWNER 
      ? `${process.env.REPL_ID}-00-${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.dev`
      : null;

    const allowedHosts = [
      ".replit.dev",
      "localhost",
      "127.0.0.1"
    ];

    if (replitDomain) {
      allowedHosts.push(replitDomain);
    }

    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: "0.0.0.0",
        allowedHosts
      },
      appType: "spa",
      root: path.resolve(import.meta.dirname, "..", "..", "..", "client"),
      optimizeDeps: {
        include: ['react', 'react-dom']
      }
    });

    // Let Vite handle all frontend requests
    app.use(vite.middlewares);
    
    console.log('Vite setup completed - all frontend requests handled by Vite');
  } catch (error) {
    console.error('Vite setup failed, using fallback static serving:', error);
    
    // Fallback static serving
    app.use("*", async (req, res, next) => {
      // Skip API routes
      if (req.url.startsWith('/api/') || 
          req.url.startsWith('/health') || 
          req.url.startsWith('/test-frontend') || 
          req.url.startsWith('/auth/')) {
        return next();
      }
      
      try {
        const template = await fs.promises.readFile(
          path.resolve(import.meta.dirname, "..", "..", "..", "client", "index.html"),
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