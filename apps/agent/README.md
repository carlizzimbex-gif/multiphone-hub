# MultiPhone Hub — Windows local agent

The local agent runs on the trusted Windows computer, discovers Android devices through ADB, and exposes a small authenticated API on loopback only. It is not exposed to the LAN or internet.

## Requirements

- Node.js 20.9+
- Android SDK Platform Tools (ADB) installed and available on PATH
- USB debugging enabled on each Android device; approve the computer's RSA prompt

## Install from the repository root

```powershell
npm install
```

## Start

In PowerShell, from the repository root:

```powershell
$env:AGENT_TOKEN = (node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")
npm run agent:dev
```

If `AGENT_TOKEN` is omitted, the agent generates a fresh 256-bit token and prints it once at startup. Keep this token private. The API listens only on `127.0.0.1:47831`.

## API

Every request must include:

```http
Authorization: Bearer YOUR_PRIVATE_TOKEN
```

- `GET /health` — agent health.
- `GET /api/devices` — ADB device list.
- `POST /api/devices/{deviceId}/actions` — send one allowlisted action.

Example device discovery:

```powershell
$token = "PASTE_THE_PRIVATE_AGENT_TOKEN_HERE"
Invoke-RestMethod http://127.0.0.1:47831/api/devices -Headers @{ Authorization = "Bearer $token" }
```

Example action:

```powershell
$deviceId = "YOUR_ADB_DEVICE_SERIAL"
$body = @{ action = "home" } | ConvertTo-Json
Invoke-RestMethod "http://127.0.0.1:47831/api/devices/$([uri]::EscapeDataString($deviceId))/actions" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body $body
```

Allowed actions:

- `home` — Android Home key
- `back` — Android Back key
- `recents` — Recent apps
- `volumeUp` — volume up
- `volumeDown` — volume down

The agent verifies the device is currently connected and authorized by ADB before sending an action.

## Configuration

- `AGENT_PORT` — optional port; default `47831`, allowed range 1024–65535.
- `AGENT_TOKEN` — optional private bearer token; must be at least 32 characters. If omitted, a random token is generated.
- `AGENT_ALLOWED_ORIGINS` — comma-separated exact browser origins; defaults to `http://localhost:3000`.
- `ADB_PATH` — optional full path to `adb.exe` if ADB is not on PATH.

## Security

- Loopback binding only; never expose ADB or this agent to the public internet.
- Bearer token required for every endpoint.
- CORS allows only configured exact origins.
- Request bodies are size-limited.
- Only five fixed Android key events are supported; arbitrary shell commands are not accepted.
- Do not put the token in browser bundles, Git, screenshots, or public messages.
- The hosted dashboard is not yet paired to this agent. A separate authenticated relay/pairing design is required before remote control from Vercel.
