import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createHttpServer } from "http";
import { Server as SocketServer } from "socket.io";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new SocketServer(httpServer, {
    cors: { origin: "*" }
  });
  const PORT = 3000;

  app.use(express.json());

  io.on("connection", (socket) => {
    console.log("[Socket] Kernel link established:", socket.id);
  });

  // [EMBEDDED_GPU_KERNEL]: Direct execution bridge for local packages.
  app.post("/api/kernel/execute", async (req, res) => {
    try {
      const { agent, payload } = req.body;
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const kernelPath = path.join(process.cwd(), "kernels", `${agent.toLowerCase()}.sh`);
      
      io.emit("telemetry", { agent, status: "executing", log: `Starting local kernel for ${agent}...` });

      try {
        const { stdout } = await execAsync(`bash ${kernelPath} '${JSON.stringify(payload)}'`).catch(() => ({ stdout: null }));
        
        if (stdout) {
          io.emit("telemetry", { agent, status: "complete", log: `Local kernel ${agent} execution finished.` });
          return res.json({ status: "success", output: stdout.trim() });
        }
      } catch (e) {
        // Fallback
      }

      res.json({
        status: "ready_for_linkage",
        output: `[Duo System] Waiting for internal GPU package in /kernels/${agent.toLowerCase()}.sh.`,
        instructions: `Place your GPU execution script at /kernels/${agent.toLowerCase()}.sh to activate full 100% local processing.`
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Abstra Server Running: http://localhost:${PORT}`);
  });
}

startServer();
