# MultiPhone Hub

A local-first control center for managing multiple Android devices from one computer.

## Current status

- Responsive Next.js dashboard is deployed and still uses demonstration device data.
- The Windows local agent can discover Android devices with ADB and execute a small, fixed set of authenticated device actions.
- The dashboard is not yet paired to the agent; hosted browser-to-desktop relay and live screen streaming are future milestones.

## Architecture

- **Web dashboard:** Next.js + React + TypeScript, hosted on Vercel.
- **Desktop agent:** Node.js/TypeScript in `apps/agent`, running on the trusted Windows computer.
- **Android bridge:** Android Debug Bridge (ADB) over USB or Wi-Fi.
- **Screen streaming:** scrcpy integration is planned for a later milestone.
- **Realtime coordination:** a separately authenticated relay/pairing service is planned.

The hosted web app cannot access a computer's USB devices directly. The desktop agent is the bridge between the trusted computer and ADB. Do not expose the agent or ADB port to the public internet.

## Requirements

- Node.js 20.9+
- npm
- Android SDK Platform Tools (ADB) installed and available on PATH
- Android USB debugging enabled; approve the computer's RSA prompt on each phone

## Install

From the repository root:

```powershell
npm install
```

## Run the dashboard locally

```powershell
npm run dev
```

Open http://localhost:3000.

## Run the Windows local agent

In a separate PowerShell window, from the repository root:

```powershell
$env:AGENT_TOKEN = (node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")
npm run agent:dev
```

The agent prints the generated private token at startup if `AGENT_TOKEN` is not set. Keep it private. It listens only on `127.0.0.1:47831`.

Check that ADB sees the connected phones:

```powershell
adb devices
```

Check the agent (replace the token with the one printed in the agent terminal):

```powershell
$token = "PASTE_THE_PRIVATE_AGENT_TOKEN_HERE"
Invoke-RestMethod http://127.0.0.1:47831/api/devices -Headers @{ Authorization = "Bearer $token" }
```

Send a basic action to one connected device:

```powershell
$deviceId = "YOUR_ADB_DEVICE_SERIAL"
$body = @{ action = "home" } | ConvertTo-Json
Invoke-RestMethod "http://127.0.0.1:47831/api/devices/$([uri]::EscapeDataString($deviceId))/actions" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body $body
```

Allowed actions: `home`, `back`, `recents`, `volumeUp`, and `volumeDown`.

## Scripts

- `npm run dev` — dashboard development server
- `npm run build` — dashboard production build
- `npm run lint` — dashboard lint
- `npm run typecheck` — dashboard TypeScript check
- `npm run agent:dev` — local agent in watch mode
- `npm run agent:build` — compile the local agent
- `npm run agent:start` — start the compiled local agent
- `npm run agent:typecheck` — local agent TypeScript check

## Security boundaries

- Agent binds to loopback only (`127.0.0.1`); do not change this to `0.0.0.0`.
- A bearer token is required for every API route.
- CORS defaults to `http://localhost:3000`; add only trusted exact origins with `AGENT_ALLOWED_ORIGINS`.
- Device actions use a strict allowlist. Arbitrary shell commands are not accepted.
- A device must be visible to ADB and in the `device` state before an action is sent.
- Never put the agent token in frontend code, Git, screenshots, or public messages.
- The hosted dashboard is not yet connected to the local agent. A secure relay and pairing flow are required before remote browser control.

## Roadmap

1. Dashboard foundation — deployed.
2. Local agent discovery and safe basic actions — implemented in source; requires local Windows testing.
3. Secure dashboard-to-agent pairing and live screen previews.
4. Independent device control and synchronized group commands.
5. Authentication, audit log, reliability, and deployment hardening.
