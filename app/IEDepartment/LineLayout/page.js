"use client";
// app/IEDepartment/LineLayout/page.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const FLOOR_OPTIONS  = ["A-2","B-2","A-3","B-3","A-4","B-4","A-5","B-5","A-6","B-6","C-4","K-3","SMD/CAD","Others"];
const LINE_OPTIONS   = Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(2, "0"));
const BUYER_OPTIONS  = ["Decathlon - knit","Decathlon - woven","Walmart","Columbia","ZXY","CTC","DIESEL","Sports Group Denmark","Identity","Fifth Avenue","Others"];
const HOURS_OPTIONS  = Array.from({ length: 14 }, (_, i) => i + 1);
const SERIAL_OPTIONS = Array.from({ length: 60 }, (_, i) => i + 1);

const PROCESS_NAMES = [
  "BONE POCKET MAKE BY PROFILE","POCKET POINT CUT",
  "POCKET TOP STITCH & 'L' TACK (2) (ONE SIDE)","DART SEWING (2)",
  "FACING ATTACH AT BACK & BACK YOKE HEM","MARKING AT HOOD",
  "LABEL MAKE","LABEL TACK","LOOP MAKE & LOOP ATTACH",
  "VELCRO ATTACH AT BONE & MARKING AT BACK YOKE",
  "YOKE ATTACH AT FRONT (2) & SHOULDER JOIN","SLEEVE ATTACH",
  "MARKING AT HOOD & HOOD 3 PART JOIN WITH ELASTIC","HOOD STITCH",
  "SIDE SEAM SEWING","RAWEDGE CUT",
  "SEAM SEALING AT SIDE SEAM,ARMHOLE & POCKET (ONE SIDE)",
  "SEAM SEALING AT HOOD,COLLAR,SHOULDER & BACK YOKE",
  "ZIPPER TACK,ZIPPER GARD MAKE & ZIPPER ATTACH AT GARD",
  "BODY TURN","THREAD CUT","IRONING","QC CHECK","TRIMMING","PACKING",
];

const MACHINE_TYPES = [
  "SINGLE NDL (PLAIN M/C)","SINGLE NDL (TOP FEED) M/C","SINGLE NDL (NDL FEED) M/C",
  "SINGLE NDL (CUFFS) M/C","DLM SINGLE NEEDLE VERTICAL CUTTER","DOUBLE NDL",
  "POCKET WELL (APW) M/C","3/8 T CHAIN STITCH (3 NDL) M/C","INTER LOCK (2 NDL 5TH) M/C",
  "OVER LOCK (2 NDL 4TH) M/C","BARTACK M/C","KANSAI","EYELET HOLE M/C","HELPER",
];

// Excel color scheme — bright on dark bg
const MACHINE_COLORS = {
  "SINGLE NDL (PLAIN M/C)":           { bg:"#1e3a5f", border:"#3b82f6", text:"#93c5fd", badge:"#1d4ed8" },
  "SINGLE NDL (TOP FEED) M/C":        { bg:"#1e3a5f", border:"#3b82f6", text:"#93c5fd", badge:"#1d4ed8" },
  "SINGLE NDL (NDL FEED) M/C":        { bg:"#1e3a5f", border:"#3b82f6", text:"#93c5fd", badge:"#1d4ed8" },
  "SINGLE NDL (CUFFS) M/C":           { bg:"#1e3a5f", border:"#3b82f6", text:"#93c5fd", badge:"#1d4ed8" },
  "DLM SINGLE NEEDLE VERTICAL CUTTER":{ bg:"#2d1b4e", border:"#8b5cf6", text:"#c4b5fd", badge:"#7c3aed" },
  "DOUBLE NDL":                        { bg:"#1e2a4e", border:"#6366f1", text:"#a5b4fc", badge:"#4338ca" },
  "POCKET WELL (APW) M/C":            { bg:"#1a3a2e", border:"#10b981", text:"#6ee7b7", badge:"#059669" },
  "3/8 T CHAIN STITCH (3 NDL) M/C":   { bg:"#1a3a2e", border:"#10b981", text:"#6ee7b7", badge:"#059669" },
  "OVER LOCK (2 NDL 4TH) M/C":        { bg:"#0d3330", border:"#14b8a6", text:"#5eead4", badge:"#0d9488" },
  "INTER LOCK (2 NDL 5TH) M/C":       { bg:"#0d3330", border:"#14b8a6", text:"#5eead4", badge:"#0d9488" },
  "BARTACK M/C":                       { bg:"#3b1a2e", border:"#ec4899", text:"#f9a8d4", badge:"#be185d" },
  "KANSAI":                            { bg:"#3b1040", border:"#d946ef", text:"#f0abfc", badge:"#a21caf" },
  "EYELET HOLE M/C":                   { bg:"#2a1a10", border:"#f97316", text:"#fdba74", badge:"#c2410c" },
  "HELPER":                            { bg:"#1a1f2e", border:"#475569", text:"#94a3b8", badge:"#334155" },
  "default":                           { bg:"#0e2a3a", border:"#22d3ee", text:"#67e8f9", badge:"#0e7490" },
};

function mc(type) { return MACHINE_COLORS[type] || MACHINE_COLORS["default"]; }

function calcTargets(smv, eff, operator, hours) {
  const e = (parseFloat(eff) || 0) / 100;
  const s = parseFloat(smv) || 0;
  const o = parseInt(operator) || 0;
  const h = parseInt(hours) || 8;
  const oneHour = s > 0 ? Math.round((60 / s) * e * o) : 0;
  return { oneHourTarget: oneHour, dailyTarget: Math.max(0, oneHour * h - 2) };
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-4 right-4 z-[999] px-6 py-3 rounded-xl text-base font-semibold shadow-2xl border
      ${toast.type === "success" ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-red-950 border-red-500 text-red-300"}`}>
      {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
    </div>
  );
}

// ─── Waste / Bad Machine Floor Picker ─────────────────────────────────────────
function WasteFloorPicker({ processEntry, layoutFloor, onConfirm, onCancel }) {
  // processEntry.machines = [{machineId, machineName, fromFloor}]
  // User picks: which machine slot + which destination floor to send it to (mark as waste/idle elsewhere)
  const [wasteFloor, setWasteFloor] = useState(layoutFloor || FLOOR_OPTIONS[0]);
  const [selected, setSelected]     = useState(
    (processEntry.machines || []).map((m) => ({ ...m, wasteTo: layoutFloor || m.fromFloor }))
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#161b27] border border-slate-600 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-2xl" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🚫</span>
            <div>
              <h3 className="font-bold text-white text-base">Machine Waste করুন</h3>
              <p className="text-slate-400 text-sm">#{processEntry.serialNo} — {processEntry.processName?.substring(0,40)}</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">
              কোন Floor এ পাঠাবেন? (Idle হবে)
            </label>
            <select value={wasteFloor} onChange={(e) => setWasteFloor(e.target.value)}
              className="w-full bg-[#0f1117] border border-slate-600 text-white rounded-lg px-4 py-3 text-base focus:outline-none focus:border-red-400 appearance-none">
              {FLOOR_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {(processEntry.machines || []).length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Machines</p>
              {(processEntry.machines || []).map((m, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#0f1117] rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <span className="text-sm text-slate-300 flex-1">{m.machineName}</span>
                  <span className="text-xs text-amber-400">{m.fromFloor} →</span>
                  <span className="text-xs text-red-300 font-bold">{wasteFloor}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-500 bg-[#0f1117] rounded-lg px-3 py-2 mb-5">
            এই process টি সরানো হবে এবং machine গুলো <strong className="text-red-300">{wasteFloor}</strong> floor এ idle হবে।
          </p>

          <div className="flex gap-3">
            <button onClick={() => onConfirm(wasteFloor)}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl text-sm transition-all">
              🚫 Waste করুন
            </button>
            <button onClick={onCancel}
              className="px-6 border border-slate-600 hover:border-slate-400 text-slate-400 rounded-xl text-sm transition-all">
              বাতিল
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Machine Floor Picker Modal ───────────────────────────────────────────────
function MachineFloorPicker({ machineType, onConfirm, onCancel }) {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch("/api/machines");
        const json = await res.json();
        if (json.success) {
          setMachines((json.data || []).filter((m) =>
            machineType === "HELPER" ? true : m.machineName === machineType
          ));
        }
      } finally { setLoading(false); }
    })();
  }, [machineType]);

  function toggleFloor(machineId, machineName, floorName) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.machineId === machineId && s.fromFloor === floorName);
      return exists
        ? prev.filter((s) => !(s.machineId === machineId && s.fromFloor === floorName))
        : [...prev, { machineId, machineName, fromFloor: floorName }];
    });
  }

  const isSel = (mid, floor) => selected.some((s) => s.machineId === mid && s.fromFloor === floor);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#161b27] border border-slate-600 rounded-2xl w-full max-w-xl shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-t-2xl" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-white text-base">Machine ও Floor select করুন</h3>
            <span className="text-sm text-cyan-400 bg-cyan-950 px-3 py-1 rounded-full">{machineType}</span>
          </div>
          {loading ? (
            <p className="text-slate-500 text-base animate-pulse py-8 text-center">লোড হচ্ছে...</p>
          ) : machines.length === 0 ? (
            <p className="text-slate-600 text-base py-8 text-center">কোনো machine পাওয়া যায়নি।</p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
              {machines.map((m) => (
                <div key={m._id}>
                  <p className="text-sm text-slate-400 mb-2 font-medium">{m.machineName}</p>
                  <div className="flex flex-wrap gap-2">
                    {(m.floors || []).map((f) => {
                      const sel = isSel(m._id, f.floorName);
                      const hasIdle = f.idle > 0;
                      return (
                        <button key={f.floorName} disabled={!hasIdle}
                          onClick={() => toggleFloor(m._id, m.machineName, f.floorName)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all
                            ${sel ? "bg-cyan-500 border-cyan-400 text-[#0f1117]"
                              : hasIdle ? "bg-[#0f1117] border-slate-600 text-slate-300 hover:border-cyan-500"
                              : "bg-[#0f1117] border-slate-800 text-slate-700 cursor-not-allowed"}`}>
                          {f.floorName}
                          <span className={`ml-2 ${hasIdle ? "text-amber-400" : "text-slate-700"}`}>
                            ({f.idle} idle)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <button disabled={selected.length === 0} onClick={() => onConfirm(selected)}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#0f1117] font-bold py-3 rounded-xl text-sm transition-all">
              {selected.length > 0 ? `${selected.length}টি machine যোগ করুন` : "কোনো machine select করুনি"}
            </button>
            <button onClick={onCancel}
              className="px-6 border border-slate-600 hover:border-slate-500 text-slate-400 rounded-xl text-sm transition-all">
              বাতিল
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Excel-style Layout Grid ──────────────────────────────────────────────────
function LayoutGrid({ processes, sketchUrl, onWaste, layoutFloor }) {
  const [wasteTarget, setWasteTarget] = useState(null);

  // Group by serialNo so same serial = same cell
  const sorted = [...processes].sort((a, b) => a.serialNo - b.serialNo);

  // Build row pairs: [[left, right], [left, right], ...]
  // Group entries by serial, then pair them left/right
  const serialGroups = {};
  sorted.forEach((p) => {
    if (!serialGroups[p.serialNo]) serialGroups[p.serialNo] = [];
    serialGroups[p.serialNo].push(p);
  });

  const serialKeys = Object.keys(serialGroups).map(Number).sort((a, b) => a - b);
  // Pair serials into rows of 2
  const rows = [];
  for (let i = 0; i < serialKeys.length; i += 2) {
    rows.push([serialKeys[i], serialKeys[i + 1] ?? null]);
  }

  // Machine summary
  const summary = {};
  sorted.forEach((p) => {
    const key = p.machineType?.split(" ").slice(0, 2).join(" ") || "?";
    summary[key] = (summary[key] || 0) + (p.machines?.length || 1);
  });

  function ProcessCell({ entry }) {
    const c = mc(entry.machineType);
    return (
      <div className="relative group" style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 8 }}>
        {/* Waste button */}
        <button
          onClick={() => setWasteTarget(entry)}
          className="absolute top-1 right-1 w-6 h-6 rounded-full hidden group-hover:flex items-center justify-center text-xs font-bold transition-all z-10"
          style={{ background: "#7f1d1d", color: "#fca5a5" }}
          title="Waste করুন">
          ✕
        </button>

        {/* Serial badge */}
        <div className="flex items-center gap-1.5 px-2.5 pt-2 pb-1">
          <span className="text-xs font-black px-2 py-0.5 rounded" style={{ background: c.badge, color: "#fff" }}>
            #{entry.serialNo}
          </span>
        </div>

        {/* Process name */}
        <div className="px-2.5 pb-1.5">
          <p className="text-sm font-semibold leading-snug" style={{ color: c.text }}>
            {entry.processName}
          </p>
        </div>

        {/* Machines */}
        {entry.machineType !== "HELPER" && (entry.machines || []).length > 0 && (
          <div className="px-2.5 pb-2 flex flex-wrap gap-1">
            {entry.machines.map((m, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ background: "rgba(0,0,0,0.35)", color: c.text, opacity: 0.85 }}>
                {m.machineName?.split(" ").slice(0, 2).join(" ")} · <strong>{m.fromFloor}</strong>
              </span>
            ))}
          </div>
        )}
        {entry.machineType === "HELPER" && (
          <div className="px-2.5 pb-2">
            <span className="text-xs px-2 py-0.5 rounded-md" style={{ background:"rgba(0,0,0,0.35)", color:"#94a3b8" }}>
              HELPER
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {wasteTarget && (
        <WasteFloorPicker
          processEntry={wasteTarget}
          layoutFloor={layoutFloor}
          onConfirm={(floor) => { onWaste(wasteTarget._id, floor); setWasteTarget(null); }}
          onCancel={() => setWasteTarget(null)}
        />
      )}

      {/* Summary bar */}
      {Object.keys(summary).length > 0 && (
        <div className="px-4 py-2 border-b border-slate-800 flex flex-wrap gap-2 shrink-0">
          {Object.entries(summary).map(([name, count]) => (
            <span key={name} className="text-sm bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-medium">
              {name}: <strong className="text-white">{count}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Grid area */}
      <div className="flex-1 overflow-auto relative p-3">
        {sketchUrl && (
          <img src={sketchUrl} alt="sketch"
            className="absolute inset-0 w-full h-full object-contain opacity-8 pointer-events-none" style={{ opacity: 0.06 }} />
        )}

        {rows.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-600 text-base">
            Process যোগ করলে এখানে layout দেখাবে
          </div>
        ) : (
          /* Excel-style: header row then data rows */
          <table className="w-full border-collapse relative z-10" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "50%" }} />
              <col style={{ width: "50%" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="text-center text-sm font-bold py-2 px-3 border border-slate-700 bg-slate-800 text-slate-300">
                  LEFT SIDE
                </th>
                <th className="text-center text-sm font-bold py-2 px-3 border border-slate-700 bg-slate-800 text-slate-300">
                  RIGHT SIDE
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([leftSerial, rightSerial], rowIdx) => {
                const leftEntries  = leftSerial  != null ? serialGroups[leftSerial]  : [];
                const rightEntries = rightSerial != null ? serialGroups[rightSerial] : [];
                return (
                  <tr key={rowIdx}>
                    {/* LEFT cell */}
                    <td className="border border-slate-700 p-1.5 align-top" style={{ background:"#0d1117" }}>
                      <div className="space-y-1">
                        {leftEntries.map((e) => <ProcessCell key={e._id} entry={e} />)}
                      </div>
                    </td>
                    {/* RIGHT cell */}
                    <td className="border border-slate-700 p-1.5 align-top" style={{ background:"#0d1117" }}>
                      <div className="space-y-1">
                        {rightEntries.map((e) => <ProcessCell key={e._id} entry={e} />)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Drag-to-reorder Serial List ──────────────────────────────────────────────
function DragSerialList({ processes, layoutId, onUpdate, showToast }) {
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const dragIdx = useRef(null);
  const dragOverIdx = useRef(null);

  useEffect(() => {
    setItems([...processes].sort((a, b) => a.serialNo - b.serialNo));
  }, [processes]);

  function handleDragStart(idx) { dragIdx.current = idx; }
  function handleDragOver(e, idx) { e.preventDefault(); dragOverIdx.current = idx; }
  function handleDrop() {
    const from = dragIdx.current;
    const to   = dragOverIdx.current;
    if (from === null || to === null || from === to) return;
    const newItems = [...items];
    const [moved] = newItems.splice(from, 1);
    newItems.splice(to, 0, moved);
    // reassign serial numbers 1..n
    const reordered = newItems.map((item, i) => ({ ...item, serialNo: i + 1 }));
    setItems(reordered);
    dragIdx.current = null;
    dragOverIdx.current = null;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updates = items.map((p) => ({ processId: p._id, serialNo: p.serialNo }));
      const res  = await fetch(`/api/line-layouts/${layoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder_serial", updates }),
      });
      const json = await res.json();
      if (json.success) { onUpdate(json.data); showToast("success", "Serial সংরক্ষিত হয়েছে!"); }
      else showToast("error", json.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-slate-800 shrink-0">
        <p className="text-sm text-slate-400 font-semibold">
          ☰ Drag করে serial সাজান
        </p>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-[#0f1117] font-bold rounded-lg text-sm transition-all">
          {saving ? "সেভ হচ্ছে…" : "✓ সেভ"}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((p, idx) => {
          const c = mc(p.machineType);
          return (
            <div key={p._id} draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={handleDrop}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-grab active:cursor-grabbing border select-none transition-all hover:opacity-90"
              style={{ background: c.bg, borderColor: c.border }}>
              <span className="text-slate-500 text-base mr-1">⣿</span>
              <span className="text-sm font-black px-2 py-0.5 rounded shrink-0"
                style={{ background: c.badge, color: "#fff" }}>
                {p.serialNo}
              </span>
              <span className="text-sm flex-1 leading-tight font-medium" style={{ color: c.text }}>
                {p.processName.substring(0, 32)}{p.processName.length > 32 ? "…" : ""}
              </span>
              <span className="text-xs shrink-0 opacity-60" style={{ color: c.text }}>
                {p.machineType?.split(" ").slice(0, 2).join(" ")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LineLayoutPage() {
  const [view, setView]               = useState("list");
  const [filterFloor, setFilterFloor] = useState("");
  const [filterLine,  setFilterLine]  = useState("");
  const [layouts, setLayouts]         = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [currentLayout, setCurrentLayout] = useState(null);

  const [form, setForm] = useState({
    floor:"", lineNo:"", buyer:"", style:"", item:"",
    smv:"", planEfficiency:"", operator:"", helper:"",
    seamSealing:"", workingHours:8,
  });
  const [sketchFile, setSketchFile]       = useState(null);
  const [sketchPreview, setSketchPreview] = useState("");
  const [uploading, setUploading]         = useState(false);
  const [saving, setSaving]               = useState(false);
  const fileRef = useRef();

  const [pForm, setPForm]             = useState({ serialNo:1, processName:"", machineType:"" });
  const [showPicker, setShowPicker]   = useState(false);
  const [addingProcess, setAddingProcess] = useState(false);

  const [builderTab, setBuilderTab] = useState("process");
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm]     = useState({
    buyer:"", style:"", item:"", smv:"", planEfficiency:"",
    operator:"", helper:"", seamSealing:"", workingHours:8,
  });

  const [toast, setToast] = useState(null);
  function showToast(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); }

  const manpower = (parseInt(form.operator)||0)+(parseInt(form.helper)||0)+(parseInt(form.seamSealing)||0);
  const { oneHourTarget, dailyTarget } = calcTargets(form.smv, form.planEfficiency, form.operator, form.workingHours);

  const loadLayouts = useCallback(async () => {
    setListLoading(true);
    try {
      const p = new URLSearchParams();
      if (filterFloor) p.set("floor", filterFloor);
      if (filterLine)  p.set("lineNo", filterLine);
      const res  = await fetch(`/api/line-layouts?${p}`);
      const json = await res.json();
      setLayouts(json.success ? (json.data || []) : []);
    } finally { setListLoading(false); }
  }, [filterFloor, filterLine]);

  useEffect(() => { if (view === "list") loadLayouts(); }, [view, filterFloor, filterLine]);

  function prefillEditForm(l) {
    setEditForm({
      buyer: l.buyer??"", style: l.style??"", item: l.item??"",
      smv: l.smv??"", planEfficiency: l.planEfficiency??"",
      operator: l.operator??"", helper: l.helper??"",
      seamSealing: l.seamSealing??"", workingHours: l.workingHours??8,
    });
  }

  async function handleSketchChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setSketchFile(file);
    setSketchPreview(URL.createObjectURL(file));
  }

  async function uploadSketch(file) {
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/upload", { method:"POST", body:fd });
    const json = await res.json();
    return json.success ? json.url : "";
  }

  async function handleCreateLayout(e) {
    e.preventDefault();
    if (!form.floor || !form.lineNo || !form.buyer) { showToast("error","Floor, Line No এবং Buyer আবশ্যক।"); return; }
    setSaving(true);
    try {
      let sketchUrl = "";
      if (sketchFile) { setUploading(true); sketchUrl = await uploadSketch(sketchFile); setUploading(false); }
      const res  = await fetch("/api/line-layouts", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...form, manpower, oneHourTarget, dailyTarget, sketchUrl }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success","Layout তৈরি হয়েছে!");
        setCurrentLayout(json.data); prefillEditForm(json.data);
        setBuilderTab("process"); setView("builder");
      } else showToast("error", json.message);
    } finally { setSaving(false); }
  }

  function openPicker() {
    if (!pForm.processName || !pForm.machineType) { showToast("error","Process Name ও Machine Type select করুন।"); return; }
    if (pForm.machineType === "HELPER") { handleAddProcess([]); return; }
    setShowPicker(true);
  }

  async function handleAddProcess(machinesSelected) {
    setShowPicker(false);
    if (!currentLayout) return;
    setAddingProcess(true);
    try {
      const res  = await fetch(`/api/line-layouts/${currentLayout._id}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ action:"add_process", serialNo:pForm.serialNo, processName:pForm.processName, machineType:pForm.machineType, machinesSelected }),
      });
      const json = await res.json();
      if (json.success) {
        setCurrentLayout(json.data);
        showToast("success","Process যোগ হয়েছে!");
        setPForm((p) => ({ ...p, serialNo: p.serialNo+1, processName:"", machineType:"" }));
      } else showToast("error", json.message);
    } finally { setAddingProcess(false); }
  }

  async function handleWasteProcess(processId, wasteFloor) {
    if (!currentLayout) return;
    const res  = await fetch(`/api/line-layouts/${currentLayout._id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"remove_process", processId, wasteFloor }),
    });
    const json = await res.json();
    if (json.success) { setCurrentLayout(json.data); showToast("success","Process waste হয়েছে।"); }
    else showToast("error", json.message);
  }

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0f1117]">
      <div style={{ transform:"scale(0.67)", transformOrigin:"top left", width:"149.25vw", height:"149.25vh" }}
        className="flex flex-col font-mono text-white">

        <Toast toast={toast} />
        {showPicker && (
          <MachineFloorPicker machineType={pForm.machineType}
            onConfirm={handleAddProcess} onCancel={() => setShowPicker(false)} />
        )}

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-cyan-400 rounded-full" />
            <div>
              <p className="text-xs tracking-[0.3em] text-cyan-400 uppercase">IE Department</p>
              <h1 className="text-2xl font-bold tracking-tight leading-tight">Line Layout</h1>
            </div>
          </div>
          <div className="flex gap-2">
            {view !== "list" && (
              <button onClick={() => setView("list")}
                className="px-4 py-2 border border-slate-700 hover:border-slate-500 text-slate-400 rounded-xl text-sm transition-all">
                ← সব Layouts
              </button>
            )}
            {view === "list" && (
              <button onClick={() => { setView("form"); setForm({floor:"",lineNo:"",buyer:"",style:"",item:"",smv:"",planEfficiency:"",operator:"",helper:"",seamSealing:"",workingHours:8}); setSketchPreview(""); }}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#0f1117] font-bold rounded-xl text-sm transition-all">
                + নতুন Layout
              </button>
            )}
            {view === "builder" && (
              <button onClick={() => { setView("list"); loadLayouts(); }}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all">
                ✓ সম্পন্ন
              </button>
            )}
          </div>
        </div>

        {/* ══ LIST VIEW ════════════════════════════════════════════════════════ */}
        {view === "list" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-wrap gap-3 mb-5">
              <select value={filterFloor} onChange={(e) => setFilterFloor(e.target.value)}
                className="bg-[#161b27] border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500">
                <option value="">সব Floor</option>
                {FLOOR_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={filterLine} onChange={(e) => setFilterLine(e.target.value)}
                className="bg-[#161b27] border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500">
                <option value="">সব Line</option>
                {LINE_OPTIONS.map((l) => <option key={l} value={l}>Line {l}</option>)}
              </select>
            </div>

            {listLoading ? (
              <p className="text-slate-500 text-base animate-pulse text-center py-20">লোড হচ্ছে...</p>
            ) : layouts.length === 0 ? (
              <div className="text-center py-20 text-slate-600">
                <p className="text-5xl mb-3">📐</p>
                <p className="text-base">কোনো Layout নেই। নতুন তৈরি করুন।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {layouts.map((l) => (
                  <div key={l._id} className="bg-[#161b27] border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-all">
                    <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-sm text-cyan-400 font-semibold">{l.floor} · Line {l.lineNo}</span>
                          <h3 className="font-bold text-white text-lg">{l.buyer}</h3>
                          <p className="text-slate-400 text-sm">{l.style} — {l.item}</p>
                        </div>
                        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">
                          {l.processes?.length || 0} process
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        {[
                          { label:"SMV",        val: l.smv },
                          { label:"Efficiency", val: `${l.planEfficiency}%` },
                          { label:"Manpower",   val: l.manpower },
                          { label:"1Hr Target", val: l.oneHourTarget },
                          { label:`Daily (${l.workingHours}h)`, val: l.dailyTarget },
                          { label:"Op/Hel/SS",  val: `${l.operator}/${l.helper}/${l.seamSealing}` },
                        ].map(({ label, val }) => (
                          <div key={label} className="bg-[#0f1117] rounded-lg px-2 py-2">
                            <div className="text-[10px] text-slate-500 uppercase">{label}</div>
                            <div className="text-sm font-bold text-white">{val}</div>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => { setCurrentLayout(l); prefillEditForm(l); setBuilderTab("process"); setView("builder"); }}
                        className="w-full py-2.5 bg-cyan-500/10 border border-cyan-800 hover:bg-cyan-500/20 text-cyan-400 rounded-xl text-sm font-semibold transition-all">
                        Builder খুলুন →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ FORM VIEW ════════════════════════════════════════════════════════ */}
        {view === "form" && (
          <div className="flex-1 overflow-y-auto p-6 flex justify-center">
            <form onSubmit={handleCreateLayout} className="w-full max-w-2xl">
              <div className="bg-[#161b27] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />
                <div className="p-8 space-y-5">
                  <h2 className="text-xl font-bold text-white mb-1">নতুন Line Layout তৈরি করুন</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Floor *"><Select value={form.floor} onChange={(v) => setForm((p) => ({...p,floor:v}))} options={FLOOR_OPTIONS} placeholder="— Floor —" /></Field>
                    <Field label="Line No *"><Select value={form.lineNo} onChange={(v) => setForm((p) => ({...p,lineNo:v}))} options={LINE_OPTIONS} placeholder="— Line —" renderOption={(o) => `Line ${o}`} /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Buyer *"><Select value={form.buyer} onChange={(v) => setForm((p) => ({...p,buyer:v}))} options={BUYER_OPTIONS} placeholder="— Buyer —" /></Field>
                    <Field label="Style"><Input value={form.style} onChange={(v) => setForm((p) => ({...p,style:v}))} placeholder="121058" /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Item"><Input value={form.item} onChange={(v) => setForm((p) => ({...p,item:v}))} placeholder="Rain Jacket" /></Field>
                    <Field label="SMV"><Input type="number" value={form.smv} onChange={(v) => setForm((p) => ({...p,smv:v}))} placeholder="43.2" /></Field>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Plan Efficiency (%)"><Input type="number" value={form.planEfficiency} onChange={(v) => setForm((p) => ({...p,planEfficiency:v}))} placeholder="70" /></Field>
                    <Field label="Working Hours">
                      <select value={form.workingHours} onChange={(e) => setForm((p) => ({...p,workingHours:+e.target.value}))}
                        className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-cyan-500 appearance-none">
                        {HOURS_OPTIONS.map((h) => <option key={h} value={h}>{h} ঘণ্টা</option>)}
                      </select>
                    </Field>
                    <Field label="Manpower (auto)">
                      <div className="w-full bg-[#0a0d14] border border-slate-700 text-cyan-300 rounded-lg px-3 py-3 text-sm font-bold flex justify-between">
                        <span>{manpower}</span><span className="text-slate-600 text-xs">auto</span>
                      </div>
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[["Operator","operator"],["Helper","helper"],["Seam Sealing","seamSealing"]].map(([label,key]) => (
                      <Field key={key} label={label}><Input type="number" value={form[key]} onChange={(v) => setForm((p) => ({...p,[key]:v}))} placeholder="0" /></Field>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="1 Hour Target (auto)">
                      <div className="w-full bg-[#0a0d14] border border-emerald-900 text-emerald-300 rounded-lg px-3 py-3 text-base font-bold">{oneHourTarget}</div>
                    </Field>
                    <Field label={`Total Daily Target (${form.workingHours}h, auto)`}>
                      <div className="w-full bg-[#0a0d14] border border-violet-900 text-violet-300 rounded-lg px-3 py-3 text-base font-bold">{dailyTarget}</div>
                    </Field>
                  </div>
                  <Field label="Line Sketch / Image (optional)">
                    <div onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-cyan-600 rounded-xl p-5 cursor-pointer transition-all text-center">
                      {sketchPreview ? <img src={sketchPreview} alt="sketch" className="max-h-36 mx-auto rounded-lg object-contain" />
                        : <p className="text-slate-500 text-sm">ক্লিক করে image select করুন</p>}
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSketchChange} />
                    </div>
                  </Field>
                </div>
                <div className="px-8 pb-8 flex gap-3">
                  <button type="submit" disabled={saving||uploading}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#0f1117] font-bold py-3.5 rounded-xl text-base tracking-widest uppercase transition-all shadow-lg shadow-cyan-500/20">
                    {uploading ? "Image আপলোড হচ্ছে..." : saving ? "তৈরি হচ্ছে..." : "Layout তৈরি করুন →"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ══ BUILDER VIEW ═════════════════════════════════════════════════════ */}
        {view === "builder" && currentLayout && (
          <div className="flex flex-1 overflow-hidden">

            {/* LEFT panel */}
            <div className="w-[420px] shrink-0 border-r border-slate-800 flex flex-col">

              {/* Tab Bar */}
              <div className="flex border-b border-slate-800 shrink-0">
                {[
                  { key:"edit",    label:"✏️ Edit" },
                  { key:"process", label:"＋ Process" },
                  { key:"drag",    label:"↕ Serial" },
                  { key:"list",    label:"☰ List" },
                ].map((t) => (
                  <button key={t.key} onClick={() => setBuilderTab(t.key)}
                    className={`flex-1 py-3 text-xs font-semibold transition-all border-b-2
                      ${builderTab === t.key ? "border-cyan-400 text-cyan-400 bg-[#161b27]" : "border-transparent text-slate-500 hover:text-slate-300 bg-[#0f1117]"}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── TAB: EDIT HEADER ── */}
              {builderTab === "edit" && (
                <div className="flex-1 overflow-y-auto">
                  <div className="bg-[#161b27] border-b border-slate-800 px-4 py-3">
                    <span className="text-sm text-cyan-400 font-bold">{currentLayout.floor} · Line {currentLayout.lineNo}</span>
                    <div className="grid grid-cols-3 gap-1.5 text-center mt-2">
                      {[
                        { l:"1Hr Tgt", v: currentLayout.oneHourTarget },
                        { l:`Daily(${currentLayout.workingHours}h)`, v: currentLayout.dailyTarget },
                        { l:"Manpower", v: currentLayout.manpower },
                      ].map(({ l, v }) => (
                        <div key={l} className="bg-[#0f1117] rounded-lg px-2 py-1.5">
                          <div className="text-[10px] text-slate-500">{l}</div>
                          <div className="text-sm font-bold text-emerald-300">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <form onSubmit={async (e) => {
                    e.preventDefault(); setEditSaving(true);
                    try {
                      const res  = await fetch(`/api/line-layouts/${currentLayout._id}`, {
                        method:"PATCH", headers:{"Content-Type":"application/json"},
                        body: JSON.stringify({ action:"update_header", ...editForm }),
                      });
                      const json = await res.json();
                      if (json.success) { setCurrentLayout(json.data); showToast("success","Header আপডেট হয়েছে!"); }
                      else showToast("error", json.message);
                    } finally { setEditSaving(false); }
                  }} className="p-4 space-y-4">
                    <p className="text-xs text-amber-400 uppercase tracking-widest font-semibold">Style পরিবর্তন করুন</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Buyer"><Select value={editForm.buyer} onChange={(v) => setEditForm((p) => ({...p,buyer:v}))} options={BUYER_OPTIONS} placeholder="— Buyer —" /></Field>
                      <Field label="Style"><Input value={editForm.style} onChange={(v) => setEditForm((p) => ({...p,style:v}))} placeholder="Style No" /></Field>
                    </div>
                    <Field label="Item"><Input value={editForm.item} onChange={(v) => setEditForm((p) => ({...p,item:v}))} placeholder="Item Name" /></Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="SMV"><Input type="number" value={editForm.smv} onChange={(v) => setEditForm((p) => ({...p,smv:v}))} placeholder="43.2" /></Field>
                      <Field label="Plan Efficiency (%)"><Input type="number" value={editForm.planEfficiency} onChange={(v) => setEditForm((p) => ({...p,planEfficiency:v}))} placeholder="70" /></Field>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Operator"><Input type="number" value={editForm.operator} onChange={(v) => setEditForm((p) => ({...p,operator:v}))} placeholder="0" /></Field>
                      <Field label="Helper"><Input type="number" value={editForm.helper} onChange={(v) => setEditForm((p) => ({...p,helper:v}))} placeholder="0" /></Field>
                      <Field label="Seam Sealing"><Input type="number" value={editForm.seamSealing} onChange={(v) => setEditForm((p) => ({...p,seamSealing:v}))} placeholder="0" /></Field>
                    </div>
                    <Field label="Working Hours">
                      <select value={editForm.workingHours} onChange={(e) => setEditForm((p) => ({...p,workingHours:+e.target.value}))}
                        className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-amber-500 appearance-none">
                        {HOURS_OPTIONS.map((h) => <option key={h} value={h}>{h} ঘণ্টা</option>)}
                      </select>
                    </Field>
                    {(() => {
                      const { oneHourTarget: oht, dailyTarget: dt } = calcTargets(editForm.smv, editForm.planEfficiency, editForm.operator, editForm.workingHours);
                      const mp = (parseInt(editForm.operator)||0)+(parseInt(editForm.helper)||0)+(parseInt(editForm.seamSealing)||0);
                      return (
                        <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-3">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">নতুন Target Preview</p>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            {[
                              { l:"Manpower",   v:mp,  c:"text-cyan-300"    },
                              { l:"1Hr Target", v:oht, c:"text-emerald-300" },
                              { l:`Daily(${editForm.workingHours}h)`, v:dt, c:"text-violet-300" },
                            ].map(({ l,v,c }) => (
                              <div key={l} className="bg-[#161b27] rounded-lg px-2 py-1.5">
                                <div className="text-[10px] text-slate-600">{l}</div>
                                <div className={`text-base font-bold ${c}`}>{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    <button type="submit" disabled={editSaving}
                      className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#0f1117] font-bold py-3 rounded-xl text-sm tracking-widest uppercase transition-all">
                      {editSaving ? "আপডেট হচ্ছে..." : "✓ Header আপডেট করুন"}
                    </button>
                  </form>
                </div>
              )}

              {/* ── TAB: ADD PROCESS ── */}
              {builderTab === "process" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Process যোগ করুন</p>
                  <Field label="Serial No">
                    <select value={pForm.serialNo} onChange={(e) => setPForm((p) => ({...p,serialNo:+e.target.value}))}
                      className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-cyan-500 appearance-none">
                      {SERIAL_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>
                  <Field label="Process Name">
                    <select value={pForm.processName} onChange={(e) => setPForm((p) => ({...p,processName:e.target.value}))}
                      className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-cyan-500 appearance-none">
                      <option value="">— Process select করুন —</option>
                      {PROCESS_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>
                  <Field label="Machine Type">
                    <select value={pForm.machineType} onChange={(e) => setPForm((p) => ({...p,machineType:e.target.value}))}
                      className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-cyan-500 appearance-none">
                      <option value="">— Machine Type —</option>
                      {MACHINE_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                  {pForm.machineType && (() => {
                    const c = mc(pForm.machineType);
                    return (
                      <div className="rounded-xl px-4 py-2.5 border text-sm font-medium"
                        style={{ background: c.bg, borderColor: c.border, color: c.text }}>
                        {pForm.machineType}
                      </div>
                    );
                  })()}
                  <button onClick={openPicker}
                    disabled={addingProcess || !pForm.processName || !pForm.machineType}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#0f1117] font-bold py-3 rounded-xl text-sm tracking-wider uppercase transition-all">
                    {addingProcess ? "যোগ হচ্ছে..." : pForm.machineType === "HELPER" ? "+ HELPER যোগ করুন" : "+ Machine select করে যোগ করুন"}
                  </button>
                </div>
              )}

              {/* ── TAB: DRAG SERIAL ── */}
              {builderTab === "drag" && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <DragSerialList
                    processes={currentLayout.processes || []}
                    layoutId={currentLayout._id}
                    onUpdate={(data) => setCurrentLayout(data)}
                    showToast={showToast}
                  />
                </div>
              )}

              {/* ── TAB: PROCESS LIST ── */}
              {builderTab === "list" && (
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">
                    Added Processes ({currentLayout.processes?.length || 0})
                  </p>
                  {(currentLayout.processes?.length || 0) === 0 ? (
                    <p className="text-slate-700 text-sm text-center py-10">কোনো process নেই।</p>
                  ) : (
                    <div className="space-y-2">
                      {[...currentLayout.processes].sort((a,b)=>a.serialNo-b.serialNo).map((p) => {
                        const c = mc(p.machineType);
                        return (
                          <div key={p._id} className="rounded-xl px-4 py-3 border"
                            style={{ background: c.bg, borderColor: c.border }}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <span className="text-xs font-black mr-2 px-2 py-0.5 rounded" style={{ background:c.badge, color:"#fff" }}>#{p.serialNo}</span>
                                <span className="text-sm font-semibold" style={{ color: c.text }}>
                                  {p.processName.substring(0,35)}{p.processName.length>35?"…":""}
                                </span>
                                <div className="text-xs text-slate-500 mt-1">
                                  {p.machineType} · {p.machines?.map((m) => m.fromFloor).join(", ") || "No machine"}
                                </div>
                              </div>
                              <button onClick={() => handleWasteProcess(p._id, currentLayout.floor)}
                                className="ml-2 px-3 py-1 rounded-lg text-xs font-bold text-red-300 border border-red-900 hover:bg-red-900/40 transition-all shrink-0">
                                ✕ Waste
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT — Layout Grid */}
            <div className="flex-1 overflow-hidden flex flex-col bg-[#0d1117]">
              {/* Info bar */}
              <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 uppercase tracking-widest">Layout</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-sm text-slate-300 font-semibold">{currentLayout.style} — {currentLayout.item}</span>
                </div>
                <div className="flex gap-2 text-xs">
                  {[
                    { l:"Buyer",  v: currentLayout.buyer,         c:"text-cyan-400"    },
                    { l:"1Hr",    v: currentLayout.oneHourTarget,  c:"text-emerald-400" },
                    { l:"Daily",  v: currentLayout.dailyTarget,    c:"text-violet-400"  },
                    { l:"MP",     v: currentLayout.manpower,       c:"text-amber-400"   },
                  ].map(({ l, v, c }) => (
                    <span key={l} className="bg-[#161b27] px-2.5 py-1 rounded-full">
                      <span className="text-slate-600">{l}: </span>
                      <span className={`font-bold text-sm ${c}`}>{v}</span>
                    </span>
                  ))}
                </div>
              </div>
              <LayoutGrid
                processes={currentLayout.processes || []}
                sketchUrl={currentLayout.sketchUrl}
                layoutFloor={currentLayout.floor}
                onWaste={handleWasteProcess}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Field / Input / Select helpers ──────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  );
}
function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-colors placeholder:text-slate-600" />
  );
}
function Select({ value, onChange, options, placeholder, renderOption }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0f1117] border border-slate-700 text-white rounded-lg px-3 py-3 text-sm appearance-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-colors">
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{renderOption ? renderOption(o) : o}</option>)}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">▾</span>
    </div>
  );
}