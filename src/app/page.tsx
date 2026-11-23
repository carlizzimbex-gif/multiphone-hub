"use client";

import { useMemo, useState } from "react";
import {
  Activity, Airplay, Battery, Cable, Check, CircleHelp,
  Command, Grid2X2, Layers3, MonitorSmartphone, MoreHorizontal, Play,
  Plus, Radio, RefreshCw, Search, Settings2, ShieldCheck, Smartphone,
  Wifi, WifiOff, Zap,
} from "lucide-react";

type Device = {
  id: string;
  name: string;
  model: string;
  connection: "USB" | "Wi-Fi";
  status: "Connected" | "Offline";
  battery: number;
  selected: boolean;
};

const initialDevices: Device[] = [
  { id: "android-01", name: "Android 01", model: "Device preview", connection: "USB", status: "Connected", battery: 86, selected: true },
  { id: "android-02", name: "Android 02", model: "Device preview", connection: "Wi-Fi", status: "Connected", battery: 64, selected: true },
  { id: "android-03", name: "Android 03", model: "Not connected", connection: "USB", status: "Offline", battery: 0, selected: false },
];

export default function Home() {
  const [devices, setDevices] = useState(initialDevices);
  const [mode, setMode] = useState<"sync" | "independent">("sync");
  const [activeDevice, setActiveDevice] = useState("android-01");
  const [notice, setNotice] = useState("Connect your Android devices to get started.");
  const [search, setSearch] = useState("");

  const connected = devices.filter((device) => device.status === "Connected");
  const selected = devices.filter((device) => device.selected && device.status === "Connected");
  const visibleDevices = useMemo(
    () => devices.filter((device) => device.name.toLowerCase().includes(search.toLowerCase())),
    [devices, search],
  );

  function toggleDevice(id: string) {
    setDevices((current) => current.map((device) => device.id === id ? { ...device, selected: !device.selected } : device));
  }

  function runAction(action: string) {
    setNotice(`“${action}” is a preview action. Install the local agent to control real devices.`);
  }

  return (
    <main className="dashboard-shell">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-white/[0.07] px-5 py-6 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300"><MonitorSmartphone size={21} /></div>
            <div><div className="font-semibold tracking-tight">MultiPhone <span className="text-violet-300">Hub</span></div><div className="text-[11px] text-slate-500">DEVICE CONTROL CENTER</div></div>
          </div>
          <div className="mt-12 space-y-2">
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-[.18em] text-slate-600">WORKSPACE</p>
            <div className="flex items-center gap-3 rounded-xl bg-violet-500/10 px-3 py-3 text-sm text-violet-200"><Grid2X2 size={17} /> Overview</div>
            <div className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400"><Smartphone size={17} /> Devices <span className="ml-auto rounded-md bg-white/[0.06] px-2 py-0.5 text-xs">{devices.length}</span></div>
            <div className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400"><Layers3 size={17} /> Groups</div>
            <div className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400"><Activity size={17} /> Activity</div>
          </div>
          <div className="mt-auto rounded-2xl border border-violet-400/15 bg-violet-400/[0.06] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium"><ShieldCheck size={16} className="text-violet-300" /> Local agent</div>
            <p className="text-xs leading-5 text-slate-400">The desktop agent securely bridges this dashboard to Android devices using ADB.</p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-amber-300"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Not installed</div>
          </div>
          <div className="mt-5 flex items-center gap-3 px-2 text-xs text-slate-500"><Settings2 size={16} /> Settings <CircleHelp size={16} className="ml-auto" /></div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-7 lg:px-9 lg:py-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden"><MonitorSmartphone className="text-violet-300" /><span className="font-semibold">MultiPhone Hub</span></div>
            <div className="hidden lg:block"><p className="text-xs text-slate-500">WORKSPACE / OVERVIEW</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Device command center</h1></div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-400 sm:flex"><span className="h-2 w-2 rounded-full bg-amber-300" /> Agent disconnected</div>
              <button onClick={() => setNotice("Device list refreshed. Real discovery will be enabled by the local agent.")} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"><RefreshCw size={14} /> Refresh</button>
              <button onClick={() => setNotice("Device pairing will be available when the local agent is connected.")} className="flex items-center gap-2 rounded-xl bg-violet-500 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-400"><Plus size={15} /> Add device</button>
            </div>
          </header>

          <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { label: "Total devices", value: devices.length.toString(), icon: Smartphone, sub: "Registered in workspace" },
              { label: "Connected", value: connected.length.toString(), icon: Radio, sub: "USB and wireless" },
              { label: "Selected devices", value: selected.length.toString(), icon: Check, sub: "Ready for group actions" },
              { label: "Agent status", value: "Offline", icon: Zap, sub: "Waiting for desktop agent" },
            ].map((item) => <div key={item.label} className="panel p-4 sm:p-5"><div className="flex items-center justify-between text-xs text-slate-400"><span>{item.label}</span><item.icon size={16} className="text-violet-300" /></div><div className="mt-3 text-2xl font-semibold tracking-tight">{item.value}</div><div className="mt-1 text-[11px] text-slate-500">{item.sub}</div></div>)}
          </div>

          <div className="mt-7 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-w-0 space-y-6">
              <div className="panel overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-5">
                  <div><h2 className="font-semibold">Device fleet</h2><p className="mt-1 text-xs text-slate-500">Manage every Android device from one place.</p></div>
                  <div className="flex items-center gap-1 rounded-xl bg-black/20 p-1">
                    <button onClick={() => setMode("sync")} className={`rounded-lg px-3 py-2 text-xs ${mode === "sync" ? "bg-violet-500/20 text-violet-200" : "text-slate-400"}`}>Synchronized</button>
                    <button onClick={() => setMode("independent")} className={`rounded-lg px-3 py-2 text-xs ${mode === "independent" ? "bg-violet-500/20 text-violet-200" : "text-slate-400"}`}>Independent</button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400"><span className={`h-2 w-2 rounded-full ${mode === "sync" ? "bg-violet-300" : "bg-sky-300"}`} /> {mode === "sync" ? "Actions target all selected devices" : "Choose one device to control"}</div>
                  <div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find device..." className="w-40 rounded-lg border border-white/10 bg-black/20 py-2 pl-8 pr-3 text-xs outline-none focus:border-violet-400/50" /></div>
                </div>
                <div className="space-y-3 px-5 pb-5">
                  {visibleDevices.map((device) => <div key={device.id} className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${activeDevice === device.id ? "border-violet-400/30 bg-violet-400/[0.045]" : "border-white/[0.07] bg-white/[0.015]"}`}>
                    <button onClick={() => toggleDevice(device.id)} aria-label={device.selected ? "Deselect device" : "Select device"} className={`flex h-5 w-5 items-center justify-center rounded-md border ${device.selected ? "border-violet-400 bg-violet-500 text-white" : "border-slate-600"}`}>{device.selected && <Check size={13} />}</button>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-300"><Smartphone size={19} /></div>
                    <button onClick={() => setActiveDevice(device.id)} className="min-w-[110px] flex-1 text-left"><div className="text-sm font-medium">{device.name}</div><div className="mt-0.5 text-[11px] text-slate-500">{device.model}</div></button>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">{device.connection === "USB" ? <Cable size={14} /> : <Wifi size={14} />}{device.connection}</div>
                    <div className="flex min-w-[88px] items-center gap-2 text-[11px]"><span className={`h-1.5 w-1.5 rounded-full ${device.status === "Connected" ? "bg-emerald-400" : "bg-slate-600"}`} /><span className={device.status === "Connected" ? "text-emerald-300" : "text-slate-500"}>{device.status}</span></div>
                    <div className="flex w-16 items-center gap-1.5 text-[11px] text-slate-400"><Battery size={15} />{device.battery ? `${device.battery}%` : "—"}</div>
                    <button onClick={() => setActiveDevice(device.id)} className="rounded-lg p-2 text-slate-500 hover:bg-white/5"><MoreHorizontal size={17} /></button>
                  </div>)}
                  {visibleDevices.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No matching devices.</p>}
                </div>
              </div>

              <div className="panel p-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Quick actions</h2><p className="mt-1 text-xs text-slate-500">Send a command to your selected device target.</p></div><span className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-[11px] text-slate-400">{mode === "sync" ? `${selected.length} targets` : "1 target"}</span></div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[{name:"Open app",icon:Play},{name:"Open website",icon:Airplay},{name:"Sync playback",icon:Radio},{name:"Refresh screens",icon:RefreshCw}].map((action) => <button key={action.name} onClick={() => runAction(action.name)} className="flex flex-col items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-left hover:border-violet-400/30 hover:bg-violet-400/[0.04]"><action.icon size={18} className="text-violet-300" /><span className="text-xs font-medium">{action.name}</span></button>)}
                </div>
                <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5 text-xs text-slate-400">{notice}</div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="panel p-5">
                <div className="flex items-center justify-between"><div><h2 className="font-semibold">Live preview</h2><p className="mt-1 text-xs text-slate-500">Selected device screen</p></div><span className="rounded-md bg-amber-400/10 px-2 py-1 text-[10px] text-amber-300">DEMO</span></div>
                <div className="mx-auto mt-5 w-[min(100%,220px)] rounded-[28px] border-[5px] border-slate-700 bg-slate-950 p-2 shadow-2xl">
                  <div className="device-screen soft-grid flex aspect-[9/17] flex-col items-center justify-center rounded-[20px] px-4 text-center">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Smartphone size={24} className="text-violet-200" /></div>
                    <p className="text-sm font-medium">Waiting for screen</p><p className="mt-2 text-[10px] leading-4 text-slate-400">Connect the local agent to stream a real Android display.</p>
                    <div className="mt-6 flex items-center gap-1.5 text-[9px] text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> NO LIVE FEED</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs"><span className="text-slate-500">Viewing</span><span className="text-slate-300">{devices.find((device) => device.id === activeDevice)?.name ?? "No device"}</span></div>
              </div>
              <div className="panel p-5">
                <h2 className="font-semibold">Connection guide</h2>
                <p className="mt-1 text-xs text-slate-500">Your devices connect through a trusted computer.</p>
                <div className="mt-5 space-y-4">
                  <div className="flex gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300"><Cable size={16}/></div><div><p className="text-xs font-medium">1. Enable USB debugging</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Turn on Developer options on each Android.</p></div></div>
                  <div className="flex gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300"><Command size={16}/></div><div><p className="text-xs font-medium">2. Install desktop agent</p><p className="mt-1 text-[11px] leading-4 text-slate-500">The agent discovers and securely manages devices.</p></div></div>
                  <div className="flex gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300"><Wifi size={16}/></div><div><p className="text-xs font-medium">3. Pair over USB or Wi-Fi</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Approve the Android debugging prompt.</p></div></div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-sky-400/15 bg-sky-400/[0.04] p-4"><WifiOff size={16} className="mt-0.5 shrink-0 text-sky-300"/><p className="text-[11px] leading-5 text-slate-400">This first build is a visual dashboard preview. No device commands are sent until the local agent is implemented and paired.</p></div>
            </aside>
          </div>
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-5 text-[10px] text-slate-600"><span>MultiPhone Hub · MVP foundation</span><span className="flex items-center gap-1.5"><ShieldCheck size={12}/> Local-first device control architecture</span></footer>
        </section>
      </div>
    </main>
  );
}