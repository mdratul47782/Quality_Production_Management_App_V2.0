"use client";
// app/IE Department/Machine Inventory/MachineInventoryForm.jsx

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

// ─── FIXED: option value now matches FLOOR_COLS dbKey exactly ───────────────
// Table expects: "A-2","B-2","A-3","B-3","A-4","B-4","A-5","B-5",
//                "A-6","B-6","C-4","K-3","SMD/CAD","Others","New"
const FLOOR_OPTIONS = [
  { value: "A-2",     label: "A-2"     },
  { value: "B-2",     label: "B-2"     },
  { value: "A-3",     label: "A-3"     },
  { value: "B-3",     label: "B-3"     },
  { value: "A-4",     label: "A-4"     },
  { value: "B-4",     label: "B-4"     },
  { value: "A-5",     label: "A-5"     },
  { value: "B-5",     label: "B-5"     },
  { value: "A-6",     label: "A-6"     },  // ← was "A6"
  { value: "B-6",     label: "B-6"     },  // ← was "B6"
  { value: "C-4",     label: "C-4"     },  // ← was "C4"
  { value: "K-3",     label: "K-3"     },  // ← was "K3"
  { value: "SMD/CAD", label: "SMD/CAD" },  // ← was "SMD/Cad"
  { value: "New",     label: "New"     },
  { value: "Others",  label: "Others"  },
];

const EMPTY_FLOOR_DATA = {
  running: "",
  idle: "",
  repairable: "",
  damage: "",
};

export default function MachineInventoryForm({ onSaveSuccess, factory = "" }) {
  const [machineName, setMachineName] = useState("");
  const [floorName, setFloorName]     = useState("");
  const [floorData, setFloorData]     = useState({ ...EMPTY_FLOOR_DATA });

  const [loading, setLoading]         = useState(false);
  const [fetchingFloor, setFetchingFloor] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Load machine + floor data ──────────────────────────────────────────────
  const loadFloorData = useCallback(async (name, floor) => {
    if (!name || !floor) return;
    setFetchingFloor(true);
    try {
      const qs  = new URLSearchParams({ name });
      if (factory) qs.set("factory", factory);
      const res  = await fetch(`/api/machines?${qs}`);
      const json = await res.json();
      if (json.success && json.data) {
        // floorName in DB is already the canonical value (e.g. "A-6")
        const existing = json.data.floors?.find((f) => f.floorName === floor);
        if (existing) {
          setFloorData({
            running:    existing.running    ?? "",
            idle:       existing.idle       ?? "",
            repairable: existing.repairable ?? "",
            damage:     existing.damage     ?? "",
          });
        } else {
          setFloorData({ ...EMPTY_FLOOR_DATA });
        }
      } else {
        setFloorData({ ...EMPTY_FLOOR_DATA });
      }
    } catch {
      setFloorData({ ...EMPTY_FLOOR_DATA });
    } finally {
      setFetchingFloor(false);
    }
  }, [factory]);

  useEffect(() => {
    if (machineName && floorName) {
      loadFloorData(machineName, floorName);
    } else {
      setFloorData({ ...EMPTY_FLOOR_DATA });
    }
  }, [floorName, machineName, loadFloorData]);

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!machineName || !floorName) {
      showToast("error", "Machine Name এবং Floor Name বাধ্যতামূলক।");
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
          floorName,           // ← already canonical, e.g. "A-6", "SMD/CAD"
          running:    Number(floorData.running)    || 0,
          idle:       Number(floorData.idle)       || 0,
          repairable: Number(floorData.repairable) || 0,
          damage:     Number(floorData.damage)     || 0,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message || "সফলভাবে সেভ হয়েছে!");
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

  const handleReset = () => {
    setMachineName("");
    setFloorName("");
    setFloorData({ ...EMPTY_FLOOR_DATA });
  };

  const isBusy = loading || fetchingFloor;

  const autoStock =
    (Number(floorData.idle)       || 0) +
    (Number(floorData.running)    || 0) +
    (Number(floorData.repairable) || 0) -
    (Number(floorData.damage)     || 0);

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
          <p className="text-slate-500 text-sm mt-1">Floor-wise machine status update করুন</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit}
          className="bg-[#161b27] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">

          <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />

          <div className="p-7 space-y-6">

            {/* Machine Name */}
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

            {/* Auto Stock Qty */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Stock Quantity
                {loading && (
                  <span className="ml-2 text-cyan-400 normal-case tracking-normal animate-pulse">লোড হচ্ছে...</span>
                )}
                <span className="ml-2 text-slate-600 normal-case tracking-normal font-normal">
                  (Idle + Running + Repairable − Damage)
                </span>
              </label>
              <div className="w-full bg-[#0a0d14] border border-slate-700 text-cyan-300 rounded-lg px-4 py-3 text-sm font-bold flex items-center justify-between">
                <span>{autoStock}</span>
                <span className="text-slate-600 text-xs font-normal">auto</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800 pt-2">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">Floor Information</p>
            </div>

            {/* Floor Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Floor Name <span className="text-red-400">*</span>
                {fetchingFloor && (
                  <span className="ml-2 text-cyan-400 normal-case tracking-normal animate-pulse">ডেটা আনছে...</span>
                )}
              </label>
              <div className="relative">
                <select value={floorName} onChange={(e) => setFloorName(e.target.value)}
                  className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-4 py-3 text-sm appearance-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors">
                  <option value="">— Floor select করুন —</option>
                  {FLOOR_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">▾</div>
              </div>
            </div>

            {/* Floor Status Grid */}
            <div className={`grid grid-cols-2 gap-4 transition-opacity duration-300 ${
              isBusy ? "opacity-40 pointer-events-none" : "opacity-100"
            }`}>

              {/* Running */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-emerald-400">Running</label>
                <div className="relative">
                  <input type="number" min="0" value={floorData.running}
                    onChange={(e) => setFloorData((p) => ({ ...p, running: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-[#0f1117] border border-emerald-900 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors placeholder:text-slate-600" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-700 text-xs">▶</span>
                </div>
              </div>

              {/* Idle */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-amber-400">Idle</label>
                <div className="relative">
                  <input type="number" min="0" value={floorData.idle}
                    onChange={(e) => setFloorData((p) => ({ ...p, idle: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-[#0f1117] border border-amber-900 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors placeholder:text-slate-600" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-700 text-xs">⏸</span>
                </div>
              </div>

              {/* Repairable */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-orange-400">Repairable</label>
                <div className="relative">
                  <input type="number" min="0" value={floorData.repairable}
                    onChange={(e) => setFloorData((p) => ({ ...p, repairable: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-[#0f1117] border border-orange-900 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-colors placeholder:text-slate-600" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-700 text-xs">🔧</span>
                </div>
              </div>

              {/* Damage */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-red-400">Damage</label>
                <div className="relative">
                  <input type="number" min="0" value={floorData.damage}
                    onChange={(e) => setFloorData((p) => ({ ...p, damage: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-[#0f1117] border border-red-900 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-colors placeholder:text-slate-600" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-700 text-xs">✕</span>
                </div>
              </div>
            </div>

            {/* Live Summary */}
            {(floorData.running || floorData.idle || floorData.repairable || floorData.damage) ? (
              <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Summary Preview</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Running",    val: floorData.running,    color: "text-emerald-400" },
                    { label: "Idle",       val: floorData.idle,       color: "text-amber-400"   },
                    { label: "Repairable", val: floorData.repairable, color: "text-orange-400"  },
                    { label: "Damage",     val: floorData.damage,     color: "text-red-400"     },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className={`font-bold text-lg ${color}`}>{val || 0}</span>
                      <span className="text-slate-600 text-xs">{label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-slate-300 font-bold text-lg">
                      {(Number(floorData.running) || 0) + (Number(floorData.idle) || 0) + (Number(floorData.repairable) || 0) + (Number(floorData.damage) || 0)}
                    </span>
                    <span className="text-slate-500 text-xs">Total</span>
                  </div>
                </div>
              </div>
            ) : null}

          </div>

          {/* Actions */}
          <div className="px-7 pb-7 flex gap-3">
            <button type="submit" disabled={saving || isBusy}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#0f1117] font-bold py-3 rounded-xl text-sm tracking-widest uppercase transition-all duration-200 shadow-lg shadow-cyan-500/20">
              {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </button>
            <button type="button" onClick={handleReset}
              className="px-6 bg-transparent border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 font-semibold py-3 rounded-xl text-sm tracking-widest uppercase transition-all duration-200">
              রিসেট
            </button>
          </div>
        </form>

        <p className="text-center text-slate-600 text-xs mt-4">
          Machine ও Floor select করলে বিদ্যমান data স্বয়ংক্রিয়ভাবে লোড হবে।
        </p>
      </div>
    </div>
  );
}