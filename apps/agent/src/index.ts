import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const HOST = "127.0.0.1";
const PORT = Number(process.env.AGENT_PORT ?? 47831);
const TOKEN = process.env.AGENT_TOKEN ?? randomBytes(32).toString("hex");
const ALLOWED_ORIGINS = new Set(
  (process.env.AGENT_ALLOWED_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const ADB = process.env.ADB_PATH ?? "adb";
const MAX_BODY_BYTES = 4096;

const ACTIONS = {
  home: "KEYCODE_HOME",
  back: "KEYCODE_BACK",
  recents: "KEYCODE_APP_SWITCH",
  volumeUp: "KEYCODE_VOLUME_UP",
  volumeDown: "KEYCODE_VOLUME_DOWN",
} as const;

type Device = { id: string; state: string; model?: string };
type Action = keyof typeof ACTIONS;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(body));
}

function authorized(value: string | undefined): boolean {
  if (!value?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(value.slice(7));
  const expected = Buffer.from(TOKEN);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

async function listDevices(): Promise<Device[]> {
  const { stdout } = await execFileAsync(ADB, ["devices", "-l"], {
    timeout: 8000,
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  });

  return stdout
    .split(/\r?\n/)
    .slice(1)
    .filter((line) => line.trim() && !line.startsWith("*"))
    .map((line) => {
      const [id, state, ...details] = line.trim().split(/\s+/);
      const model = details.find((part) => part.startsWith("model:"))?.slice(6);
      return { id, state, ...(model ? { model } : {}) };
    });
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body too large");
    chunks.push(buffer);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function performAction(deviceId: string, action: Action): Promise<void> {
  const devices = await listDevices();
  const device = devices.find((item) => item.id === deviceId);

  if (!device) {
    const error = new Error("Device not found");
    error.name = "DeviceNotFoundError";
    throw error;
  }
  if (device.state !== "device") {
    const error = new Error("Device is not authorized or ready");
    error.name = "DeviceNotReadyError";
    throw error;
  }

  // The only executable arguments come from the fixed allowlist above.
  await execFileAsync(
    ADB,
    ["-s", device.id, "shell", "input", "keyevent", ACTIONS[action]],
    { timeout: 8000, windowsHide: true, maxBuffer: 1024 * 1024 },
  );
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  if (!authorized(req.headers.authorization)) {
    sendJson(res, 401, { error: "Unauthorized" });
    return;
  }

  let pathname: string;
  try {
    pathname = new URL(req.url ?? "/", `http://${HOST}`).pathname;
  } catch {
    sendJson(res, 400, { error: "Invalid request URL" });
    return;
  }

  if (req.method === "GET" && pathname === "/health") {
    sendJson(res, 200, { status: "ok", service: "multiphone-local-agent" });
    return;
  }

  if (req.method === "GET" && pathname === "/api/devices") {
    try {
      sendJson(res, 200, { devices: await listDevices() });
    } catch {
      sendJson(res, 503, {
        error: "ADB unavailable. Install Android Platform Tools and ensure adb is on PATH.",
      });
    }
    return;
  }

  const actionMatch = pathname.match(/^\/api\/devices\/([^/]+)\/actions$/);
  if (req.method === "POST" && actionMatch) {
    let deviceId: string;
    try {
      deviceId = decodeURIComponent(actionMatch[1]);
    } catch {
      sendJson(res, 400, { error: "Invalid device identifier" });
      return;
    }

    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      const status = error instanceof Error && error.message === "Request body too large" ? 413 : 400;
      sendJson(res, status, { error: status === 413 ? "Request body too large" : "Invalid JSON body" });
      return;
    }

    const action = typeof body === "object" && body !== null && "action" in body
      ? (body as { action?: unknown }).action
      : undefined;

    if (typeof action !== "string" || !Object.hasOwn(ACTIONS, action)) {
      sendJson(res, 400, { error: "Unsupported action", allowedActions: Object.keys(ACTIONS) });
      return;
    }

    try {
      await performAction(deviceId, action as Action);
      sendJson(res, 200, { ok: true, deviceId, action });
    } catch (error) {
      if (error instanceof Error && error.name === "DeviceNotFoundError") {
        sendJson(res, 404, { error: error.message });
      } else if (error instanceof Error && error.name === "DeviceNotReadyError") {
        sendJson(res, 409, { error: error.message });
      } else {
        sendJson(res, 502, { error: "ADB could not complete the device action" });
      }
    }
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

if (!Number.isInteger(PORT) || PORT < 1024 || PORT > 65535) {
  throw new Error("AGENT_PORT must be an integer between 1024 and 65535");
}
if (TOKEN.length < 32) {
  throw new Error("AGENT_TOKEN must contain at least 32 characters");
}

server.listen(PORT, HOST, () => {
  console.log(`MultiPhone Hub local agent listening at http://${HOST}:${PORT}`);
  console.log("Private bearer token (keep secret; never commit or share):");
  console.log(TOKEN);
  console.log("Loopback-only mode. Allowed actions: " + Object.keys(ACTIONS).join(", "));
});
