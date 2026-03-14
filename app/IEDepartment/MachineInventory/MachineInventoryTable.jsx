"use client";
// app/IEDepartment/MachineInventory/MachineInventoryTable.jsx

import React, { useState, useEffect, useCallback } from "react";

const FLOOR_COLS = [
  { floor: "A-2",     dbKey: "A-2",     runKey: "A2_run",     idleKey: "A2_idle"     },
  { floor: "A-3",     dbKey: "A-3",     runKey: "A3_run",     idleKey: "A3_idle"     },
  { floor: "A-4",     dbKey: "A-4",     runKey: "A4_run",     idleKey: "A4_idle"     },
  { floor: "A-5",     dbKey: "A-5",     runKey: "A5_run",     idleKey: "A5_idle"     },
  { floor: "B-2",     dbKey: "B-2",     runKey: "B2_run",     idleKey: "B2_idle"     },
  { floor: "B-3",     dbKey: "B-3",     runKey: "B3_run",     idleKey: "B3_idle"     },
  { floor: "B-4",     dbKey: "B-4",     runKey: "B4_run",     idleKey: "B4_idle"     },
  { floor: "B-5",     dbKey: "B-5",     runKey: "B5_run",     idleKey: "B5_idle"     },
  { floor: "A-6",     dbKey: "A-6",     runKey: "A6_run",     idleKey: "A6_idle"     },
  { floor: "B-6",     dbKey: "B-6",     runKey: "B6_run",     idleKey: "B6_idle"     },
  { floor: "C-4",     dbKey: "C-4",     runKey: "C4_run",     idleKey: "C4_idle"     },
  { floor: "K-3",     dbKey: "K-3",     runKey: "K3_run",     idleKey: "K3_idle"     },
  { floor: "SMD/CAD", dbKey: "SMD/CAD", runKey: "SMDCAD_run", idleKey: "SMDCAD_idle" },
  { floor: "Others",  dbKey: "Others",  runKey: "Others_run", idleKey: "Others_idle" },
  { floor: "New",     dbKey: "New",     runKey: "New_run",    idleKey: "New_idle"    },
];

const FLOOR_OPTIONS = [
  "A-2","B-2","A-3","B-3","A-4","B-4","A-5","B-5",
  "A-6","B-6","C-4","K-3","SMD/CAD","New","Others",
];

const STATUS_OPTIONS = ["Running","Idle","Repairable","Damage"];

const STATUS_STYLE = {
  Running:    { cell: "text-emerald-300", badge: "bg-emerald-950 border-emerald-800 text-emerald-300", chip: "bg-emerald-950 border-emerald-700 text-emerald-300", dot: "bg-emerald-400" },
  Idle:       { cell: "text-amber-300",   badge: "bg-amber-950 border-amber-800 text-amber-300",       chip: "bg-amber-950 border-amber-700 text-amber-300",       dot: "bg-amber-400"   },
  Repairable: { cell: "text-orange-300",  badge: "bg-orange-950 border-orange-800 text-orange-300",    chip: "bg-orange-950 border-orange-700 text-orange-300",    dot: "bg-orange-400"  },
  Damage:     { cell: "text-red-300",     badge: "bg-red-950 border-red-800 text-red-300",             chip: "bg-red-950 border-red-700 text-red-300",             dot: "bg-red-400"     },
};

function flattenMachine(doc, slNo) {
  const row = { _id: doc._id, slNo, machineName: doc.machineName, stockQty: doc.units?.length ?? 0, repairable: 0, damage: 0 };
  FLOOR_COLS.forEach(({ runKey, idleKey }) => { row[runKey] = 0; row[idleKey] = 0; });
  (doc.units ?? []).forEach((unit) => {
    const col = FLOOR_COLS.find((c) => c.dbKey === unit.floorName);
    if (!col) return;
    if (unit.status === "Running")    row[col.runKey]  += 1;
    if (unit.status === "Idle")       row[col.idleKey] += 1;
    if (unit.status === "Repairable") row.repairable   += 1;
    if (unit.status === "Damage")     row.damage       += 1;
  });
  return row;
}

function RunCell({ v, onClick }) {
  return (
    <td
      onClick={v ? onClick : undefined}
      className={`text-center text-xs px-1.5 py-1.5 border-r border-slate-700/50 font-medium min-w-[36px] transition-colors
        ${v ? "text-emerald-300 cursor-pointer hover:bg-emerald-950/40 hover:text-emerald-200" : "text-slate-700 cursor-default"}`}
    >
      {v || "—"}
    </td>
  );
}

function IdleCell({ v, onClick }) {
  return (
    <td
      onClick={v ? onClick : undefined}
      className={`text-center text-xs px-1.5 py-1.5 border-r border-slate-700/50 bg-amber-950/20 font-medium min-w-[36px] transition-colors
        ${v ? "text-amber-300 cursor-pointer hover:bg-amber-950/60 hover:text-amber-200" : "text-slate-700 cursor-default"}`}
    >
      {v || "—"}
    </td>
  );
}

// ── Floor Cell Drawer ─────────────────────────────────────────────────────────
// floorName can be null for Repairable/Damage (status-only filter)
function FloorCellDrawer({ machineName, floorName, status, factory, onClose, onSaved }) {
  const [units,      setUnits]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [editFloor,  setEditFloor]  = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ name: machineName });
      if (factory) qs.set("factory", factory);
      const res  = await fetch(`/api/machines?${qs}`);
      const json = await res.json();
      if (json.success && json.data) {
        const allUnits = json.data.units ?? [];
        // KEY FIX: if floorName is null (Repairable/Damage), filter by status only
        const filtered = floorName
          ? allUnits.filter((u) => u.floorName === floorName && u.status === status)
          : allUnits.filter((u) => u.status === status);
        setUnits(filtered);
      }
    } finally { setLoading(false); }
  }, [machineName, floorName, status, factory]);

  useEffect(() => { load(); }, [load]);

  const selectUnit = (u) => {
    setSelected(u);
    setEditFloor(u.floorName);
    setEditStatus(u.status);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/machines", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factory,
          machineName,
          serialNumber: selected.serialNumber,
          floorName:    editFloor,
          status:       editStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Updated!");
        setSelected(null);
        await load();
        if (onSaved) onSaved();
      } else showToast("error", json.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm(`"${selected.serialNumber}" Delete?`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/machines", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factory, machineName, serialNumber: selected.serialNumber }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Machine deleted successfully.");
        setSelected(null);
        await load();
        if (onSaved) onSaved();
      } else showToast("error", json.message);
    } finally { setDeleting(false); }
  };

  const st     = STATUS_STYLE[status]     || STATUS_STYLE.Running;
  const editSt = STATUS_STYLE[editStatus] || STATUS_STYLE.Running;
  const changed = selected && (editFloor !== selected.floorName || editStatus !== selected.status);

  return (
    <>
      {toast && (
        <div className={`fixed top-5 right-5 z-[999] px-5 py-3 rounded-lg text-sm font-semibold shadow-2xl border
          ${toast.type === "success" ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-red-950 border-red-500 text-red-300"}`}>
          {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[440px] bg-[#0f1117] border-l border-slate-800 z-50 flex flex-col shadow-2xl font-mono">

        {/* Header */}
        <div className={`border-b border-slate-800 px-5 py-4`} style={{ background: "rgba(15,17,23,0.95)" }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
              <span className={`text-xs font-bold uppercase tracking-widest ${st.cell}`}>{status}</span>
              {floorName && (
                <>
                  <span className="text-slate-500 text-xs">·</span>
                  <span className="text-xs font-bold text-white">Floor {floorName}</span>
                </>
              )}
              {!floorName && (
                <>
                  <span className="text-slate-500 text-xs">·</span>
                  <span className="text-xs text-slate-400">All Floors</span>
                </>
              )}
            </div>
            <button onClick={onClose}
              className="text-slate-500 hover:text-slate-300 text-lg font-bold w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-all">
              ✕
            </button>
          </div>
          <p className="text-white font-bold text-sm truncate">{machineName}</p>
          {!loading && (
            <p className="text-xs text-slate-400 mt-0.5">
              {units.length} unit
              {!floorName && <span className="ml-1 text-slate-500">(All Floor)</span>}
            </p>
          )}
        </div>

        {/* Unit list — grouped by floor when floorName is null */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-slate-600 text-xs animate-pulse text-center py-10">Loading...</p>
          ) : units.length === 0 ? (
            <p className="text-slate-600 text-xs text-center py-10">There is no unit.</p>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-mono">
                 select Serial → Edit 
              </p>

              {/* When no floorName (Repairable/Damage): group by floor */}
              {!floorName ? (
                (() => {
                  // group units by floorName
                  const grouped = units.reduce((acc, u) => {
                    const key = u.floorName || "Others";
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(u);
                    return acc;
                  }, {});
                  return Object.entries(grouped).map(([floor, floorUnits]) => (
                    <div key={floor} className="mb-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1">
                        Floor: <span className="text-slate-300">{floor}</span>
                        <span className="ml-2 text-slate-600 font-normal">({floorUnits.length})</span>
                      </p>
                      <div className="space-y-1">
                        {floorUnits
                          .slice()
                          .sort((a, b) => a.serialNumber.localeCompare(b.serialNumber))
                          .map((u) => {
                            const isSel = selected?.serialNumber === u.serialNumber;
                            return (
                              <button
                                key={u.serialNumber}
                                type="button"
                                onClick={() => isSel ? setSelected(null) : selectUnit(u)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all
                                  ${isSel
                                    ? "bg-cyan-900/40 border-cyan-500 text-cyan-200"
                                    : `${st.chip} hover:brightness-125`}`}
                              >
                                <div className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                                <span className="font-bold font-mono text-sm flex-1">{u.serialNumber}</span>
                                <span className="text-[10px] text-slate-500 font-normal">{u.floorName}</span>
                                {isSel && <span className="text-xs text-cyan-400">✎</span>}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ));
                })()
              ) : (
                // Normal floor-specific list
                units
                  .slice()
                  .sort((a, b) => a.serialNumber.localeCompare(b.serialNumber))
                  .map((u) => {
                    const isSel = selected?.serialNumber === u.serialNumber;
                    return (
                      <button
                        key={u.serialNumber}
                        type="button"
                        onClick={() => isSel ? setSelected(null) : selectUnit(u)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all
                          ${isSel
                            ? "bg-cyan-900/40 border-cyan-500 text-cyan-200"
                            : `${st.chip} hover:brightness-125`}`}
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                        <span className="font-bold font-mono text-sm flex-1">{u.serialNumber}</span>
                        {isSel && <span className="text-xs text-cyan-400">✎ edit</span>}
                      </button>
                    );
                  })
              )}
            </div>
          )}
        </div>

        {/* Edit panel */}
        {selected && (
          <div className="border-t border-slate-800 bg-[#161b27] p-4 space-y-3 shrink-0">
            <p className="text-[10px] text-amber-400 uppercase tracking-widest font-bold">
              ✎ {selected.serialNumber} — Update
            </p>

            {/* Current info */}
            <div className="flex items-center gap-3 bg-[#0f1117] border border-slate-800 rounded-lg px-3 py-2 text-xs">
              <span className="text-slate-500">Current:</span>
              <span className="text-white font-bold">{selected.floorName}</span>
              <span className="text-slate-600">·</span>
              <span className={`font-bold ${STATUS_STYLE[selected.status]?.cell || "text-slate-300"}`}>{selected.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Floor select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Floor</label>
                <div className="relative">
                  <select
                    value={editFloor}
                    onChange={(e) => setEditFloor(e.target.value)}
                    className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-3 py-2.5 text-xs appearance-none focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    {FLOOR_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">▾</div>
                </div>
              </div>

              {/* Status select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                <div className="relative">
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className={`w-full bg-[#0f1117] border text-white rounded-lg px-3 py-2.5 text-xs appearance-none focus:outline-none transition-colors ${editSt.chip}`}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">▾</div>
                </div>
              </div>
            </div>

            {/* Change preview */}
            {changed && (
              <div className={`rounded-lg px-3 py-2 text-xs border ${editSt.badge}`}>
                <span className="opacity-60">{selected.floorName} · {selected.status}</span>
                <span className="mx-2 opacity-40">→</span>
                <span className="font-bold">{editFloor} · {editStatus}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !changed}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#0f1117] font-bold py-2.5 rounded-xl text-xs transition-all"
              >
                {saving ? "Saving..." : "✓ Update"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 border border-red-800 hover:border-red-500 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl text-xs transition-all disabled:opacity-40"
              >
                {deleting ? "..." : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-3 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Unit Detail Panel ─────────────────────────────────────────────────────────
function UnitDetailPanel({ machineName, factory, refreshKey }) {
  const [units,   setUnits]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ name: machineName });
        if (factory) qs.set("factory", factory);
        const res  = await fetch(`/api/machines?${qs}`);
        const json = await res.json();
        if (json.success && json.data) setUnits(json.data.units ?? []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, [machineName, factory, refreshKey]);

  if (loading) return <p className="text-slate-600 text-xs animate-pulse">Loading...</p>;
  if (!units.length) return <p className="text-slate-600 text-xs">There is no unit.</p>;

  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-mono">
        {machineName} — {units.length} unit
      </p>
      <div className="flex flex-wrap gap-2">
        {units
          .slice()
          .sort((a, b) => a.serialNumber.localeCompare(b.serialNumber))
          .map((u) => {
            const st = STATUS_STYLE[u.status] || { chip: "bg-slate-800 border-slate-700 text-slate-300", dot: "bg-slate-500" };
            return (
              <div key={u.serialNumber}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${st.chip}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                <span className="font-bold">{u.serialNumber}</span>
                <span className="opacity-40">|</span>
                <span className="opacity-70">{u.floorName}</span>
                <span className="opacity-40">|</span>
                <span>{u.status}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ── Main Table ────────────────────────────────────────────────────────────────
export default function MachineInventoryTable({ refreshKey, factory = "" }) {
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [sortCol,  setSortCol]  = useState("slNo");
  const [sortDir,  setSortDir]  = useState("asc");
  const [expanded, setExpanded] = useState(null);
  const [drawer,   setDrawer]   = useState(null);
  const [drawerKey,setDrawerKey]= useState(0);

  const loadTable = useCallback(async () => {
    setLoading(true);
    try {
      const qs  = factory ? `?factory=${encodeURIComponent(factory)}` : "";
      const res  = await fetch(`/api/machines${qs}`);
      const json = await res.json();
      if (json.success) setRows(json.data.map((doc, i) => flattenMachine(doc, i + 1)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [factory]);

  useEffect(() => { loadTable(); }, [refreshKey, loadTable]);

  const filtered = rows
    .filter((r) => r.machineName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = a[sortCol] ?? 0, vb = b[sortCol] ?? 0;
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === "asc" ? va - vb : vb - va;
    });

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const SortIcon = ({ col }) => (
    <span className="ml-1 opacity-60">{sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
  );

  const totalStock      = rows.reduce((s, r) => s + r.stockQty, 0);
  const totalRunning    = rows.reduce((s, r) => FLOOR_COLS.reduce((a, { runKey })  => a + (r[runKey]  || 0), s), 0);
  const totalIdle       = rows.reduce((s, r) => FLOOR_COLS.reduce((a, { idleKey }) => a + (r[idleKey] || 0), s), 0);
  const totalRepairable = rows.reduce((s, r) => s + r.repairable, 0);
  const totalDamage     = rows.reduce((s, r) => s + r.damage, 0);

  // floorName=null means "all floors, filter by status only" → used for Repairable/Damage
  const openDrawer = (machineName, floorName, status) => {
    setDrawer({ machineName, floorName, status });
    setDrawerKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1117] relative">

      {drawer && (
        <FloorCellDrawer
          key={drawerKey}
          machineName={drawer.machineName}
          floorName={drawer.floorName}   /* null for Repairable/Damage */
          status={drawer.status}
          factory={factory}
          onClose={() => setDrawer(null)}
          onSaved={() => { loadTable(); }}
        />
      )}

      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Total Units", val: totalStock,      color: "bg-slate-800 text-slate-200"    },
            { label: "Running",     val: totalRunning,    color: "bg-emerald-950 text-emerald-300" },
            { label: "Idle",        val: totalIdle,       color: "bg-amber-950 text-amber-300"    },
            { label: "Repairable",  val: totalRepairable, color: "bg-orange-950 text-orange-300"  },
            { label: "Damage",      val: totalDamage,     color: "bg-red-950 text-red-300"        },
          ].map(({ label, val, color }) => (
            <span key={label} className={`${color} text-xs font-semibold px-3 py-1 rounded-full`}>
              {label}: {val}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[10px] text-slate-600 font-mono hidden md:block">
            💡 Click on Floor cell → view and edit serial list
          </p>
          <input
            type="text"
            placeholder="Find Machine ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#161b27] border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 w-52 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-500 text-sm animate-pulse">Loading data...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No data found.</div>
        ) : (
          <table className="w-full border-collapse text-xs" style={{ minWidth: "1600px" }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#161b27] border-b border-slate-700">
                <th rowSpan={2} onClick={() => handleSort("slNo")} className="border-r border-slate-700 px-2 py-2 text-slate-400 font-semibold cursor-pointer whitespace-nowrap">
                  S/L <SortIcon col="slNo" />
                </th>
                <th rowSpan={2} onClick={() => handleSort("machineName")} className="border-r border-slate-700 px-2 py-2 text-left text-slate-400 font-semibold cursor-pointer whitespace-nowrap">
                  Machine Name <SortIcon col="machineName" />
                </th>
                <th rowSpan={2} onClick={() => handleSort("stockQty")} className="border-r border-slate-700 px-2 py-2 text-slate-400 font-semibold cursor-pointer whitespace-nowrap">
                  Units <SortIcon col="stockQty" />
                </th>
                {FLOOR_COLS.map(({ floor }) => (
                  <th key={floor} colSpan={2} className="border-r border-slate-700 px-1 py-1.5 text-center text-cyan-400 font-bold tracking-wider">
                    {floor}
                  </th>
                ))}
                <th rowSpan={2} className="border-r border-slate-700 px-2 py-2 text-orange-400 font-semibold whitespace-nowrap">Repair</th>
                <th rowSpan={2} className="px-2 py-2 text-red-400 font-semibold whitespace-nowrap">Damage</th>
              </tr>
              <tr className="bg-[#1a2030] border-b border-slate-700">
                {FLOOR_COLS.map(({ floor }) => (
                  <React.Fragment key={floor}>
                    <th className="border-r border-slate-700/50 px-1 py-1 text-center text-emerald-500 font-medium">Run</th>
                    <th className="border-r border-slate-700 px-1 py-1 text-center text-amber-500 font-medium bg-amber-950/20">Idle</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map((row, idx) => (
                <React.Fragment key={row._id}>
                  <tr className={`border-b border-slate-800 transition-colors
                    ${expanded === row.machineName ? "bg-slate-800/50" : idx % 2 === 0 ? "bg-[#0f1117]" : "bg-[#131720]"}`}>
                    <td className="text-center border-r border-slate-700/50 px-2 py-1.5 text-slate-500">{row.slNo}</td>
                    <td
                      className="border-r border-slate-700/50 px-2 py-1.5 text-slate-200 whitespace-nowrap font-medium cursor-pointer hover:text-cyan-300 transition-colors"
                      onClick={() => setExpanded(expanded === row.machineName ? null : row.machineName)}
                    >
                      <span className="mr-1 text-slate-600 text-[10px]">{expanded === row.machineName ? "▾" : "▸"}</span>
                      {row.machineName}
                    </td>
                    <td className="text-center border-r border-slate-700/50 px-2 py-1.5 text-white font-bold">{row.stockQty}</td>

                    {FLOOR_COLS.map(({ floor, dbKey, runKey, idleKey }) => (
                      <React.Fragment key={floor}>
                        <RunCell  v={row[runKey]}  onClick={() => openDrawer(row.machineName, dbKey, "Running")} />
                        <IdleCell v={row[idleKey]} onClick={() => openDrawer(row.machineName, dbKey, "Idle")}    />
                      </React.Fragment>
                    ))}

                    {/* Repairable — floorName=null so drawer shows all floors */}
                    <td
                      className={`text-center border-r border-slate-700/50 px-2 py-1.5 font-medium transition-colors
                        ${row.repairable ? "text-orange-400 cursor-pointer hover:bg-orange-950/30" : "text-slate-700 cursor-default"}`}
                      onClick={() => row.repairable && openDrawer(row.machineName, null, "Repairable")}
                      title={row.repairable ? "Click to see repairable units" : ""}
                    >
                      {row.repairable || "—"}
                    </td>

                    {/* Damage — floorName=null */}
                    <td
                      className={`text-center px-2 py-1.5 font-medium transition-colors
                        ${row.damage ? "text-red-400 cursor-pointer hover:bg-red-950/30" : "text-slate-700 cursor-default"}`}
                      onClick={() => row.damage && openDrawer(row.machineName, null, "Damage")}
                      title={row.damage ? "Click to see damage units" : ""}
                    >
                      {row.damage || "—"}
                    </td>
                  </tr>

                  {expanded === row.machineName && (
                    <tr className="bg-[#0d1018] border-b-2 border-cyan-900/40">
                      <td colSpan={3 + FLOOR_COLS.length * 2 + 2} className="px-6 py-4">
                        <UnitDetailPanel machineName={row.machineName} factory={factory} refreshKey={refreshKey} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>

            <tfoot className="sticky bottom-0 bg-[#1a2030] border-t-2 border-slate-600">
              <tr>
                <td className="border-r border-slate-700 px-2 py-2" />
                <td className="border-r border-slate-700 px-2 py-2 text-slate-300 font-bold">TOTAL ({filtered.length} types)</td>
                <td className="text-center border-r border-slate-700 px-2 py-2 text-white font-bold">{filtered.reduce((s, r) => s + r.stockQty, 0)}</td>
                {FLOOR_COLS.map(({ floor, runKey, idleKey }) => (
                  <React.Fragment key={floor}>
                    <td className="text-center text-emerald-300 font-bold border-r border-slate-700/50 px-1 py-2">{filtered.reduce((s, r) => s + (r[runKey] || 0), 0)}</td>
                    <td className="text-center text-amber-300 font-bold border-r border-slate-700 px-1 py-2 bg-amber-950/20">{filtered.reduce((s, r) => s + (r[idleKey] || 0), 0)}</td>
                  </React.Fragment>
                ))}
                <td className="text-center text-orange-400 font-bold border-r border-slate-700 px-2 py-2">{filtered.reduce((s, r) => s + r.repairable, 0)}</td>
                <td className="text-center text-red-400 font-bold px-2 py-2">{filtered.reduce((s, r) => s + r.damage, 0)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}