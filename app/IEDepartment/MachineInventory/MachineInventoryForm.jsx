"use client";
// app/IEDepartment/MachineInventory/MachineInventoryForm.jsx

import { useState, useEffect, useCallback, useRef } from "react";

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
  { value: "A-2", label: "A-2" }, { value: "B-2", label: "B-2" },
  { value: "A-3", label: "A-3" }, { value: "B-3", label: "B-3" },
  { value: "A-4", label: "A-4" }, { value: "B-4", label: "B-4" },
  { value: "A-5", label: "A-5" }, { value: "B-5", label: "B-5" },
  { value: "A-6", label: "A-6" }, { value: "B-6", label: "B-6" },
  { value: "C-4", label: "C-4" }, { value: "K-3", label: "K-3" },
  { value: "SMD/CAD", label: "SMD/CAD" },
  { value: "New", label: "New" },
  { value: "Others", label: "Others" },
];

const STATUS_OPTIONS = [
  { value: "Running",    label: "Running",    icon: "▶" },
  { value: "Idle",       label: "Idle",       icon: "⏸" },
  { value: "Repairable", label: "Repairable", icon: "🔧" },
  { value: "Damage",     label: "Damage",     icon: "✕"  },
];

const STATUS_STYLE = {
  Running:    { badge: "bg-emerald-950 border-emerald-700 text-emerald-300", ring: "focus:border-emerald-500 focus:ring-emerald-500/20", border: "border-emerald-800" },
  Idle:       { badge: "bg-amber-950 border-amber-700 text-amber-300",       ring: "focus:border-amber-500 focus:ring-amber-500/20",     border: "border-amber-800"   },
  Repairable: { badge: "bg-orange-950 border-orange-700 text-orange-300",    ring: "focus:border-orange-500 focus:ring-orange-500/20",   border: "border-orange-800"  },
  Damage:     { badge: "bg-red-950 border-red-700 text-red-300",             ring: "focus:border-red-500 focus:ring-red-500/20",         border: "border-red-800"     },
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

// ─── ProcessCard (inside the layout modal grid) ───────────────────────────────
function ProcessCard({ proc, searchedSerial, isMatched }) {
  const c = mc(proc.machineType);
  const serials = (proc.machines || []).map((m) => m.serialNumber).filter(Boolean);

  if (isMatched) {
    return (
      <div style={{
        background: "#fefce8", border: "2px solid #f59e0b",
        borderRadius: 8, boxShadow: "0 0 0 3px #fde68a, 0 4px 16px #f59e0b55",
        padding: "10px 12px", position: "relative",
      }}>
        <div style={{
          position: "absolute", top: -1, right: 8,
          background: "#f59e0b", color: "#fff", fontSize: 9, fontWeight: 900,
          letterSpacing: "0.08em", padding: "1px 7px",
          borderRadius: "0 0 6px 6px", textTransform: "uppercase",
        }}>◉ This Machine</div>

        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:6, marginTop:8 }}>
          <span style={{ background:"#f59e0b", color:"#fff", fontSize:10, fontWeight:900, padding:"1px 8px", borderRadius:4 }}>
            #{proc.serialNo}
          </span>
          {serials.map((sn) => {
            const isThis = sn.toUpperCase() === (searchedSerial || "").toUpperCase();
            return (
              <span key={sn} style={{
                fontFamily: "monospace", fontSize: isThis ? 11 : 10, fontWeight: 900,
                padding: isThis ? "2px 10px" : "1px 7px", borderRadius: 20,
                background: isThis ? "#f59e0b" : "#fde68a",
                color: isThis ? "#fff" : "#92400e",
                border: isThis ? "2px solid #d97706" : "1px solid #fcd34d",
                boxShadow: isThis ? "0 0 0 2px #fde68a" : "none",
              }}>
                {isThis ? `◉ ${sn}` : sn}
              </span>
            );
          })}
        </div>
        <p style={{ fontSize:13, fontWeight:700, color:"#78350f", lineHeight:1.3, marginBottom:4 }}>{proc.processName}</p>
        <p style={{ fontSize:10, fontWeight:700, color:"#d97706", textTransform:"uppercase", letterSpacing:"0.06em" }}>{proc.machineType}</p>
      </div>
    );
  }

  return (
    <div style={{
      background: c.bg, borderLeft: `4px solid ${c.accent}`,
      border: `1px solid ${c.accent}20`, borderLeftWidth:4, borderLeftStyle:"solid", borderLeftColor:c.accent,
      borderRadius:6, padding:"8px 10px", opacity:0.82,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap", marginBottom:5 }}>
        <span style={{ background:c.badge, color:"#fff", fontSize:10, fontWeight:900, padding:"1px 7px", borderRadius:4 }}>
          #{proc.serialNo}
        </span>
        {serials.map((sn) => (
          <span key={sn} style={{
            fontFamily:"monospace", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:4,
            background:`${c.accent}18`, color:c.accent, border:`1px solid ${c.accent}30`,
          }}>{sn}</span>
        ))}
      </div>
      <p style={{ fontSize:12, fontWeight:600, color:c.text, lineHeight:1.3, marginBottom:3 }}>{proc.processName}</p>
      <p style={{ fontSize:10, fontWeight:700, color:c.accent, textTransform:"uppercase", letterSpacing:"0.05em" }}>{proc.machineType}</p>
    </div>
  );
}

// ─── Line Layout Info Modal ───────────────────────────────────────────────────
function LineLayoutModal({ serialNumber, factory, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setData(null);
    (async () => {
      try {
        const qs = new URLSearchParams({ serialNumber });
        if (factory) qs.set("factory", factory);
        const res  = await fetch(`/api/line-layouts?${qs}`);
        const json = await res.json();
        if (!cancelled) setData(json.success ? json.data : null);
      } catch { if (!cancelled) setData(null); }
      finally  { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [serialNumber, factory]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const layout           = data?.layout;
  const matchedProcessId = data?.matchedProcessId;
  const sorted = layout ? [...(layout.processes || [])].sort((a, b) => a.serialNo - b.serialNo) : [];
  const pairs  = [];
  for (let i = 0; i < sorted.length; i += 2) pairs.push([sorted[i], sorted[i+1] ?? null]);

  return (
    <>
      <div className="fixed inset-0 bg-black/75 z-[60] backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 pointer-events-none">
        <div className="pointer-events-auto flex flex-col bg-[#0f1117] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden font-mono"
          style={{ width:"min(780px, 96vw)", maxHeight:"92vh" }}>
          <div className="h-1 w-full shrink-0 bg-gradient-to-r from-violet-500 via-amber-400 to-cyan-400" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xl">📐</span>
              <div>
                <p className="text-[10px] text-violet-400 uppercase tracking-widest">Line Layout — Full View</p>
                <p className="text-white font-bold text-sm">
                  Searching: <span className="text-amber-300 font-mono">{serialNumber}</span>
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all font-bold text-base">✕</button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-xs animate-pulse">Searching line layouts...</p>
              </div>
            )}

            {!loading && !data && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-5xl">📭</span>
                <p className="text-slate-300 text-sm font-bold">Not assigned to any line</p>
                <p className="text-slate-600 text-xs text-center">
                  <span className="font-mono text-slate-400">{serialNumber}</span> is not in any active line layout.
                </p>
              </div>
            )}

            {!loading && data && layout && (
              <div>
                {/* Layout info bar */}
                <div className="px-5 py-3 border-b border-slate-800 bg-[#161b27]">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {layout.factory && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-950 border border-violet-700 text-violet-300">🏭 {layout.factory}</span>
                    )}
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300">Floor {layout.floor}</span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-950 border border-blue-700 text-blue-300">Line {layout.lineNo}</span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-600 text-slate-300">{layout.processes?.length || 0} processes</span>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {[["Buyer",layout.buyer],["Style",layout.style],["Item",layout.item],["SMV",layout.smv],["Eff.",`${layout.planEfficiency}%`],["Manpower",layout.manpower],[`Daily (${layout.workingHours}h)`,layout.dailyTarget]].map(([label,val]) =>
                      val != null && val !== "" ? (
                        <div key={label} className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest">{label}:</span>
                          <span className="text-[11px] text-slate-200 font-bold">{val}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="px-5 py-2.5 border-b border-slate-800 flex items-center gap-4 bg-[#0f1117]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-amber-400" />
                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-widest">Searched machine</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-blue-700 opacity-50" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">Other processes</span>
                  </div>
                  <span className="text-[10px] text-slate-600 ml-auto">Left ← Serial → Right (2-column)</span>
                </div>

                {/* 2-column grid */}
                <div className="px-4 py-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center text-[10px] font-black uppercase tracking-widest py-1.5 rounded-lg bg-blue-900/60 text-blue-300 border border-blue-800">← LEFT SIDE</div>
                    <div className="text-center text-[10px] font-black uppercase tracking-widest py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">RIGHT SIDE →</div>
                  </div>
                  <div className="space-y-2">
                    {pairs.map(([left, right], rowIdx) => (
                      <div key={rowIdx} className="grid grid-cols-2 gap-3">
                        <div>
                          {left ? (
                            <ProcessCard proc={left} searchedSerial={serialNumber} isMatched={String(left._id) === matchedProcessId} />
                          ) : (
                            <div className="h-full min-h-[54px] border-2 border-dashed border-slate-800 rounded-lg flex items-center justify-center">
                              <span className="text-[10px] text-slate-700">Empty</span>
                            </div>
                          )}
                        </div>
                        <div>
                          {right ? (
                            <ProcessCard proc={right} searchedSerial={serialNumber} isMatched={String(right._id) === matchedProcessId} />
                          ) : (
                            <div className="h-full min-h-[54px] border-2 border-dashed border-slate-800 rounded-lg flex items-center justify-center">
                              <span className="text-[10px] text-slate-700">Empty</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {sorted.length === 0 && <p className="text-center text-slate-600 text-xs py-8">No processes in this layout.</p>}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-4 pt-3 border-t border-slate-800 shrink-0">
            <button onClick={onClose} className="w-full py-2.5 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
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
  const [query,          setQuery]          = useState("");
  const [searching,      setSearching]      = useState(false);
  const [result,         setResult]         = useState(null);
  const [notFound,       setNotFound]       = useState(false);
  const [editFloor,      setEditFloor]      = useState("");
  const [editStatus,     setEditStatus]     = useState("Running");
  const [saving,         setSaving]         = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [showModal,      setShowModal]      = useState(false);
  const [searchedSerial, setSearchedSerial] = useState("");

  // ── Autocomplete suggestion state ──
  const [allUnits,     setAllUnits]     = useState([]);   // flat list of {serialNumber, machineName, floorName, status}
  const [suggestions,  setSuggestions]  = useState([]);   // filtered suggestions shown in dropdown
  const [showSuggest,  setShowSuggest]  = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const inputRef  = useRef(null);
  const suggestRef = useRef(null);

  // Load all units once (for suggestions)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingUnits(true);
      try {
        const qs  = factory ? `?factory=${encodeURIComponent(factory)}` : "";
        const res  = await fetch(`/api/machines${qs}`);
        const json = await res.json();
        if (!cancelled && json.success) {
          const flat = [];
          for (const machine of (json.data || [])) {
            for (const unit of (machine.units || [])) {
              flat.push({
                serialNumber: unit.serialNumber,
                machineName:  machine.machineName,
                floorName:    unit.floorName,
                status:       unit.status,
              });
            }
          }
          // Sort alphabetically
          flat.sort((a, b) => a.serialNumber.localeCompare(b.serialNumber));
          setAllUnits(flat);
        }
      } catch { /* silent */ }
      finally  { if (!cancelled) setLoadingUnits(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [factory]);

  // Filter suggestions whenever query changes
  useEffect(() => {
    const q = query.trim().toUpperCase();
    if (!q || q.length < 1) { setSuggestions([]); setShowSuggest(false); return; }
    // Already exact match → no suggestions needed
    if (allUnits.some((u) => u.serialNumber.toUpperCase() === q)) {
      setSuggestions([]); setShowSuggest(false); return;
    }
    const matched = allUnits
      .filter((u) => u.serialNumber.toUpperCase().includes(q))
      .slice(0, 8); // max 8 suggestions
    setSuggestions(matched);
    setShowSuggest(matched.length > 0);
  }, [query, allUnits]);

  // Close suggestions on outside click
  useEffect(() => {
    function h(e) {
      if (suggestRef.current && !suggestRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggest(false);
      }
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSearch = useCallback(async (overrideSN) => {
    const sn = (overrideSN || query).trim().toUpperCase();
    if (!sn) return;
    setShowSuggest(false);
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
        setSearchedSerial(sn);
      } else { setNotFound(true); }
    } finally { setSearching(false); }
  }, [query, factory]);

  // Pick a suggestion
  const pickSuggestion = (sn) => {
    setQuery(sn);
    setSuggestions([]);
    setShowSuggest(false);
    handleSearch(sn);
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const res  = await fetch("/api/machines", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ factory, machineName: result.machine.machineName, serialNumber: result.unit.serialNumber, floorName: editFloor, status: editStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success","Update successful.");
        setResult((prev) => ({ ...prev, unit: { ...prev.unit, floorName: editFloor, status: editStatus } }));
        if (onSaveSuccess) onSaveSuccess();
      } else showToast("error", json.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!result || !confirm(`"${result.unit.serialNumber}" Delete?`)) return;
    setDeleting(true);
    try {
      const res  = await fetch("/api/machines", {
        method:"DELETE", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ factory, machineName: result.machine.machineName, serialNumber: result.unit.serialNumber }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success","Machine deleted successfully.");
        setResult(null); setQuery(""); setSearchedSerial("");
        if (onSaveSuccess) onSaveSuccess();
      } else showToast("error", json.message);
    } finally { setDeleting(false); }
  };

  const statusStyle = STATUS_STYLE[editStatus] || STATUS_STYLE.Running;
  const changed     = result && (editFloor !== result.unit.floorName || editStatus !== result.unit.status);

  return (
    <>
      {showModal && searchedSerial && (
        <LineLayoutModal serialNumber={searchedSerial} factory={factory} onClose={() => setShowModal(false)} />
      )}

      <div className="p-7 space-y-5">
        {/* Search with autocomplete */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Search by Serial Number
          </label>
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value.toUpperCase());
                    setResult(null); setNotFound(false); setSearchedSerial("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { handleSearch(); }
                    if (e.key === "Escape") setShowSuggest(false);
                    if (e.key === "ArrowDown" && showSuggest) {
                      e.preventDefault();
                      const first = suggestRef.current?.querySelector("button");
                      if (first) first.focus();
                    }
                  }}
                  onFocus={() => suggestions.length > 0 && setShowSuggest(true)}
                  placeholder="e.g. SN-001"
                  autoComplete="off"
                  className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors placeholder:text-slate-600"
                />

                {/* Suggestions dropdown */}
                {showSuggest && suggestions.length > 0 && (
                  <div
                    ref={suggestRef}
                    className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#161b27] border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
                  >
                    {/* Header */}
                    <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                        {loadingUnits ? "Loading..." : `${suggestions.length} match${suggestions.length !== 1 ? "es" : ""}`}
                      </span>
                      <span className="text-[9px] text-slate-600">↵ to select</span>
                    </div>

                    {/* Suggestion rows */}
                    <div className="max-h-52 overflow-y-auto">
                      {suggestions.map((u, idx) => {
                        const c = mc(u.machineName);
                        // Highlight the matching part of the serial number
                        const q   = query.trim().toUpperCase();
                        const sn  = u.serialNumber.toUpperCase();
                        const pos = sn.indexOf(q);
                        const before  = u.serialNumber.slice(0, pos);
                        const match   = u.serialNumber.slice(pos, pos + q.length);
                        const after   = u.serialNumber.slice(pos + q.length);

                        return (
                          <button
                            key={u.serialNumber}
                            type="button"
                            onClick={() => pickSuggestion(u.serialNumber)}
                            onKeyDown={(e) => {
                              if (e.key === "ArrowDown") { e.preventDefault(); (e.currentTarget.nextSibling)?.focus(); }
                              if (e.key === "ArrowUp")   { e.preventDefault(); (e.currentTarget.previousSibling || inputRef.current)?.focus(); }
                              if (e.key === "Enter")     { e.preventDefault(); pickSuggestion(u.serialNumber); }
                              if (e.key === "Escape")    { setShowSuggest(false); inputRef.current?.focus(); }
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/70 text-left transition-colors border-b border-slate-800/50 last:border-0 focus:outline-none focus:bg-slate-800/70"
                          >
                            {/* Color dot for machine type */}
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.accent }} />

                            {/* Serial with highlighted match */}
                            <span className="font-mono font-bold text-sm shrink-0">
                              <span className="text-slate-400">{before}</span>
                              <span className="text-amber-300 bg-amber-900/40 px-0.5 rounded">{match}</span>
                              <span className="text-slate-400">{after}</span>
                            </span>

                            {/* Machine name — truncated */}
                            <span className="text-[10px] text-slate-500 truncate flex-1 min-w-0">
                              {u.machineName.split(" ").slice(0,3).join(" ")}
                            </span>

                            {/* Floor + Status */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[9px] text-slate-500">{u.floorName}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${STATUS_BADGE_MINI[u.status]}`}>
                                {u.status}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={searching || !query.trim()}
                className="px-5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg text-sm transition-all shrink-0"
              >
                {searching ? "..." : "Search"}
              </button>
            </div>
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

              {/* Line Layout button */}
              <div className="pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(true)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-violet-800/70 bg-violet-950/30 hover:bg-violet-900/50 hover:border-violet-600 text-violet-300 transition-all group">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">📐</span>
                    <div className="text-left">
                      <p className="text-xs font-bold leading-tight">Line Layout Info</p>
                      <p className="text-[10px] text-violet-400/60 leading-tight">View all processes — searched machine highlighted</p>
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
    if (!machineName || !serialNumber.trim() || !floorName || !status) { showToast("error","All fields are required."); return; }
    setSaving(true);
    try {
      const res  = await fetch("/api/machines", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ factory, machineName, serialNumber: serialNumber.trim().toUpperCase(), floorName, status }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message || "Successfully saved.");
        await loadMachineUnits(machineName);
        setSerialNumber(""); setFloorName(""); setStatus("Running"); setCurrentUnit(null);
        if (onSaveSuccess) onSaveSuccess();
      } else showToast("error", json.message || "There was a problem saving.");
    } catch { showToast("error","Network issue."); }
    finally  { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!currentUnit || !confirm(`"${serialNumber}" Delete?`)) return;
    setDeleting(true);
    try {
      const res  = await fetch("/api/machines", {
        method:"DELETE", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ factory, machineName, serialNumber: serialNumber.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success","Machine unit deleted successfully.");
        await loadMachineUnits(machineName);
        setSerialNumber(""); setFloorName(""); setStatus("Running"); setCurrentUnit(null);
        if (onSaveSuccess) onSaveSuccess();
      } else showToast("error", json.message);
    } catch { showToast("error","Network issue."); }
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
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Machine Name <span className="text-red-400">*</span></label>
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
                  : <span>Total <span className="text-white font-bold">{existingUnits.length}</span> units</span>}
              </p>
              <div className="flex gap-1.5 flex-wrap justify-end">
                <button type="button" onClick={() => setStatusFilter("ALL")}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${statusFilter === "ALL" ? "bg-slate-600 border-slate-400 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                  ALL {existingUnits.length > 0 && `(${existingUnits.length})`}
                </button>
                {STATUS_OPTIONS.map(({ value, label }) => {
                  const count = unitStats[value] || 0;
                  if (!count) return null;
                  return (
                    <button key={value} type="button" onClick={() => setStatusFilter(statusFilter === value ? "ALL" : value)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${statusFilter === value ? STATUS_BADGE_MINI[value] : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">🔍</span>
              <input type="text" value={unitSearch} onChange={(e) => setUnitSearch(e.target.value)}
                placeholder="Search serial number..."
                className="w-full bg-[#161b27] border border-slate-700 text-white rounded-lg pl-8 pr-4 py-2 text-xs font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-colors placeholder:text-slate-600" />
              {unitSearch && <button type="button" onClick={() => setUnitSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-bold">✕</button>}
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
            {fetchingUnits ? (
              <div className="flex items-center justify-center py-8"><span className="text-cyan-400 text-xs animate-pulse font-mono">Loading...</span></div>
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
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all ${isSelected ? "bg-cyan-900/60 border-cyan-500 shadow-sm shadow-cyan-500/20" : "bg-[#161b27] border-slate-800 hover:border-slate-600 hover:bg-slate-800/60"}`}>
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
          placeholder="e.g. SN-001, M-042"
          className={`w-full bg-[#0f1117] border text-white rounded-lg px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:ring-1 transition-colors placeholder:text-slate-600 ${currentUnit ? "border-amber-700 focus:border-amber-500 focus:ring-amber-500/20" : "border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/30"}`}
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
          <p className="text-[10px] uppercase tracking-widest opacity-60 mb-2">{currentUnit ? "Update preview" : "New entry preview"}</p>
          <div className="flex flex-wrap gap-4 items-center">
            {[["Machine",machineName,"max-w-[160px] truncate"],["Serial",serialNumber.trim().toUpperCase(),"font-mono"],["Floor",floorName,""],["Status",status,""]].map(([l,v,cls]) => (
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
            {deleting ? "..." : "Delete"}
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
  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };

  return (
    <div className="bg-[#0f1117] font-mono pb-6">
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
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${tab === "search" ? "bg-cyan-900 text-cyan-300 border-b-2 border-cyan-400" : "bg-[#161b27] text-slate-500 hover:text-slate-300"}`}>
          🔍 Find Serial
        </button>
        <button onClick={() => setTab("machine")}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${tab === "machine" ? "bg-cyan-900 text-cyan-300 border-b-2 border-cyan-400" : "bg-[#161b27] text-slate-500 hover:text-slate-300"}`}>
          ＋ Machine Based
        </button>
      </div>
      <div className="mx-7 mt-4 bg-[#161b27] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />
        {tab === "search"
          ? <SerialSearchTab factory={factory} onSaveSuccess={onSaveSuccess} showToast={showToast} />
          : <MachineEditTab  factory={factory} onSaveSuccess={onSaveSuccess} showToast={showToast} />}
      </div>
      <p className="text-center text-slate-600 text-xs mt-4">
        {tab === "search"
          ? "Find any machine by its serial number and edit it directly."
          : "Select a machine type and enter a serial number to load existing units automatically."}
      </p>
    </div>
  );
}