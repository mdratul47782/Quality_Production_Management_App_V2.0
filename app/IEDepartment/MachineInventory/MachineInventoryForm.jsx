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

// ─── Serial Search Tab ────────────────────────────────────────────────────────
// Search by serial number across ALL machine types for this factory.
// Shows current machine/floor/status and allows editing in place.
function SerialSearchTab({ factory, onSaveSuccess, showToast }) {
  const [query,       setQuery]       = useState("");
  const [searching,   setSearching]   = useState(false);
  const [result,      setResult]      = useState(null); // { machine, unit }
  const [notFound,    setNotFound]    = useState(false);

  // Edit state
  const [editFloor,   setEditFloor]   = useState("");
  const [editStatus,  setEditStatus]  = useState("Running");
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  const handleSearch = useCallback(async () => {
    const sn = query.trim().toUpperCase();
    if (!sn) return;
    setSearching(true);
    setResult(null);
    setNotFound(false);
    try {
      const qs  = factory ? `?factory=${encodeURIComponent(factory)}` : "";
      const res  = await fetch(`/api/machines${qs}`);
      const json = await res.json();
      if (!json.success) { setNotFound(true); return; }

      let found = null;
      for (const machine of (json.data || [])) {
        const unit = (machine.units || []).find(
          (u) => u.serialNumber.toUpperCase() === sn
        );
        if (unit) { found = { machine, unit }; break; }
      }

      if (found) {
        setResult(found);
        setEditFloor(found.unit.floorName);
        setEditStatus(found.unit.status);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    } finally {
      setSearching(false);
    }
  }, [query, factory]);

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch("/api/machines", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factory,
          machineName:  result.machine.machineName,
          serialNumber: result.unit.serialNumber,
          floorName:    editFloor,
          status:       editStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "আপডেট হয়েছে!");
        setResult((prev) => ({
          ...prev,
          unit: { ...prev.unit, floorName: editFloor, status: editStatus },
        }));
        if (onSaveSuccess) onSaveSuccess();
      } else {
        showToast("error", json.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!result) return;
    if (!confirm(`"${result.unit.serialNumber}" মুছে ফেলবেন?`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/machines", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factory,
          machineName:  result.machine.machineName,
          serialNumber: result.unit.serialNumber,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "মুছে ফেলা হয়েছে।");
        setResult(null);
        setQuery("");
        if (onSaveSuccess) onSaveSuccess();
      } else {
        showToast("error", json.message);
      }
    } finally {
      setDeleting(false);
    }
  };

  const statusStyle = STATUS_STYLE[editStatus] || STATUS_STYLE.Running;
  const changed     = result && (editFloor !== result.unit.floorName || editStatus !== result.unit.status);

  return (
    <div className="p-7 space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Serial Number দিয়ে খুঁজুন
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setResult(null); setNotFound(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="যেমন: SN-001"
            className="flex-1 bg-[#0f1117] border border-slate-700 text-white rounded-lg px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors placeholder:text-slate-600"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="px-5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg text-sm transition-all"
          >
            {searching ? "..." : "খুঁজুন"}
          </button>
        </div>
      </div>

      {/* Not found */}
      {notFound && (
        <div className="bg-[#0f1117] border border-slate-800 rounded-xl px-4 py-6 text-center">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-slate-400 text-sm">
            <span className="font-mono text-white">{query.trim().toUpperCase()}</span> — কোনো machine এ পাওয়া যায়নি।
          </p>
        </div>
      )}

      {/* Result card */}
      {result && (
        <div className="space-y-4">
          {/* Found info */}
          <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-4">
            <p className="text-[10px] text-cyan-400 uppercase tracking-widest mb-3 font-mono">পাওয়া গেছে</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Serial</span>
                <span className="text-white font-mono font-bold text-sm">{result.unit.serialNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Machine</span>
                <span className="text-slate-200 text-xs font-semibold text-right max-w-[200px]">{result.machine.machineName}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                <span className="text-slate-500 text-xs">বর্তমান Floor</span>
                <span className="text-white font-bold text-sm">{result.unit.floorName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">বর্তমান Status</span>
                <span className={`font-bold text-sm ${STATUS_TEXT_COLOR[result.unit.status]}`}>
                  {result.unit.status}
                </span>
              </div>
            </div>
          </div>

          {/* Edit section */}
          <div className="space-y-3">
            <p className="text-[10px] text-amber-400 uppercase tracking-widest font-mono">পরিবর্তন করুন</p>

            <div className="grid grid-cols-2 gap-3">
              {/* Floor */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  Floor
                </label>
                <div className="relative">
                  <select
                    value={editFloor}
                    onChange={(e) => setEditFloor(e.target.value)}
                    className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm appearance-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
                  >
                    <option value="">— Floor —</option>
                    {FLOOR_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▾</div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className={`w-full bg-[#0f1117] border text-white rounded-lg px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-1 transition-colors ${statusStyle.ring} ${statusStyle.border}`}
                  >
                    {STATUS_OPTIONS.map(({ value, label, icon }) => (
                      <option key={value} value={value}>{icon} {label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▾</div>
                </div>
              </div>
            </div>

            {/* Change preview */}
            {changed && (
              <div className={`border rounded-xl px-4 py-3 ${statusStyle.badge}`}>
                <p className="text-[10px] uppercase tracking-widest opacity-60 mb-2">পরিবর্তন preview</p>
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

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !editFloor || !changed}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#0f1117] font-bold py-2.5 rounded-xl text-sm transition-all"
              >
                {saving ? "সেভ হচ্ছে..." : "✓ আপডেট করুন"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 bg-transparent border border-red-800 hover:border-red-500 text-red-400 hover:text-red-300 hover:bg-red-950/30 font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-40"
              >
                {deleting ? "..." : "মুছুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
  }, [machineName, loadMachineUnits]);

  useEffect(() => {
    if (!serialNumber.trim()) { setCurrentUnit(null); return; }
    const found = existingUnits.find(
      (u) => u.serialNumber.toLowerCase() === serialNumber.trim().toLowerCase()
    );
    if (found) { setCurrentUnit(found); setFloorName(found.floorName); setStatus(found.status); }
    else        { setCurrentUnit(null); }
  }, [serialNumber, existingUnits]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!machineName || !serialNumber.trim() || !floorName || !status) {
      showToast("error", "সব ঘর পূরণ করা আবশ্যক।"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/machines", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factory, machineName, serialNumber: serialNumber.trim().toUpperCase(), floorName, status }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message || "সফলভাবে সেভ হয়েছে!");
        await loadMachineUnits(machineName);
        setSerialNumber(""); setFloorName(""); setStatus("Running"); setCurrentUnit(null);
        if (onSaveSuccess) onSaveSuccess();
      } else showToast("error", json.message || "সেভ করতে সমস্যা হয়েছে।");
    } catch { showToast("error", "নেটওয়ার্ক সমস্যা।"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!currentUnit) return;
    if (!confirm(`"${serialNumber}" মুছে ফেলবেন?`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/machines", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factory, machineName, serialNumber: serialNumber.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Machine unit মুছে ফেলা হয়েছে।");
        await loadMachineUnits(machineName);
        setSerialNumber(""); setFloorName(""); setStatus("Running"); setCurrentUnit(null);
        if (onSaveSuccess) onSaveSuccess();
      } else showToast("error", json.message);
    } catch { showToast("error", "নেটওয়ার্ক সমস্যা।"); }
    finally { setDeleting(false); }
  };

  const unitStats   = existingUnits.reduce((acc, u) => { acc[u.status] = (acc[u.status] || 0) + 1; return acc; }, {});
  const isNew       = serialNumber.trim() && !currentUnit;
  const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.Running;

  return (
    <form onSubmit={handleSubmit} className="p-7 space-y-6">
      {/* Machine Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Machine Name <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select value={machineName} onChange={(e) => setMachineName(e.target.value)}
            className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-4 py-3 text-sm appearance-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors">
            <option value="">— Machine select করুন —</option>
            {MACHINE_NAMES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">▾</div>
        </div>
      </div>

      {/* Stats */}
      {machineName && (
        <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">
            {fetchingUnits ? <span className="text-cyan-400 animate-pulse">লোড হচ্ছে...</span> : `মোট ${existingUnits.length}টি unit`}
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <span key={value} className={`text-xs font-semibold px-3 py-1 rounded-full border
                ${value === "Running"    ? "bg-emerald-950 border-emerald-800 text-emerald-300" : ""}
                ${value === "Idle"       ? "bg-amber-950 border-amber-800 text-amber-300"       : ""}
                ${value === "Repairable" ? "bg-orange-950 border-orange-800 text-orange-300"    : ""}
                ${value === "Damage"     ? "bg-red-950 border-red-800 text-red-300"             : ""}
              `}>{label}: {unitStats[value] || 0}</span>
            ))}
          </div>
          {existingUnits.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {existingUnits.map((u) => (
                <button key={u.serialNumber} type="button" onClick={() => setSerialNumber(u.serialNumber)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all
                    ${serialNumber === u.serialNumber
                      ? "bg-cyan-900 border-cyan-500 text-cyan-200"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                    }`}
                  title={`${u.floorName} — ${u.status}`}>
                  {u.serialNumber}
                  <span className={`ml-1 ${STATUS_TEXT_COLOR[u.status]}`}>•</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Serial Number */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Serial Number <span className="text-red-400">*</span>
          {isNew       && <span className="ml-2 text-cyan-400 normal-case tracking-normal font-normal">— নতুন unit যোগ হবে</span>}
          {currentUnit && <span className="ml-2 text-amber-400 normal-case tracking-normal font-normal">— বিদ্যমান unit (আপডেট হবে)</span>}
        </label>
        <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)}
          placeholder="যেমন: SN-001, M-042"
          className={`w-full bg-[#0f1117] border text-white rounded-lg px-4 py-3 text-sm font-mono uppercase
            focus:outline-none focus:ring-1 transition-colors placeholder:text-slate-600
            ${currentUnit ? "border-amber-700 focus:border-amber-500 focus:ring-amber-500/20" : "border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/30"}`}
        />
        {currentUnit && (
          <div className="mt-2 flex items-center gap-3 bg-[#0f1117] border border-amber-900/50 rounded-lg px-4 py-2.5">
            <span className="text-slate-500 text-xs">বর্তমান:</span>
            <span className="text-white text-xs font-semibold">{currentUnit.floorName}</span>
            <span className="text-slate-600">•</span>
            <span className={`text-xs font-bold ${STATUS_TEXT_COLOR[currentUnit.status]}`}>{currentUnit.status}</span>
            <span className="text-slate-600 ml-auto">→ নিচে পরিবর্তন করুন</span>
          </div>
        )}
      </div>

      {/* Floor + Status */}
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

      {/* Preview */}
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

      {/* Actions */}
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#0f1117] font-bold py-3 rounded-xl text-sm tracking-widest uppercase transition-all shadow-lg shadow-cyan-500/20">
          {saving ? "সেভ হচ্ছে..." : currentUnit ? "আপডেট করুন" : "যোগ করুন"}
        </button>
        {currentUnit && (
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="px-5 bg-transparent border border-red-800 hover:border-red-500 text-red-400 hover:text-red-300 hover:bg-red-950/30 font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-40">
            {deleting ? "..." : "মুছুন"}
          </button>
        )}
        <button type="button" onClick={() => { setMachineName(""); setSerialNumber(""); setFloorName(""); setStatus("Running"); setExistingUnits([]); setCurrentUnit(null); }}
          className="px-5 bg-transparent border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 font-semibold py-3 rounded-xl text-sm tracking-widest uppercase transition-all">
          রিসেট
        </button>
      </div>
    </form>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function MachineInventoryForm({ onSaveSuccess, factory = "" }) {
  const [tab,   setTab]   = useState("search"); // "search" | "machine"
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] font-mono">
      <Toast toast={toast} />

      {/* Header */}
      <div className="px-7 pt-8 pb-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-1 bg-cyan-400 rounded-full" />
          <span className="text-xs tracking-[0.3em] text-cyan-400 uppercase">IE Department</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Machine Inventory</h1>
        <p className="text-slate-500 text-sm mt-1">প্রতিটি machine unit-এর serial number ও status track করুন</p>
      </div>

      {/* Tabs */}
      <div className="flex mx-7 mt-5 border border-slate-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setTab("search")}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all
            ${tab === "search" ? "bg-cyan-900 text-cyan-300 border-b-2 border-cyan-400" : "bg-[#161b27] text-slate-500 hover:text-slate-300"}`}
        >
          🔍 Serial খুঁজুন
        </button>
        <button
          onClick={() => setTab("machine")}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all
            ${tab === "machine" ? "bg-cyan-900 text-cyan-300 border-b-2 border-cyan-400" : "bg-[#161b27] text-slate-500 hover:text-slate-300"}`}
        >
          ＋ Machine ভিত্তিক
        </button>
      </div>

      {/* Card */}
      <div className="mx-7 mt-4 bg-[#161b27] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />
        {tab === "search"
          ? <SerialSearchTab  factory={factory} onSaveSuccess={onSaveSuccess} showToast={showToast} />
          : <MachineEditTab   factory={factory} onSaveSuccess={onSaveSuccess} showToast={showToast} />
        }
      </div>

      <p className="text-center text-slate-600 text-xs mt-4 pb-6">
        {tab === "search"
          ? "Serial number দিয়ে যেকোনো machine খুঁজুন এবং সরাসরি edit করুন।"
          : "Machine type select করে serial number দিলে বিদ্যমান unit স্বয়ংক্রিয়ভাবে লোড হবে।"}
      </p>
    </div>
  );
}