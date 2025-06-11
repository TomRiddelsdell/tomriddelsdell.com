import express from 'express';
import { createServer } from 'http';
import { createViteServer } from 'vite';
import path from 'path';

const app = express();
const server = createServer(app);

async function setupTestFrontend() {
  try {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.resolve(import.meta.dirname, "..", "test-frontend"),
    });

    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      try {
        const template = path.resolve(
          import.meta.dirname,
          "..",
          "test-frontend",
          "index.html",
        );

        let html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    const PORT = 3001;
    server.listen(PORT, () => {
      console.log(`Test frontend running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Failed to setup test frontend:', error);
  }
}

setupTestFrontend();