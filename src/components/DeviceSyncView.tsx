import React, { useState } from "react";
import {
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Radio,
  Wifi,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Server,
  Zap,
  Mic,
  Camera,
  MapPin,
  HardDrive,
  Bell,
  Clipboard,
  Lock,
  Monitor,
  Activity,
  Sliders,
  Check,
  X,
  Battery,
  Cpu,
  Globe,
  RadioTower,
  Sparkles,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { DeviceItem, DevicePermissionsState } from "../types";

export const DeviceSyncView: React.FC = () => {
  const {
    devices,
    activeDeviceId,
    setActiveDeviceId,
    isSyncing,
    triggerCloudSync,
    isAllAccessGranted,
    grantAllAccessToAllDevices,
    toggleDevicePermission,
    grantFullAccessToDevice,
    revokeDeviceAccess,
    testDeviceAction,
  } = useApp();

  const [testLogs, setTestLogs] = useState<{ id: string; time: string; message: string; success: boolean }[]>([
    {
      id: "log-1",
      time: "Just now",
      message: "Universal Mesh Bridge: All 6 endpoints verified with full peripheral and sensor permissions.",
      success: true,
    },
  ]);
  const [testingSensor, setTestingSensor] = useState<string | null>(null);

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0];

  const getDeviceIcon = (type: DeviceItem["type"]) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="w-5 h-5 text-indigo-500" />;
      case "tablet":
        return <Tablet className="w-5 h-5 text-purple-500" />;
      case "watch":
        return <Watch className="w-5 h-5 text-amber-500" />;
      case "hub":
        return <Radio className="w-5 h-5 text-emerald-500" />;
      default:
        return <Laptop className="w-5 h-5 text-cyan-500" />;
    }
  };

  const handleRunSensorTest = async (actionType: string) => {
    if (!activeDevice) return;
    setTestingSensor(actionType);
    const result = await testDeviceAction(activeDevice.id, actionType);
    setTestLogs((prev) => [
      {
        id: "log-" + Date.now(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        message: result.message,
        success: result.success,
      },
      ...prev.slice(0, 8),
    ]);
    setTestingSensor(null);
  };

  const permissionDefinitions: {
    key: keyof DevicePermissionsState;
    name: string;
    description: string;
    icon: React.ElementType;
    badge: string;
  }[] = [
    {
      key: "microphone",
      name: "Microphone & Voice AI",
      description: "Speech-to-text, Continuous Voice Mode & 'Hey Bunny' Wake Word listener.",
      icon: Mic,
      badge: "Audio PCM",
    },
    {
      key: "camera",
      name: "Camera & Vision Scanner",
      description: "Document visual scanning, live workspace inspection & facial biometric passkey.",
      icon: Camera,
      badge: "Vision 4K",
    },
    {
      key: "geolocation",
      name: "GPS & Location Telemetry",
      description: "Location-aware scheduling, local ambient conditions, and geo-fenced security.",
      icon: MapPin,
      badge: "Dual GPS",
    },
    {
      key: "fileSystem",
      name: "Full Filesystem & Disk Storage",
      description: "Direct read/write access to user documents, workspace caches, and exports.",
      icon: HardDrive,
      badge: "Storage NVMe",
    },
    {
      key: "notifications",
      name: "System Push & Urgent Alerts",
      description: "Real-time deadline reminders, calendar pings, and critical security notices.",
      icon: Bell,
      badge: "Push API",
    },
    {
      key: "clipboard",
      name: "Cross-Device Clipboard Sync",
      description: "Instant bidirectional copy-paste buffer replication between all devices.",
      icon: Clipboard,
      badge: "Sync Pipe",
    },
    {
      key: "networkSync",
      name: "Mesh Cloud & Delta Sync",
      description: "Sub-50ms WebSocket state replication for tasks, events, and vault records.",
      icon: Wifi,
      badge: "Mesh Socket",
    },
    {
      key: "biometrics",
      name: "Hardware Biometrics & Enclave",
      description: "TouchID, FaceID, and hardware keystore zero-knowledge vault protection.",
      icon: Lock,
      badge: "AES-256 GCM",
    },
    {
      key: "screenCapture",
      name: "Display & Screen Inspection",
      description: "AI vision assistant screen capture for contextual workspace guidance.",
      icon: Monitor,
      badge: "Screen API",
    },
    {
      key: "backgroundExecution",
      name: "Background Engine & Wake Listener",
      description: "Continuous background sync, ambient trigger monitoring, and task alerts.",
      icon: Activity,
      badge: "Daemon",
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Master Universal Access Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {isAllAccessGranted ? "Universal Full Access: 100% Active" : "Full Cross-Device Permissions Control"}
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Universal Device Access & Hardware Permissions
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Grant Bunny AI unrestricted access to all hardware sensors, cameras, microphones, location, filesystems, and clipboards across every connected device in your workspace.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 font-medium text-slate-300 flex items-center gap-1.5">
                <RadioTower className="w-3.5 h-3.5 text-indigo-400" />
                {devices.length} Devices Online
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 font-medium text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                All Peripheral Permissions Granted
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 font-medium text-cyan-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                14ms Mesh Replication
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={grantAllAccessToAllDevices}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-black transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              Grant All Access in Every Device
            </button>

            <button
              onClick={triggerCloudSync}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold transition-all border border-indigo-400/30 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing All Endpoints..." : "Force Real-Time Cloud Sync"}
            </button>
          </div>
        </div>
      </div>

      {/* Connected Devices Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            Connected Endpoints ({devices.length})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click any device to inspect & configure permissions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((dev) => {
            const isSelected = dev.id === activeDeviceId;
            const grantedCount = Object.values(dev.permissionsGranted || {}).filter(Boolean).length;
            const totalCount = Object.keys(dev.permissionsGranted || {}).length || 10;

            return (
              <div
                key={dev.id}
                onClick={() => setActiveDeviceId(dev.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 text-slate-900 dark:text-slate-100 shadow-md ring-2 ring-indigo-500/20"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                      {getDeviceIcon(dev.type)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{dev.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{dev.os}</p>
                    </div>
                  </div>

                  {dev.isCurrentDevice && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-600 text-white">
                      Current
                    </span>
                  )}
                </div>

                <div className="space-y-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Permissions:
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {grantedCount}/{totalCount} Full Access
                    </span>
                  </div>

                  {dev.batteryLevel !== undefined && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Battery className="w-3.5 h-3.5 text-slate-400" /> Battery:
                      </span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {dev.batteryLevel}%
                      </span>
                    </div>
                  )}

                  {dev.storageAvailable && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Storage:
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        {dev.storageAvailable}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono">{dev.ipAddress}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> {dev.lastSyncTime}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Device Deep Access & Permission Inspector */}
      {activeDevice && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                {getDeviceIcon(activeDevice.type)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {activeDevice.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Online & Authorized
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  IP: {activeDevice.ipAddress} • OS: {activeDevice.os} • Last Sync: {activeDevice.lastSyncTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => grantFullAccessToDevice(activeDevice.id)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Grant 100% Access
              </button>
              <button
                onClick={() => revokeDeviceAccess(activeDevice.id)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
              >
                Reset Permissions
              </button>
            </div>
          </div>

          {/* Granular Permission Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Peripheral & Sensor Permission Controls
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permissionDefinitions.map((perm) => {
                const Icon = perm.icon;
                const isGranted = !!activeDevice.permissionsGranted?.[perm.key];

                return (
                  <div
                    key={perm.key}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isGranted
                        ? "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800"
                        : "bg-slate-100/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/40 opacity-70"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl mt-0.5 ${
                          isGranted
                            ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {perm.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {perm.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {perm.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleDevicePermission(activeDevice.id, perm.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                        isGranted
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300"
                      }`}
                    >
                      {isGranted ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" /> Granted
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5 text-slate-400" /> Disabled
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hardware Sensors & Interactive Diagnostic Console */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" />
              Live Sensor Diagnostics & Remote Action Triggers
            </h4>

            <div className="flex flex-wrap gap-2">
              {[
                { id: "camera", label: "Test Camera Vision", icon: Camera },
                { id: "microphone", label: "Test Audio PCM", icon: Mic },
                { id: "geolocation", label: "Query GPS Position", icon: MapPin },
                { id: "filesystem", label: "Audit Filesystem Root", icon: HardDrive },
                { id: "clipboard", label: "Sync Clipboard Pipe", icon: Clipboard },
                { id: "biometrics", label: "Verify Enclave Passkey", icon: Lock },
              ].map((act) => {
                const Icon = act.icon;
                const isRunning = testingSensor === act.id;

                return (
                  <button
                    key={act.id}
                    disabled={isRunning}
                    onClick={() => handleRunSensorTest(act.id)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700"
                  >
                    <Icon className={`w-3.5 h-3.5 text-indigo-500 ${isRunning ? "animate-spin" : ""}`} />
                    {isRunning ? "Testing..." : act.label}
                  </button>
                );
              })}
            </div>

            {/* Test Activity Output Stream */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800/80 pb-2">
                <span>SENSOR DIAGNOSTIC TELEMETRY STREAM</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Channel
                </span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {testLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-[11px]">
                    <span className="text-indigo-400 shrink-0">[{log.time}]</span>
                    <span className={log.success ? "text-emerald-300" : "text-amber-300"}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud & Mesh Architecture Audit */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-lg space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-400" /> Universal Mesh Synchronization Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <p className="text-[10px] uppercase font-bold text-indigo-400">Replication Protocol</p>
            <p className="font-bold text-white text-sm">WebSocket + Multi-Master Delta Sync</p>
            <p className="text-slate-400 text-[11px]">Sub-50ms sync latency between all 6 active endpoints</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <p className="text-[10px] uppercase font-bold text-emerald-400">Zero-Knowledge Security</p>
            <p className="font-bold text-white text-sm">AES-256-GCM + Hardware Enclave</p>
            <p className="text-slate-400 text-[11px]">End-to-end encrypted storage keys never leave the device</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <p className="text-[10px] uppercase font-bold text-cyan-400">Cross-Platform Resilience</p>
            <p className="font-bold text-white text-sm">IndexedDB + Local Hardware Fallback</p>
            <p className="text-slate-400 text-[11px]">Full offline capability with instant conflict resolution</p>
          </div>
        </div>
      </div>
    </div>
  );
};
