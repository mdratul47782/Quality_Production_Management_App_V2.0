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
  { value: "Running",    label: "Running",    icon: "▶" },
  { value: "Idle",       label: "Idle",       icon: "⏸" },
  { value: "Repairable", label: "Repairable", icon: "🔧" },
  { value: "Damage",     label: "Damage",     icon: "✕"  },
];

const STATUS_STYLE = {
  Running:    { badge: "bg-emerald-950 border-emerald-700 text-emerald-300", ring: "focus:border-emerald-500 focus:ring-emerald-500/20", border: "border-emerald-800", dot: "bg-emerald-400" },
  Idle:       { badge: "bg-amber-950 border-amber-700 text-amber-300",       ring: "focus:border-amber-500 focus:ring-amber-500/20",     border: "border-amber-800",   dot: "bg-amber-400"   },
  Repairable: { badge: "bg-orange-950 border-orange-700 text-orange-300",    ring: "focus:border-orange-500 focus:ring-orange-500/20",   border: "border-orange-800",  dot: "bg-orange-400"  },
  Damage:     { badge: "bg-red-950 border-red-700 text-red-300",             ring: "focus:border-red-500 focus:ring-red-500/20",         border: "border-red-800",     dot: "bg-red-400"     },
};

const STATUS_TEXT_COLOR = {
  Running:    "text-emerald-400",
  Idle:       "text-amber-400",
  Repairable: "text-orange-400",
  Damage:     "text-red-400",
};

const STATUS_BADGE_MINI = {
  Running:    "bg-emerald-950 border-emerald-800 text-emerald-300",
  Idle:       "bg-amber-950 border-amber-800 text-amber-300",
  Repairable: "bg-orange-950 border-orange-800 text-orange-300",
  Damage:     "bg-red-950 border-red-800 text-red-300",
};

// ── Machine type → color map (mirrors LineLayout page) ───────────────────────
const MACHINE_COLORS = {
  "SINGLE NDL (PLAIN M/C)":            { bg:"#dbeafe", accent:"#1d4ed8", text:"#1e3a5f", badge:"#1d4ed8" },
  "SINGLE NDL (TOP FEED) M/C":         { bg:"#dbeafe", accent:"#1d4ed8", text:"#1e3a5f", badge:"#1d4ed8" },
  "SINGLE NDL (NDL FEED) M/C":         { bg:"#dbeafe", accent:"#1d4ed8", text:"#1e3a5f", badge:"#1d4ed8" },
  "SINGLE NDL (CUFFS) M/C":            { bg:"#dbeafe", accent:"#1d4ed8", text:"#1e3a5f", badge:"#1d4ed8" },
  "DLM SINGLE NEEDLE VERTICAL CUTTER": { bg:"#ede9fe", accent:"#7c3aed", text:"#3b1a6e", badge:"#7c3aed" },
  "DOUBLE NDL":                         { bg:"#e0e7ff", accent:"#4338ca", text:"#1e1b4b", badge:"#4338ca" },
  "POCKET WELL (APW) M/C":             { bg:"#d1fae5", accent:"#059669", text:"#064e3b", badge:"#059669" },
  "3/8 T CHAIN STITCH (3 NDL) M/C":    { bg:"#d1fae5", accent:"#059669", text:"#064e3b", badge:"#059669" },
  "INTER LOCK (2 NDL 5TH) M/C":        { bg:"#ccfbf1", accent:"#0d9488", text:"#134e4a", badge:"#0d9488" },
  "OVER LOCK (2 NDL 4TH) M/C":         { bg:"#ccfbf1", accent:"#0d9488", text:"#134e4a", badge:"#0d9488" },
  "BARTACK M/C":                        { bg:"#fce7f3", accent:"#be185d", text:"#500724", badge:"#be185d" },
  "KANSAI":                             { bg:"#fae8ff", accent:"#a21caf", text:"#3b0764", badge:"#a21caf" },
  "EYELET HOLE M/C":                    { bg:"#ffedd5", accent:"#c2410c", text:"#431407", badge:"#c2410c" },
  "HELPER":                             { bg:"#f1f5f9", accent:"#475569", text:"#334155", badge:"#475569" },
  "default":                            { bg:"#e0f2fe", accent:"#0369a1", text:"#0c4a6e", badge:"#0369a1" },
};

function mc(type) { return MACHINE_COLORS[type] || MACHINE_COLORS["default"]; }

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg text-sm font-semibold shadow-2xl border transition-all duration-300 ${
      toast.type === "success"
        ? "bg-emerald-950 border-emerald-500 text-emerald-300"
        : "bg-red-950 border-red-500 text-red-300"
    }`}>
      {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
    </div>
  );
}

// ─── Line Layout Info Modal ───────────────────────────────────────────────────
function LineLayoutModal({ serialNumber, factory, onClose }) {
  const [layoutInfo, setLayoutInfo] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLayoutInfo(null);
    (async () => {
      try {
        const qs = new URLSearchParams({ serialNumber });
        if (factory) qs.set("factory", factory);
        const res  = await fetch(`/api/line-layouts?${qs}`);
        const json = await res.json();
        if (!cancelled) setLayoutInfo(json.success ? json.data : null);
      } catch {
        if (!cancelled) setLayoutInfo(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [serialNumber, factory]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const proc   = layoutInfo?.process;
  const layout = layoutInfo?.layout;
  const c      = mc(proc?.machineType);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md bg-[#0f1117] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden font-mono">

          {/* Gradient top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-cyan-400 to-blue-500" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">📐</span>
              <div>
                <p className="text-[10px] text-violet-400 uppercase tracking-widest">Line Layout Info</p>
                <p className="text-white font-bold text-sm">{serialNumber}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all font-bold">
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-5 min-h-[180px]">

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-xs animate-pulse">Searching line layouts...</p>
              </div>
            )}

            {/* Not assigned */}
            {!loading && !layoutInfo && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <span className="text-4xl">📭</span>
                <p className="text-slate-300 text-sm font-bold">কোনো line-এ assign নেই</p>
                <p className="text-slate-600 text-xs text-center">
                  <span className="font-mono text-slate-400">{serialNumber}</span> এখন কোনো active line layout-এ নেই।
                </p>
              </div>
            )}

            {/* Found */}
            {!loading && layoutInfo && layout && proc && (
              <div className="space-y-4">

                {/* Location chips */}
                <div className="flex flex-wrap gap-2">
                  {layout.factory && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                      style={{ background: `${c.accent}22`, borderColor: `${c.accent}55`, color: c.accent }}>
                      🏭 {layout.factory}
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                    style={{ background: `${c.accent}22`, borderColor: `${c.accent}55`, color: c.accent }}>
                    Floor {layout.floor}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                    style={{ background: `${c.accent}22`, borderColor: `${c.accent}55`, color: c.accent }}>
                    Line {layout.lineNo}
                  </span>
                </div>

                {/* Layout meta */}
                <div className="bg-[#161b27] border border-slate-800 rounded-xl overflow-hidden">
                  <div className="h-px w-full" style={{ background: `linear-gradient(to right, ${c.accent}, transparent)` }} />
                  <div className="px-4 py-3 space-y-2">
                    {[
                      ["Buyer",  layout.buyer],
                      ["Style",  layout.style],
                      ["Item",   layout.item],
                    ].map(([label, val]) => val ? (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-slate-500 text-[10px] uppercase tracking-widest">{label}</span>
                        <span className="text-slate-200 text-xs font-bold">{val}</span>
                      </div>
                    ) : null)}
                  </div>
                </div>

                {/* Process card — same colour style as LineLayout grid */}
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Process</p>
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{
                      background:  c.bg,
                      borderLeft:  `4px solid ${c.accent}`,
                      border:      `1px solid ${c.accent}25`,
                      borderLeftWidth: "4px",
                      borderLeftStyle: "solid",
                      borderLeftColor: c.accent,
                    }}
                  >
                    {/* Badges row */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {/* Process serial no */}
                      <span className="text-[10px] font-black px-2 py-0.5 rounded"
                        style={{ background: c.badge, color: "#fff" }}>
                        #{proc.serialNo}
                      </span>

                      {/* THE searched serial — highlighted with glow ring */}
                      <span
                        className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full"
                        style={{
                          background: "#fff",
                          color:      c.accent,
                          border:     `2px solid ${c.accent}`,
                          boxShadow:  `0 0 0 3px ${c.accent}33`,
                        }}
                      >
                        ◉ {serialNumber}
                      </span>

                      {/* Other serials in same process (dimmed) */}
                      {(proc.machines || [])
                        .filter((m) => m.serialNumber && m.serialNumber.toUpperCase() !== serialNumber.toUpperCase())
                        .map((m, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded"
                            style={{ background: `${c.accent}18`, color: c.accent, border: `1px solid ${c.accent}30` }}>
                            {m.serialNumber}
                          </span>
                        ))}
                    </div>

                    {/* Process name */}
                    <p className="text-sm font-bold leading-snug mb-1" style={{ color: c.text }}>
                      {proc.processName}
                    </p>

                    {/* Machine type */}
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: c.accent }}>
                      {proc.machineType}
                    </p>

                    {/* From floor of the searched serial */}
                    {(proc.machines || []).map((m, i) =>
                      m.serialNumber && m.serialNumber.toUpperCase() === serialNumber.toUpperCase() && m.fromFloor
                        ? <p key={i} className="text-[10px] mt-1.5" style={{ color: `${c.accent}99` }}>
                            Originally from: <strong>{m.fromFloor}</strong>
                          </p>
                        : null
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Footer close button */}
          <div className="px-5 pb-5">
            <button onClick={onClose}
              className="w-full py-2.5 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Serial Search Tab ────────────────────────────────────────────────────────
function SerialSearchTab({ factory, onSaveSuccess, showToast }) {
  const [query,         setQuery]         = useState("");
  const [searching,     setSearching]     = useState(false);
  const [result,        setResult]        = useState(null);
  const [notFound,      setNotFound]      = useState(false);
  const [editFloor,     setEditFloor]     = useState("");
  const [editStatus,    setEditStatus]    = useState("Running");
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [showModal,     setShowModal]     = useState(false);
  const [searchedSerial, setSearchedSerial] = useState("");

  const handleSearch = useCallback(async () => {
    const sn = query.trim().toUpperCase();
    if (!sn) return;
    setSearching(true);
    setResult(null);
    setNotFound(false);
    setSearchedSerial("");
    setShowModal(false);
    try {
      const qs   = factory ? `?factory=${encodeURIComponent(factory)}` : "";
      const res  = await fetch(`/api/machines${qs}`);
      const json = await res.json();
      if (!json.success) { setNotFound(true); return; }
      let found = null;
      for (const machine of (json.data || [])) {
        const unit = (machine.units || []).find((u) => u.serialNumber.toUpperCase() === sn);
        if (unit) { found = { machine, unit }; break; }
      }
      if (found) {
        setResult(found);
        setEditFloor(found.unit.floorName);
        setEditStatus(found.unit.status);
        setNotFound(false);
        setSearchedSerial(sn);
      } else {
        setNotFound(true);
      }
    } finally { setSearching(false); }
  }, [query, factory]);

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const res  = await fetch("/api/machines", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factory, machineName: result.machine.machineName, serialNumber: result.unit.serialNumber, floorName: editFloor, status: editStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Update successful.");
        setResult((prev) => ({ ...prev, unit: { ...prev.unit, floorName: editFloor, status: editStatus } }));
        if (onSaveSuccess) onSaveSuccess();
      } else showToast("error", json.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!result) return;
    if (!confirm(`"${result.unit.serialNumber}" Delete?`)) return;
    setDeleting(true);
    try {
      const res  = await fetch("/api/machines", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factory, machineName: result.machine.machineName, serialNumber: result.unit.serialNumber }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Machine deleted successfully.");
        setResult(null); setQuery(""); setSearchedSerial("");
        if (onSaveSuccess) onSaveSuccess();
      } else showToast("error", json.message);
    } finally { setDeleting(false); }
  };

  const statusStyle = STATUS_STYLE[editStatus] || STATUS_STYLE.Running;
  const changed     = result && (editFloor !== result.unit.floorName || editStatus !== result.unit.status);

  return (
    <>
      {/* Line Layout modal */}
      {showModal && searchedSerial && (
        <LineLayoutModal
          serialNumber={searchedSerial}
          factory={factory}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="p-7 space-y-5">
        {/* Search input */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Search by Serial Number</label>
          <div className="flex gap-2">
            <input type="text" value={query}
              onChange={(e) => { setQuery(e.target.value); setResult(null); setNotFound(false); setSearchedSerial(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="যেমন: SN-001"
              className="flex-1 bg-[#0f1117] border border-slate-700 text-white rounded-lg px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors placeholder:text-slate-600" />
            <button type="button" onClick={handleSearch} disabled={searching || !query.trim()}
              className="px-5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg text-sm transition-all">
              {searching ? "..." : "Search"}
            </button>
          </div>
        </div>

        {notFound && (
          <div className="bg-[#0f1117] border border-slate-800 rounded-xl px-4 py-6 text-center">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-slate-400 text-sm">
              <span className="font-mono text-white">{query.trim().toUpperCase()}</span> — No machine found.
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Machine info card */}
            <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-4 space-y-2">
              <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono">found</p>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Serial</span>
                <span className="text-white font-mono font-bold text-sm">{result.unit.serialNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Machine</span>
                <span className="text-slate-200 text-xs font-semibold text-right max-w-[200px]">{result.machine.machineName}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                <span className="text-slate-500 text-xs">Current Floor</span>
                <span className="text-white font-bold text-sm">{result.unit.floorName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Current Status</span>
                <span className={`font-bold text-sm ${STATUS_TEXT_COLOR[result.unit.status]}`}>{result.unit.status}</span>
              </div>

              {/* ── Line Layout button ── */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-violet-800/70 bg-violet-950/30 hover:bg-violet-900/50 hover:border-violet-600 text-violet-300 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">📐</span>
                    <div className="text-left">
                      <p className="text-xs font-bold leading-tight">Line Layout Info</p>
                      <p className="text-[10px] text-violet-400/60 leading-tight">এই serial কোন line-এ আছে দেখুন</p>
                    </div>
                  </div>
                  <span className="text-violet-500 group-hover:translate-x-0.5 group-hover:text-violet-300 transition-all text-sm">→</span>
                </button>
              </div>
            </div>

            {/* Edit section */}
            <div className="space-y-3">
              <p className="text-[10px] text-amber-400 uppercase tracking-widest font-mono">Change</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Floor</label>
                  <div className="relative">
                    <select value={editFloor} onChange={(e) => setEditFloor(e.target.value)}
                      className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm appearance-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors">
                      <option value="">— Floor —</option>
                      {FLOOR_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▾</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <div className="relative">
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                      className={`w-full bg-[#0f1117] border text-white rounded-lg px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-1 transition-colors ${statusStyle.ring} ${statusStyle.border}`}>
                      {STATUS_OPTIONS.map(({ value, label, icon }) => <option key={value} value={value}>{icon} {label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▾</div>
                  </div>
                </div>
              </div>

              {changed && (
                <div className={`border rounded-xl px-4 py-3 ${statusStyle.badge}`}>
                  <p className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Change preview</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="opacity-60">{result.unit.floorName}</span>
                    <span className="opacity-40">→</span>
                    <span className="font-bold">{editFloor}</span>
                    <span className="opacity-40 mx-1">·</span>
                    <span className="opacity-60">{result.unit.status}</span>
                    <span className="opacity-40">→</span>
                    <span className="font-bold">{editStatus}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={handleSave} disabled={saving || !editFloor || !changed}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#0f1117] font-bold py-2.5 rounded-xl text-sm transition-all">
                  {saving ? "Saving..." : "✓ Update"}
                </button>
                <button type="button" onClick={handleDelete} disabled={deleting}
                  className="px-4 bg-transparent border border-red-800 hover:border-red-500 text-red-400 hover:text-red-300 hover:bg-red-950/30 font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-40">
                  {deleting ? "..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Add / Edit by Machine Tab ────────────────────────────────────────────────
function MachineEditTab({ factory, onSaveSuccess, showToast }) {
  const [machineName,   setMachineName]   = useState("");
  const [serialNumber,  setSerialNumber]  = useState("");
  const [floorName,     setFloorName]     = useState("");
  const [status,        setStatus]        = useState("Running");
  const [existingUnits, setExistingUnits] = useState([]);
  const [fetchingUnits, setFetchingUnits] = useState(false);
  const [currentUnit,   setCurrentUnit]   = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [unitSearch,    setUnitSearch]    = useState("");
  const [statusFilter,  setStatusFilter]  = useState("ALL");

  const loadMachineUnits = useCallback(async (name) => {
    if (!name) { setExistingUnits([]); return; }
    setFetchingUnits(true);
    try {
      const qs = new URLSearchParams({ name });
      if (factory) qs.set("factory", factory);
      const res  = await fetch(`/api/machines?${qs}`);
      const json = await res.json();
      setExistingUnits(json.success && json.data ? (json.data.units ?? []) : []);
    } catch { setExistingUnits([]); }
    finally   { setFetchingUnits(false); }
  }, [factory]);

  useEffect(() => {
    loadMachineUnits(machineName);
    setSerialNumber(""); setFloorName(""); setStatus("Running"); setCurrentUnit(null);
    setUnitSearch(""); setStatusFilter("ALL");
  }, [machineName, loadMachineUnits]);

  useEffect(() => {
    if (!serialNumber.trim()) { setCurrentUnit(null); return; }
    const found = existingUnits.find((u) => u.serialNumber.toLowerCase() === serialNumber.trim().toLowerCase());
    if (found) { setCurrentUnit(found); setFloorName(found.floorName); setStatus(found.status); }
    else        { setCurrentUnit(null); }
  }, [serialNumber, existingUnits]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!machineName || !serialNumber.trim() || !floorName || !status) {
      showToast("error", "All fields are required."); return;
    }
    setSaving(true);
    try {
      const res  = await fetch("/api/machines", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factory, machineName, serialNumber: serialNumber.trim().toUpperCase(), floorName, status }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message || "Successfully saved.");
        await loadMachineUnits(machineName);
        setSerialNumber(""); setFloorName(""); setStatus("Running"); setCurrentUnit(null);
        if (onSaveSuccess) onSaveSuccess();
      } else showToast("error", json.message || "There was a problem saving.");
    } catch { showToast("error", "Network issue."); }
    finally  { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!currentUnit) return;
    if (!confirm(`"${serialNumber}" Delete?`)) return;
    setDeleting(true);
    try {
      const res  = await fetch("/api/machines", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factory, machineName, serialNumber: serialNumber.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Machine unit deleted successfully.");
        await loadMachineUnits(machineName);
        setSerialNumber(""); setFloorName(""); setStatus("Running"); setCurrentUnit(null);
        if (onSaveSuccess) onSaveSuccess();
      } else showToast("error", json.message);
    } catch { showToast("error", "Network issue."); }
    finally  { setDeleting(false); }
  };

  const filteredUnits = existingUnits.filter((u) => {
    const matchesSearch = u.serialNumber.toLowerCase().includes(unitSearch.toLowerCase().trim());
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const unitStats   = existingUnits.reduce((acc, u) => { acc[u.status] = (acc[u.status] || 0) + 1; return acc; }, {});
  const isNew       = serialNumber.trim() && !currentUnit;
  const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.Running;

  return (
    <form onSubmit={handleSubmit} className="p-7 space-y-6">
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Machine Name <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select value={machineName} onChange={(e) => setMachineName(e.target.value)}
            className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-4 py-3 text-sm appearance-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors">
            <option value="">— Select Machine —</option>
            {MACHINE_NAMES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">▾</div>
        </div>
      </div>

      {machineName && (
        <div className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                {fetchingUnits
                  ? <span className="text-cyan-400 animate-pulse">Loading...</span>
                  : <span>Total <span className="text-white font-bold">{existingUnits.length}</span> units</span>
                }
              </p>
              <div className="flex gap-1.5 flex-wrap justify-end">
                <button type="button" onClick={() => setStatusFilter("ALL")}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all
                    ${statusFilter === "ALL" ? "bg-slate-600 border-slate-400 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                  ALL {existingUnits.length > 0 && `(${existingUnits.length})`}
                </button>
                {STATUS_OPTIONS.map(({ value, label }) => {
                  const count = unitStats[value] || 0;
                  if (count === 0) return null;
                  return (
                    <button key={value} type="button" onClick={() => setStatusFilter(statusFilter === value ? "ALL" : value)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all
                        ${statusFilter === value ? STATUS_BADGE_MINI[value] + " opacity-100" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">🔍</span>
              <input type="text" value={unitSearch} onChange={(e) => setUnitSearch(e.target.value)}
                placeholder="Serial number খুঁজুন..."
                className="w-full bg-[#161b27] border border-slate-700 text-white rounded-lg pl-8 pr-4 py-2 text-xs font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-colors placeholder:text-slate-600" />
              {unitSearch && (
                <button type="button" onClick={() => setUnitSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-bold">✕</button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
            {fetchingUnits ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-cyan-400 text-xs animate-pulse font-mono">Loading...</span>
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-600 gap-2">
                <span className="text-2xl">📭</span>
                <span className="text-xs">{unitSearch || statusFilter !== "ALL" ? "No results found" : "No units added"}</span>
              </div>
            ) : (
              <div className="p-3 grid grid-cols-1 gap-1">
                {filteredUnits.map((u) => {
                  const isSelected = serialNumber === u.serialNumber;
                  return (
                    <button key={u.serialNumber} type="button" onClick={() => setSerialNumber(u.serialNumber)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all
                        ${isSelected ? "bg-cyan-900/60 border-cyan-500 shadow-sm shadow-cyan-500/20" : "bg-[#161b27] border-slate-800 hover:border-slate-600 hover:bg-slate-800/60"}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-xs font-mono font-bold shrink-0 ${isSelected ? "text-cyan-300" : "text-slate-200"}`}>{u.serialNumber}</span>
                        <span className={`text-[10px] shrink-0 ${isSelected ? "text-cyan-400/70" : "text-slate-500"}`}>{u.floorName}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ml-2 ${STATUS_BADGE_MINI[u.status]}`}>{u.status}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {(unitSearch || statusFilter !== "ALL") && !fetchingUnits && (
            <div className="px-4 py-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
              {filteredUnits.length} / {existingUnits.length} showing
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Serial Number <span className="text-red-400">*</span>
          {isNew       && <span className="ml-2 text-cyan-400 normal-case tracking-normal font-normal">— New unit will be added</span>}
          {currentUnit && <span className="ml-2 text-amber-400 normal-case tracking-normal font-normal">— Existing unit (will be updated)</span>}
        </label>
        <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)}
          placeholder="যেমন: SN-001, M-042"
          className={`w-full bg-[#0f1117] border text-white rounded-lg px-4 py-3 text-sm font-mono uppercase
            focus:outline-none focus:ring-1 transition-colors placeholder:text-slate-600
            ${currentUnit ? "border-amber-700 focus:border-amber-500 focus:ring-amber-500/20" : "border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/30"}`}
        />
        {currentUnit && (
          <div className="mt-2 flex items-center gap-3 bg-[#0f1117] border border-amber-900/50 rounded-lg px-4 py-2.5">
            <span className="text-slate-500 text-xs">Current:</span>
            <span className="text-white text-xs font-semibold">{currentUnit.floorName}</span>
            <span className="text-slate-600">•</span>
            <span className={`text-xs font-bold ${STATUS_TEXT_COLOR[currentUnit.status]}`}>{currentUnit.status}</span>
            <span className="text-slate-600 ml-auto">→ Change below</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Floor <span className="text-red-400">*</span></label>
          <div className="relative">
            <select value={floorName} onChange={(e) => setFloorName(e.target.value)}
              className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-4 py-3 text-sm appearance-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors">
              <option value="">— Floor —</option>
              {FLOOR_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">▾</div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Status <span className="text-red-400">*</span></label>
          <div className="relative">
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className={`w-full bg-[#0f1117] border text-white rounded-lg px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-1 transition-colors ${statusStyle.ring} ${statusStyle.border}`}>
              {STATUS_OPTIONS.map(({ value, label, icon }) => <option key={value} value={value}>{icon} {label}</option>)}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">▾</div>
          </div>
        </div>
      </div>

      {machineName && serialNumber.trim() && floorName && status && (
        <div className={`border rounded-xl p-4 ${statusStyle.badge}`}>
          <p className="text-[10px] uppercase tracking-widest opacity-60 mb-2">{currentUnit ? "আপডেট preview" : "নতুন entry preview"}</p>
          <div className="flex flex-wrap gap-4 items-center">
            {[["Machine", machineName, "max-w-[160px] truncate"], ["Serial", serialNumber.trim().toUpperCase(), "font-mono"], ["Floor", floorName, ""], ["Status", status, ""]].map(([l, v, cls]) => (
              <div key={l}><span className="text-[10px] opacity-60">{l}</span><p className={`text-sm font-bold ${cls}`}>{v}</p></div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#0f1117] font-bold py-3 rounded-xl text-sm tracking-widest uppercase transition-all shadow-lg shadow-cyan-500/20">
          {saving ? "Saving..." : currentUnit ? "Update" : "Add"}
        </button>
        {currentUnit && (
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="px-5 bg-transparent border border-red-800 hover:border-red-500 text-red-400 hover:text-red-300 hover:bg-red-950/30 font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-40">
            {deleting ? "..." : "মুছুন"}
          </button>
        )}
        <button type="button" onClick={() => { setMachineName(""); setSerialNumber(""); setFloorName(""); setStatus("Running"); setExistingUnits([]); setCurrentUnit(null); setUnitSearch(""); setStatusFilter("ALL"); }}
          className="px-5 bg-transparent border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 font-semibold py-3 rounded-xl text-sm tracking-widest uppercase transition-all">
          Reset
        </button>
      </div>
    </form>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function MachineInventoryForm({ onSaveSuccess, factory = "" }) {
  const [tab,   setTab]   = useState("search");
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] font-mono">
      <Toast toast={toast} />

      <div className="px-7 pt-8 pb-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-1 bg-cyan-400 rounded-full" />
          <span className="text-xs tracking-[0.3em] text-cyan-400 uppercase">IE Department</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Machine Inventory</h1>
        <p className="text-slate-500 text-sm mt-1">Track the serial number and status of each machine unit.</p>
      </div>

      <div className="flex mx-7 mt-5 border border-slate-800 rounded-xl overflow-hidden">
        <button onClick={() => setTab("search")}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all
            ${tab === "search" ? "bg-cyan-900 text-cyan-300 border-b-2 border-cyan-400" : "bg-[#161b27] text-slate-500 hover:text-slate-300"}`}>
          🔍 Find Serial
        </button>
        <button onClick={() => setTab("machine")}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all
            ${tab === "machine" ? "bg-cyan-900 text-cyan-300 border-b-2 border-cyan-400" : "bg-[#161b27] text-slate-500 hover:text-slate-300"}`}>
          ＋ Machine Based
        </button>
      </div>

      <div className="mx-7 mt-4 bg-[#161b27] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />
        {tab === "search"
          ? <SerialSearchTab factory={factory} onSaveSuccess={onSaveSuccess} showToast={showToast} />
          : <MachineEditTab  factory={factory} onSaveSuccess={onSaveSuccess} showToast={showToast} />
        }
      </div>

      <p className="text-center text-slate-600 text-xs mt-4 pb-6">
        {tab === "search"
          ? "Find any machine by its serial number and edit it directly."
          : "Select a machine type and enter a serial number to load existing units automatically."}
      </p>
    </div>
  );
}