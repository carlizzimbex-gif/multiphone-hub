# MultiPhone Hub

A local-first control center for managing multiple Android devices from one computer.

## Current status

The first milestone is a responsive dashboard preview. Device entries and quick actions are currently demo data; no real Android commands are sent yet.

## Architecture

- **Web dashboard:** Next.js + React + TypeScript.
- **Desktop agent (foundation added):** Node.js/TypeScript process in `apps/agent`, running on the trusted Windows computer. It currently discovers Android devices through ADB; remote pairing, live streaming, and device actions remain future milestones.
- **Android bridge:** Android Debug Bridge (ADB) over USB or Wi-Fi.
- **Screen streaming (planned):** scrcpy integration through the local agent.
- **Realtime coordination (planned):** authenticated realtime channel for dashboard and agent events.

The hosted web app cannot access a computer's USB devices directly. The desktop agent is the bridge between the web dashboard and ADB.

## Development

Requirements: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — production server
- `npm run lint` — lint
- `npm run typecheck` — TypeScript check

## Planned milestones

1. Dashboard foundation (current).
2. Local desktop agent foundation with loopback-only ADB discovery (implemented; requires local installation and testing).
3. Live screen previews for connected Android devices.
4. Independent device controls and synchronized group commands.
5. Authentication, pairing, audit log, and deployment hardening.

## Security principles

- Pair devices only after explicit approval on the Android device.
- Never expose ADB directly to the public internet.
- Keep agent credentials out of browser code and source control.
- Require authenticated, scoped commands for device actions.
