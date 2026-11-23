import { createServer } from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const HOST = "127.0.0.1";
const PORT = Number(process.env.AGENT_PORT ?? 47831);
const TOKEN = process.env.AGENT_TOKEN ?? randomBytes(32).toString("hex");
const ALLOWED_ORIGINS = new Set((process.env.AGENT_ALLOWED_ORIGINS ?? "http://localhost:3000").split(",").map((v) => v.trim()));

type Device = { id: string; state: string; model?: string };

function authorized(value: string | undefined): boolean {
  if (!value?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(value.slice(7));
  const expected = Buffer.from(TOKEN);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

async function listDevices(): Promise<Device[]> {
  const { stdout } = await execFileAsync(process.env.ADB_PATH ?? "adb", ["devices", "-l"], { timeout: 8000 });
  return stdout.split(/\r?\n/).slice(1).filter((line) => line.trim() && !line.startsWith("*"))
    .map((line) => {
      const [id, state, ...details] = line.trim().split(/\s+/);
      const model = details.find((part) => part.startsWith("model:"))?.slice(6);
      return { id, state, ...(model ? { model } : {}) };
    });
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  }
  if (req.method === "OPTIONS") { res.writeHead(204).end(); return; }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (!authorized(req.headers.authorization)) {
    res.writeHead(401).end(JSON.stringify({ error: "Unauthorized" })); return;
  }
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200).end(JSON.stringify({ status: "ok", service: "multiphone-local-agent" })); return;
  }
  if (req.method === "GET" && req.url === "/api/devices") {
    try {
      const devices = await listDevices();
      res.writeHead(200).end(JSON.stringify({ devices }));
    } catch {
      res.writeHead(503).end(JSON.stringify({ error: "ADB unavailable. Install Android Platform Tools and ensure adb is on PATH." }));
    }
    return;
  }
  res.writeHead(404).end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, HOST, () => {
  console.log("MultiPhone Hub local agent listening at http://" + HOST + ":" + PORT);
  console.log("Pairing token (keep private; do not share or commit):");
  console.log(TOKEN);
  console.log("Only local connections are accepted. Device commands are not enabled in this milestone.");
});
