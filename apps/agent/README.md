# MultiPhone Hub — Windows local agent foundation

This first agent milestone runs on the trusted Windows computer and discovers Android devices through ADB. It binds to loopback only; it is not exposed to the LAN or internet.

## Requirements

- Node.js 20.9+
- Android SDK Platform Tools (ADB) installed and available on PATH
- USB debugging enabled on each Android device; approve the computer's RSA prompt

## Run in PowerShell

From the repository root:

    cd apps/agent
    npm install
    $env:AGENT_TOKEN = "replace-with-a-long-random-secret"
    npm run dev

In a second PowerShell window, test:

    adb devices

The agent prints a private bearer token at startup. Keep it secret. It is not stored in the repository. The HTTP API listens only on 127.0.0.1:47831.

## API

Send the token in the Authorization header:

- GET /health
- GET /api/devices

Example:

    $token = $env:AGENT_TOKEN
    Invoke-RestMethod http://127.0.0.1:47831/api/devices -Headers @{ Authorization = "Bearer $token" }

## Security boundary

- Loopback binding only; no public ADB or agent port.
- Bearer token required for every endpoint.
- CORS defaults to the local development dashboard origin.
- This milestone only reports device discovery. It does not tap, type, install apps, capture screens, or execute arbitrary shell commands.
- Do not put the token in frontend code, Git, screenshots, or public messages.

For a hosted dashboard, the next milestone must add a separately authenticated relay/pairing flow. Do not expose this local agent directly to the public internet.
