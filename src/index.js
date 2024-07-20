import { Command } from "commander";
import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from "http-proxy-middleware";
import app from './server/app.js';
import { asyncHandler } from "./server/middleware.js";
import { getCurrentMaxTokenId, setCurrentMaxTokenId } from "./data/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// set up the UI server

if (process.env.NODE_ENV === "production") {
  // serve static files from vite-app
  app.use(express.static(path.join(__dirname, '..', 'dist')));
  
  // handle all other routes within vite-app
  app.get('*', asyncHandler(async (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }));
} else {
  // proxy vite development server
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true,
  }));
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// program commands

const program = new Command();

program
  .command("server")
  .description("Start the server")
  .action(async () => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  });

program
  .command("max-token")
  .description("Get the max token count")
  .action(async () => {
    const maxToken = await getCurrentMaxTokenId();
    console.log(maxToken);
    await setCurrentMaxTokenId(0);
    console.log(await getCurrentMaxTokenId());
  });

await program.parseAsync(process.argv);
