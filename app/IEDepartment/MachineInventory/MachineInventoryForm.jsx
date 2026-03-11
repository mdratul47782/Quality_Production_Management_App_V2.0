"use client";
// app/IEDepartment/MachineInventory/MachineInventoryForm.jsx

import { useState, useEffect, useCallback } from "react";

const MACHINE_NAMES = [
  "SINGLE NDL (PLAIN M/C)",
  "SINGLE NDL (TOP FEED) M/C",
  "SINGLE NDL (NDL FEED) M/C",
  "SINGLE NDL (CUFFS) M/C",
  "DLM SINGLE NEEDLE VERTICAL CUTTER",
  "DOUBLE NDL",
  "POCKET WELL (APW) M/C",
  "3/8 T CHAIN STITCH (3 NDL) M/C",
  "INTER LOCK (2 NDL 5TH) M/C",
  "OVER LOCK (2 NDL 4TH) M/C",
  "BARTACK M/C",
  "KANSAI",
  "EYELET HOLE M/C",
];

const FLOOR_OPTIONS = [
  { value: "A-2",     label: "A-2"     },
  { value: "B-2",     label: "B-2"     },
  { value: "A-3",     label: "A-3"     },
  { value: "B-3",     label: "B-3"     },
  { value: "A-4",     label: "A-4"     },
  { value: "B-4",     label: "B-4"     },
  { value: "A-5",     label: "A-5"     },
  { value: "B-5",     label: "B-5"     },
  { value: "A-6",     label: "A-6"     },
  { value: "B-6",     label: "B-6"     },
  { value: "C-4",     label: "C-4"     },
  { value: "K-3",     label: "K-3"     },
  { value: "SMD/CAD", label: "SMD/CAD" },
  { value: "New",     label: "New"     },
  { value: "Others",  label: "Others"  },
];

const STATUS_OPTIONS = [
  { value: "Running",    label: "Running",    color: "emerald", icon: "▶" },
  { value: "Idle",       label: "Idle",       color: "amber",   icon: "⏸" },
  { value: "Repairable", label: "Repairable", color: "orange",  icon: "🔧" },
  { value: "Damage",     label: "Damage",     color: "red",     icon: "✕"  },
];

const STATUS_STYLE = {
  Running:    { badge: "bg-emerald-950 border-emerald-700 text-emerald-300", ring: "focus:border-emerald-500 focus:ring-emerald-500/20", border: "border-emerald-800" },
  Idle:       { badge: "bg-amber-950 border-amber-700 text-amber-300",       ring: "focus:border-amber-500 focus:ring-amber-500/20",     border: "border-amber-800"   },
  Repairable: { badge: "bg-orange-950 border-orange-700 text-orange-300",    ring: "focus:border-orange-500 focus:ring-orange-500/20",   border: "border-orange-800"  },
  Damage:     { badge: "bg-red-950 border-red-700 text-red-300",             ring: "focus:border-red-500 focus:ring-red-500/20",         border: "border-red-800"     },
};

export default function MachineInventoryForm({ onSaveSuccess, factory = "" }) {
  const [machineName,   setMachineName]   = useState("");
  const [serialNumber,  setSerialNumber]  = useState("");
  const [floorName,     setFloorName]     = useState("");
  const [status,        setStatus]        = useState("Running");

  // Existing units for selected machine (for serial autocomplete / preview)
  const [existingUnits, setExistingUnits] = useState([]);
  const [fetchingUnits, setFetchingUnits] = useState(false);

  // When serial is found, show its current location+status
  const [currentUnit,   setCurrentUnit]   = useState(null);

  const [saving,  setSaving]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast,   setToast]   = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load all units for selected machine ──────────────────────────────────────
  const loadMachineUnits = useCallback(async (name) => {
    if (!name) { setExistingUnits([]); return; }
    setFetchingUnits(true);
    try {
      const qs = new URLSearchParams({ name });
      if (factory) qs.set("factory", factory);
      const res  = await fetch(`/api/machines?${qs}`);
      const json = await res.json();
      if (json.success && json.data) {
        setExistingUnits(json.data.units ?? []);
      } else {
        setExistingUnits([]);
      }
    } catch {
      setExistingUnits([]);
    } finally {
      setFetchingUnits(false);
    }
  }, [factory]);

  useEffect(() => {
    loadMachineUnits(machineName);
    setSerialNumber("");
    setFloorName("");
    setStatus("Running");
    setCurrentUnit(null);
  }, [machineName, loadMachineUnits]);

  // ── When serial number changes, auto-fill floor+status if unit exists ────────
  useEffect(() => {
    if (!serialNumber.trim()) { setCurrentUnit(null); return; }
    const found = existingUnits.find(
      (u) => u.serialNumber.toLowerCase() === serialNumber.trim().toLowerCase()
    );
    if (found) {
      setCurrentUnit(found);
      setFloorName(found.floorName);
      setStatus(found.status);
    } else {
      setCurrentUnit(null);
      // Don't reset floor/status so user can choose for new unit
    }
  }, [serialNumber, existingUnits]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!machineName || !serialNumber.trim() || !floorName || !status) {
      showToast("error", "সব ঘর পূরণ করা আবশ্যক।");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/machines", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factory,
          machineName,
          serialNumber: serialNumber.trim().toUpperCase(),
          floorName,
          status,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message || "সফলভাবে সেভ হয়েছে!");
        await loadMachineUnits(machineName);
        setSerialNumber("");
        setFloorName("");
        setStatus("Running");
        setCurrentUnit(null);
        if (onSaveSuccess) onSaveSuccess();
      } else {
        showToast("error", json.message || "সেভ করতে সমস্যা হয়েছে।");
      }
    } catch {
      showToast("error", "নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete unit ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!currentUnit) return;
    if (!confirm(`"${serialNumber}" মুছে ফেলবেন?`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/machines", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factory, machineName, serialNumber: serialNumber.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Machine unit মুছে ফেলা হয়েছে।");
        await loadMachineUnits(machineName);
        setSerialNumber("");
        setFloorName("");
        setStatus("Running");
        setCurrentUnit(null);
        if (onSaveSuccess) onSaveSuccess();
      } else {
        showToast("error", json.message);
      }
    } catch {
      showToast("error", "নেটওয়ার্ক সমস্যা।");
    } finally {
      setDeleting(false);
    }
  };

  const handleReset = () => {
    setMachineName("");
    setSerialNumber("");
    setFloorName("");
    setStatus("Running");
    setExistingUnits([]);
    setCurrentUnit(null);
  };

  // ── Stats from loaded units ──────────────────────────────────────────────────
  const unitStats = existingUnits.reduce(
    (acc, u) => { acc[u.status] = (acc[u.status] || 0) + 1; return acc; },
    {}
  );
  const totalUnits = existingUnits.length;

  const isNew     = serialNumber.trim() && !currentUnit;
  const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.Running;

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-start justify-center px-4 py-10 font-mono">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg text-sm font-semibold shadow-2xl border transition-all duration-300 ${
          toast.type === "success"
            ? "bg-emerald-950 border-emerald-500 text-emerald-300"
            : "bg-red-950 border-red-500 text-red-300"
        }`}>
          {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-1 bg-cyan-400 rounded-full" />
            <span className="text-xs tracking-[0.3em] text-cyan-400 uppercase">IE Department</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Machine Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">প্রতিটি machine unit-এর serial number ও status track করুন</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit}
          className="bg-[#161b27] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">

          <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />

          <div className="p-7 space-y-6">

            {/* ── Machine Name ── */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Machine Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select value={machineName} onChange={(e) => setMachineName(e.target.value)}
                  className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-4 py-3 text-sm appearance-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors">
                  <option value="">— Machine select করুন —</option>
                  {MACHINE_NAMES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">▾</div>
              </div>
            </div>

            {/* ── Machine type stats (shown after machine selected) ── */}
            {machineName && (
              <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-widest">
                    {fetchingUnits ? (
                      <span className="text-cyan-400 animate-pulse">লোড হচ্ছে...</span>
                    ) : (
                      <span>মোট {totalUnits}টি unit নিবন্ধিত</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(({ value, label, color }) => {
                    const count = unitStats[value] || 0;
                    return (
                      <span key={value}
                        className={`text-xs font-semibold px-3 py-1 rounded-full border
                          ${value === "Running"    ? "bg-emerald-950 border-emerald-800 text-emerald-300" : ""}
                          ${value === "Idle"       ? "bg-amber-950 border-amber-800 text-amber-300"       : ""}
                          ${value === "Repairable" ? "bg-orange-950 border-orange-800 text-orange-300"    : ""}
                          ${value === "Damage"     ? "bg-red-950 border-red-800 text-red-300"             : ""}
                        `}>
                        {label}: {count}
                      </span>
                    );
                  })}
                </div>

                {/* Existing serials quick reference */}
                {existingUnits.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {existingUnits.map((u) => (
                      <button
                        key={u.serialNumber}
                        type="button"
                        onClick={() => setSerialNumber(u.serialNumber)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all
                          ${serialNumber === u.serialNumber
                            ? "bg-cyan-900 border-cyan-500 text-cyan-200"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                          }`}
                        title={`${u.floorName} — ${u.status}`}
                      >
                        {u.serialNumber}
                        <span className={`ml-1
                          ${u.status === "Running"    ? "text-emerald-400" : ""}
                          ${u.status === "Idle"       ? "text-amber-400"   : ""}
                          ${u.status === "Repairable" ? "text-orange-400"  : ""}
                          ${u.status === "Damage"     ? "text-red-400"     : ""}
                        `}>•</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Serial Number ── */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Serial Number <span className="text-red-400">*</span>
                {isNew && (
                  <span className="ml-2 text-cyan-400 normal-case tracking-normal font-normal">
                    — নতুন unit যোগ হবে
                  </span>
                )}
                {currentUnit && (
                  <span className="ml-2 text-amber-400 normal-case tracking-normal font-normal">
                    — বিদ্যমান unit (আপডেট হবে)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="যেমন: SN-001, M-042"
                className={`w-full bg-[#0f1117] border text-white rounded-lg px-4 py-3 text-sm font-mono uppercase
                  focus:outline-none focus:ring-1 transition-colors placeholder:text-slate-600
                  ${currentUnit ? "border-amber-700 focus:border-amber-500 focus:ring-amber-500/20" : "border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/30"}
                `}
              />

              {/* Current unit info card */}
              {currentUnit && (
                <div className="mt-2 flex items-center gap-3 bg-[#0f1117] border border-amber-900/50 rounded-lg px-4 py-2.5">
                  <span className="text-slate-500 text-xs">বর্তমান অবস্থান:</span>
                  <span className="text-white text-xs font-semibold">{currentUnit.floorName}</span>
                  <span className="text-slate-600">•</span>
                  <span className={`text-xs font-bold
                    ${currentUnit.status === "Running"    ? "text-emerald-400" : ""}
                    ${currentUnit.status === "Idle"       ? "text-amber-400"   : ""}
                    ${currentUnit.status === "Repairable" ? "text-orange-400"  : ""}
                    ${currentUnit.status === "Damage"     ? "text-red-400"     : ""}
                  `}>
                    {currentUnit.status}
                  </span>
                  <span className="text-slate-600 ml-auto">→ নিচে পরিবর্তন করুন</span>
                </div>
              )}
            </div>

            {/* ── Floor + Status row ── */}
            <div className="grid grid-cols-2 gap-4">

              {/* Floor Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  Floor <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select value={floorName} onChange={(e) => setFloorName(e.target.value)}
                    className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-4 py-3 text-sm appearance-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors">
                    <option value="">— Floor —</option>
                    {FLOOR_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">▾</div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  Status <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select value={status} onChange={(e) => setStatus(e.target.value)}
                    className={`w-full bg-[#0f1117] border text-white rounded-lg px-4 py-3 text-sm appearance-none
                      focus:outline-none focus:ring-1 transition-colors ${statusStyle.ring} ${statusStyle.border}`}>
                    {STATUS_OPTIONS.map(({ value, label, icon }) => (
                      <option key={value} value={value}>{icon} {label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">▾</div>
                </div>
              </div>
            </div>

            {/* ── Summary preview ── */}
            {machineName && serialNumber.trim() && floorName && status && (
              <div className={`border rounded-xl p-4 ${statusStyle.badge}`}>
                <p className="text-[10px] uppercase tracking-widest opacity-60 mb-2">
                  {currentUnit ? "আপডেট preview" : "নতুন entry preview"}
                </p>
                <div className="flex flex-wrap gap-4 items-center">
                  <div>
                    <span className="text-[10px] opacity-60">Machine</span>
                    <p className="text-xs font-bold truncate max-w-[160px]">{machineName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] opacity-60">Serial</span>
                    <p className="text-sm font-mono font-bold">{serialNumber.trim().toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] opacity-60">Floor</span>
                    <p className="text-sm font-bold">{floorName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] opacity-60">Status</span>
                    <p className="text-sm font-bold">{status}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="px-7 pb-7 flex gap-3">
            <button type="submit" disabled={saving}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#0f1117] font-bold py-3 rounded-xl text-sm tracking-widest uppercase transition-all duration-200 shadow-lg shadow-cyan-500/20">
              {saving ? "সেভ হচ্ছে..." : currentUnit ? "আপডেট করুন" : "যোগ করুন"}
            </button>

            {currentUnit && (
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="px-5 bg-transparent border border-red-800 hover:border-red-500 text-red-400 hover:text-red-300 hover:bg-red-950/30 font-semibold py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-40">
                {deleting ? "..." : "মুছুন"}
              </button>
            )}

            <button type="button" onClick={handleReset}
              className="px-5 bg-transparent border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 font-semibold py-3 rounded-xl text-sm tracking-widest uppercase transition-all duration-200">
              রিসেট
            </button>
          </div>
        </form>

        <p className="text-center text-slate-600 text-xs mt-4">
          Serial number type করলে বিদ্যমান unit স্বয়ংক্রিয়ভাবে লোড হবে।
        </p>
      </div>
    </div>
  );
}