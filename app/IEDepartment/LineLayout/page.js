"use client";
// app/IEDepartment/LineLayout/page.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/app/hooks/useAuth";

// ─── Constants ────────────────────────────────────────────────────────────────
const FACTORY_OPTIONS = ["K-2", "K-3", "K-4", "Others"];
const FLOOR_OPTIONS   = ["A-2","B-2","A-3","B-3","A-4","B-4","A-5","B-5","A-6","B-6","C-4","K-3","SMD/CAD","Others"];
const LINE_OPTIONS    = Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(2, "0"));
const BUYER_OPTIONS   = ["Decathlon - knit","Decathlon - woven","Walmart","Columbia","ZXY","CTC","DIESEL","Sports Group Denmark","Identity","Fifth Avenue","Others"];
const HOURS_OPTIONS   = Array.from({ length: 14 }, (_, i) => i + 1);
const SERIAL_OPTIONS  = Array.from({ length: 60 }, (_, i) => i + 1);

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

const MACHINE_COLORS = {
  "SINGLE NDL (PLAIN M/C)":            { bg:"#dbeafe", accent:"#1d4ed8", text:"#1e3a5f", badge:"#1d4ed8", badgeText:"#fff" },
  "SINGLE NDL (TOP FEED) M/C":         { bg:"#dbeafe", accent:"#1d4ed8", text:"#1e3a5f", badge:"#1d4ed8", badgeText:"#fff" },
  "SINGLE NDL (NDL FEED) M/C":         { bg:"#dbeafe", accent:"#1d4ed8", text:"#1e3a5f", badge:"#1d4ed8", badgeText:"#fff" },
  "SINGLE NDL (CUFFS) M/C":            { bg:"#dbeafe", accent:"#1d4ed8", text:"#1e3a5f", badge:"#1d4ed8", badgeText:"#fff" },
  "DLM SINGLE NEEDLE VERTICAL CUTTER": { bg:"#ede9fe", accent:"#7c3aed", text:"#3b1a6e", badge:"#7c3aed", badgeText:"#fff" },
  "DOUBLE NDL":                         { bg:"#e0e7ff", accent:"#4338ca", text:"#1e1b4b", badge:"#4338ca", badgeText:"#fff" },
  "POCKET WELL (APW) M/C":             { bg:"#d1fae5", accent:"#059669", text:"#064e3b", badge:"#059669", badgeText:"#fff" },
  "3/8 T CHAIN STITCH (3 NDL) M/C":    { bg:"#d1fae5", accent:"#059669", text:"#064e3b", badge:"#059669", badgeText:"#fff" },
  "INTER LOCK (2 NDL 5TH) M/C":        { bg:"#ccfbf1", accent:"#0d9488", text:"#134e4a", badge:"#0d9488", badgeText:"#fff" },
  "OVER LOCK (2 NDL 4TH) M/C":         { bg:"#ccfbf1", accent:"#0d9488", text:"#134e4a", badge:"#0d9488", badgeText:"#fff" },
  "BARTACK M/C":                        { bg:"#fce7f3", accent:"#be185d", text:"#500724", badge:"#be185d", badgeText:"#fff" },
  "KANSAI":                             { bg:"#fae8ff", accent:"#a21caf", text:"#3b0764", badge:"#a21caf", badgeText:"#fff" },
  "EYELET HOLE M/C":                    { bg:"#ffedd5", accent:"#c2410c", text:"#431407", badge:"#c2410c", badgeText:"#fff" },
  "HELPER":                             { bg:"#f1f5f9", accent:"#475569", text:"#334155", badge:"#475569", badgeText:"#fff" },
  "default":                            { bg:"#e0f2fe", accent:"#0369a1", text:"#0c4a6e", badge:"#0369a1", badgeText:"#fff" },
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
      ${toast.type === "success"
        ? "bg-emerald-50 border-emerald-400 text-emerald-800"
        : "bg-red-50 border-red-400 text-red-800"}`}>
      {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
    </div>
  );
}

// ─── Waste Floor Picker ───────────────────────────────────────────────────────
function WasteFloorPicker({ processEntry, layoutFloor, onConfirm, onCancel }) {
  const [wasteFloor, setWasteFloor] = useState(layoutFloor || FLOOR_OPTIONS[0]);
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-red-500 to-orange-400 rounded-t-2xl" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🚫</span>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Machine Waste করুন</h3>
              <p className="text-slate-500 text-base">#{processEntry.serialNo} — {processEntry.processName?.substring(0,40)}</p>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-slate-500 uppercase tracking-widest mb-2 font-semibold">কোন Floor এ পাঠাবেন?</label>
            <select value={wasteFloor} onChange={(e) => setWasteFloor(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-red-400">
              {FLOOR_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          {(processEntry.machines || []).length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-sm text-slate-400 uppercase tracking-widest font-semibold">Machines</p>
              {(processEntry.machines || []).map((m, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <span className="text-base text-slate-700 flex-1">{m.machineName}</span>
                  <span className="text-sm text-amber-600">{m.fromFloor} →</span>
                  <span className="text-sm text-red-600 font-bold">{wasteFloor}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mb-5">
            এই process টি সরানো হবে এবং machine গুলো <strong className="text-red-600">{wasteFloor}</strong> floor এ idle হবে।
          </p>
          <div className="flex gap-3">
            <button onClick={() => onConfirm(wasteFloor)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-base transition-all">
              🚫 Waste করুন
            </button>
            <button onClick={onCancel}
              className="px-6 border border-slate-300 hover:border-slate-400 text-slate-600 rounded-xl text-base transition-all">
              বাতিল
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Machine Floor Picker Modal ───────────────────────────────────────────────
function MachineFloorPicker({ machineType, factory = "", onConfirm, onCancel }) {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const url  = factory ? `/api/machines?factory=${encodeURIComponent(factory)}` : "/api/machines";
        const res  = await fetch(url);
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-xl shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-violet-500 rounded-t-2xl" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800 text-lg">Machine ও Floor select করুন</h3>
            <span className="text-sm text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full font-medium">{machineType}</span>
          </div>
          {loading ? (
            <p className="text-slate-400 text-base animate-pulse py-8 text-center">লোড হচ্ছে...</p>
          ) : machines.length === 0 ? (
            <p className="text-slate-400 text-base py-8 text-center">কোনো machine পাওয়া যায়নি।</p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
              {machines.map((m) => (
                <div key={m._id}>
                  <p className="text-base text-slate-600 mb-2 font-medium">{m.machineName}</p>
                  <div className="flex flex-wrap gap-2">
                    {(m.floors || []).map((f) => {
                      const sel = isSel(m._id, f.floorName);
                      const hasIdle = f.idle > 0;
                      return (
                        <button key={f.floorName} disabled={!hasIdle}
                          onClick={() => toggleFloor(m._id, m.machineName, f.floorName)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all
                            ${sel ? "bg-blue-600 border-blue-500 text-white"
                              : hasIdle ? "bg-white border-slate-300 text-slate-700 hover:border-blue-400"
                              : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"}`}>
                          {f.floorName}
                          <span className={`ml-2 text-xs ${hasIdle ? "text-amber-600" : "text-slate-400"}`}>
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl text-base transition-all">
              {selected.length > 0 ? `${selected.length}টি machine যোগ করুন` : "কোনো machine select করুনি"}
            </button>
            <button onClick={onCancel}
              className="px-6 border border-slate-300 hover:border-slate-400 text-slate-600 rounded-xl text-base transition-all">
              বাতিল
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Excel-Style Layout Grid (drag-to-swap + drop-into-empty-slot) ────────────
function LayoutGrid({ processes, sketchUrl, onWaste, onSwapSerial, onMoveToSlot, layoutFloor, layoutInfo }) {
  const [wasteTarget, setWasteTarget] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null); // "id:<_id>" or "slot:<serialNo>"
  const dragId = useRef(null); // _id of process being dragged

  const sorted = [...processes].sort((a, b) => a.serialNo - b.serialNo);

  // Build a map: serialNo → array of process entries (supports multiple per serial)
  const bySerial = {};
  sorted.forEach((p) => {
    if (!bySerial[p.serialNo]) bySerial[p.serialNo] = [];
    bySerial[p.serialNo].push(p);
  });

  // Determine full range of slots to render (1 → maxSerial, filling ALL gaps)
  const maxSerial = sorted.length > 0 ? sorted[sorted.length - 1].serialNo : 0;
  // Build slot list: every integer from 1 to maxSerial
  const allSlots = [];
  for (let sn = 1; sn <= maxSerial; sn++) allSlots.push(sn);

  // Pair slots into rows: odd serial = LEFT, even serial = RIGHT
  const rowMap = new Map();
  allSlots.forEach((sn) => {
    const rowIdx = Math.ceil(sn / 2) - 1;
    if (!rowMap.has(rowIdx)) rowMap.set(rowIdx, { left: null, right: null });
    if (sn % 2 !== 0) rowMap.get(rowIdx).left  = sn;
    else               rowMap.get(rowIdx).right = sn;
  });
  const rows = Array.from(rowMap.entries()).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

  const summary = {};
  sorted.forEach((p) => {
    const key = p.machineType || "?";
    summary[key] = (summary[key] || 0) + (p.machines?.length || 1);
  });

  // ── Drag handlers ────────────────────────────────────────────────────────
  function handleDragStart(e, id) {
    dragId.current = id;
    e.dataTransfer.effectAllowed = "move";
  }
  function handleDragOverCell(e, key) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverKey(key);
  }
  function handleDragLeave(e) {
    // Only clear if leaving the cell entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOverKey(null);
  }
  function handleDropOnProcess(e, targetId) {
    e.preventDefault();
    setDragOverKey(null);
    const fromId = dragId.current;
    dragId.current = null;
    if (!fromId || fromId === targetId) return;
    const fromProc = processes.find((p) => p._id === fromId);
    const toProc   = processes.find((p) => p._id === targetId);
    if (fromProc && toProc) onSwapSerial(fromId, fromProc.serialNo, targetId, toProc.serialNo);
  }
  function handleDropOnSlot(e, slotSerial) {
    e.preventDefault();
    setDragOverKey(null);
    const fromId = dragId.current;
    dragId.current = null;
    if (!fromId) return;
    const fromProc = processes.find((p) => p._id === fromId);
    if (!fromProc || fromProc.serialNo === slotSerial) return;
    // Move process into empty slot — change its serial to slotSerial
    onMoveToSlot(fromId, slotSerial);
  }
  function handleDragEnd() { setDragOverKey(null); dragId.current = null; }

  // ── Filled Process Cell ───────────────────────────────────────────────────
  function ProcessCell({ entry }) {
    const c      = mc(entry.machineType);
    const key    = `id:${entry._id}`;
    const isOver = dragOverKey === key;

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, entry._id)}
        onDragOver={(e)  => handleDragOverCell(e, key)}
        onDragLeave={handleDragLeave}
        onDrop={(e)      => handleDropOnProcess(e, entry._id)}
        onDragEnd={handleDragEnd}
        className="group relative cursor-grab active:cursor-grabbing"
        style={{
          background:   isOver ? "#dbeafe" : c.bg,
          borderLeft:   `5px solid ${isOver ? "#1d4ed8" : c.accent}`,
          borderTop:    isOver ? "2px solid #1d4ed8" : "1px solid rgba(0,0,0,0.08)",
          borderRight:  "1px solid rgba(0,0,0,0.08)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 4,
          marginBottom: 3,
          opacity: dragId.current === entry._id ? 0.4 : 1,
          transition: "border-color 0.1s, background 0.1s",
        }}>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-300 text-xs select-none opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">⣿</span>
        <button
          onClick={(e) => { e.stopPropagation(); setWasteTarget(entry); }}
          title="Waste"
          className="absolute top-1 right-1 w-6 h-6 rounded-full hidden group-hover:flex items-center justify-center text-xs font-black bg-red-100 hover:bg-red-500 text-red-600 hover:text-white transition-all z-10 shadow">
          ✕
        </button>
        <div className="px-4 py-2">
          <div className="flex items-start gap-2 mb-1.5">
            <span className="text-xs font-black px-2 py-0.5 rounded shrink-0"
              style={{ background: isOver ? "#1d4ed8" : c.badge, color: c.badgeText }}>
              {entry.serialNo}
            </span>
            {entry.machineType !== "HELPER" && (entry.machines || []).map((m, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded font-bold shrink-0"
                style={{ background: c.accent, color: "#fff", opacity: 0.9 }}>
                {m.fromFloor}
              </span>
            ))}
          </div>
          <p className="text-sm font-semibold leading-snug mb-1.5" style={{ color: isOver ? "#1e3a5f" : c.text }}>
            {entry.processName}
          </p>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: isOver ? "#1d4ed8" : c.accent }}>
            {entry.machineType}
          </p>
        </div>
      </div>
    );
  }

  // ── Empty droppable slot ──────────────────────────────────────────────────
  function EmptySlot({ serialNo }) {
    const key    = `slot:${serialNo}`;
    const isOver = dragOverKey === key;
    return (
      <div
        onDragOver={(e)  => handleDragOverCell(e, key)}
        onDragLeave={handleDragLeave}
        onDrop={(e)      => handleDropOnSlot(e, serialNo)}
        style={{
          minHeight: 54,
          borderRadius: 4,
          marginBottom: 3,
          border: isOver ? "2px dashed #1d4ed8" : "2px dashed #cbd5e1",
          background: isOver ? "#eff6ff" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.1s, background 0.1s",
        }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: isOver ? "#1d4ed8" : "#94a3b8",
          letterSpacing: "0.05em",
        }}>
          {isOver ? `▼ serial ${serialNo} এ রাখুন` : `# ${serialNo} — খালি`}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-white relative">
      {wasteTarget && (
        <WasteFloorPicker
          processEntry={wasteTarget}
          layoutFloor={layoutFloor}
          onConfirm={(floor) => { onWaste(wasteTarget._id, floor); setWasteTarget(null); }}
          onCancel={() => setWasteTarget(null)}
        />
      )}

      {/* sticky header info bar */}
      {layoutInfo && (
        <div className="sticky top-0 z-20 bg-[#f0f4f8] border-b-2 border-slate-300">
          <div className="text-center py-2 border-b border-slate-300 flex items-center justify-center gap-3">
            <span className="text-sm font-black uppercase tracking-widest text-slate-700">MACHINE LAYOUT</span>
            <span className="text-xs text-slate-400 font-normal normal-case tracking-normal">· drag করে serial swap বা খালি slot এ রাখুন</span>
          </div>
          <div className="flex items-stretch divide-x divide-slate-300">
            <div className="flex-1 grid grid-cols-3 divide-x divide-slate-300 text-sm">
              {[
                { label: "Unit / Floor", value: `${layoutInfo.floor} · Line ${layoutInfo.lineNo}` },
                { label: "Buyer",        value: layoutInfo.buyer },
                { label: "Style",        value: layoutInfo.style },
                { label: "Item",         value: layoutInfo.item },
                { label: "SMV",          value: layoutInfo.smv },
                { label: "Plan Eff.",    value: `${layoutInfo.planEfficiency}%` },
                { label: "Op + Hel + SS",value: `${layoutInfo.operator}+${layoutInfo.helper}+${layoutInfo.seamSealing}` },
                { label: "Manpower",     value: layoutInfo.manpower },
                { label: "Working Hrs",  value: `${layoutInfo.workingHours}h` },
                { label: "1 Hour Tgt",   value: layoutInfo.oneHourTarget },
                { label: `Daily Tgt (${layoutInfo.workingHours}h)`, value: layoutInfo.dailyTarget },
                { label: "Processes",    value: processes.length },
              ].map(({ label, value }) => (
                <div key={label} className="px-3 py-2 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">{label}:</span>
                  <span className="font-bold text-slate-800 ml-2">{value ?? "—"}</span>
                </div>
              ))}
            </div>
            {sketchUrl && (
              <div className="shrink-0 w-40 flex items-center justify-center bg-white p-2">
                <img src={sketchUrl} alt="Line Sketch"
                  className="max-h-28 max-w-full object-contain rounded shadow-sm border border-slate-200" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Machine type legend */}
      {Object.keys(summary).length > 0 && (
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-2">
          {Object.entries(summary).map(([type, count]) => {
            const c = mc(type);
            return (
              <span key={type} className="text-xs font-bold px-2.5 py-1.5 rounded border"
                style={{ background: c.bg, borderColor: c.accent, color: c.text }}>
                {type}: <strong style={{ color: c.accent }}>{count}</strong>
              </span>
            );
          })}
        </div>
      )}

      {/* Main grid */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-2">
          <span className="text-4xl">📋</span>
          <p className="text-base">Process যোগ করলে এখানে layout দেখাবে</p>
        </div>
      ) : (
        <table className="w-full border-collapse relative z-10" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "50%" }} />
            <col style={{ width: "50%" }} />
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="text-center text-sm font-black py-3 px-3 border-2 border-slate-400 bg-[#1d4ed8] text-white tracking-widest uppercase">
                ← LEFT SIDE
              </th>
              <th className="text-center text-sm font-black py-3 px-3 border-2 border-slate-400 bg-[#1e3a5f] text-white tracking-widest uppercase">
                RIGHT SIDE →
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ left: leftSn, right: rightSn }, rowIdx) => {
              const bandBg = rowIdx % 2 === 0 ? "#ffffff" : "#f8fafc";
              return (
                <tr key={rowIdx}>
                  <td className="border border-slate-200 p-2 align-top" style={{ background: bandBg }}>
                    {leftSn != null && (
                      bySerial[leftSn]
                        ? bySerial[leftSn].map((e) => <ProcessCell key={e._id} entry={e} />)
                        : <EmptySlot serialNo={leftSn} />
                    )}
                  </td>
                  <td className="border border-slate-200 p-2 align-top" style={{ background: bandBg }}>
                    {rightSn != null && (
                      bySerial[rightSn]
                        ? bySerial[rightSn].map((e) => <ProcessCell key={e._id} entry={e} />)
                        : <EmptySlot serialNo={rightSn} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Drag-to-reorder Serial List ──────────────────────────────────────────────
function DragSerialList({ processes, layoutId, onUpdate, showToast }) {
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dragOverI, setDragOverI] = useState(null);
  const dragIdx = useRef(null);

  // Sort by serialNo only — do NOT resequence, gaps are intentional
  useEffect(() => {
    setItems([...processes].sort((a, b) => a.serialNo - b.serialNo));
  }, [processes]);

  function handleDragStart(idx) { dragIdx.current = idx; }
  function handleDragOver(e, idx) { e.preventDefault(); setDragOverI(idx); }
  function handleDragLeave() { setDragOverI(null); }
  function handleDrop(toIdx) {
    const from = dragIdx.current;
    setDragOverI(null);
    if (from === null || from === toIdx) return;
    const newItems = [...items];
    const [moved] = newItems.splice(from, 1);
    newItems.splice(toIdx, 0, moved);
    // Swap serial numbers of the two items only — keep all others intact
    const fromSerial = items[from].serialNo;
    const toSerial   = items[toIdx].serialNo;
    newItems[toIdx]  = { ...newItems[toIdx],  serialNo: fromSerial };
    // find where the moved item ended up and restore its serial
    const movedNewIdx = newItems.findIndex((x) => x._id === moved._id);
    newItems[movedNewIdx] = { ...newItems[movedNewIdx], serialNo: toSerial };
    setItems([...newItems].sort((a, b) => a.serialNo - b.serialNo));
    dragIdx.current = null;
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
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-slate-200 shrink-0">
        <div>
          <p className="text-base text-slate-600 font-semibold">☰ Drag করে serial swap করুন</p>
          <p className="text-xs text-slate-400 mt-0.5">দুটো item এর serial number পরস্পর swap হবে</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-lg text-sm transition-all">
          {saving ? "সেভ হচ্ছে…" : "✓ সেভ"}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {items.map((p, idx) => {
          const c = mc(p.machineType);
          const isOver = dragOverI === idx;
          return (
            <div key={p._id} draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(idx)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing border select-none transition-all"
              style={{
                background: isOver ? "#dbeafe" : c.bg,
                borderLeft: `4px solid ${isOver ? "#1d4ed8" : c.accent}`,
                borderTop: `${isOver ? "2px solid #1d4ed8" : "1px solid rgba(0,0,0,0.08)"}`,
                borderRight: `1px solid rgba(0,0,0,0.08)`,
                borderBottom: `1px solid rgba(0,0,0,0.08)`,
                boxShadow: isOver ? "0 2px 8px rgba(29,78,216,0.15)" : undefined,
              }}>
              <span className="text-slate-400 text-lg mr-1">⣿</span>
              {/* Show actual serial number */}
              <span className="text-xs font-black px-2 py-0.5 rounded shrink-0"
                style={{ background: c.badge, color: c.badgeText }}>
                {p.serialNo}
              </span>
              <span className="text-sm flex-1 leading-tight font-medium" style={{ color: c.text }}>
                {p.processName.substring(0, 36)}{p.processName.length > 36 ? "…" : ""}
              </span>
              <span className="text-xs shrink-0 font-bold" style={{ color: c.accent }}>
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
  const { auth } = useAuth();
  const userFactory = auth?.factory ?? "";
  const isAdmin     = auth?.role === "Admin" || auth?.role === "IE";

  const [view, setView]               = useState("list");
  const [filterFactory, setFilterFactory] = useState("");
  const effectiveFactory = isAdmin ? (filterFactory || "") : userFactory;
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

  // ── Process edit state ──────────────────────────────────────────────────────
  // editingProcess: { _id, serialNo, processName, machineType, originalMachineType, originalMachines }
  const [editingProcess, setEditingProcess] = useState(null);
  const [procEditSaving, setProcEditSaving] = useState(false);
  const [showEditPicker, setShowEditPicker] = useState(false); // MachineFloorPicker for edit

  const [toast, setToast] = useState(null);
  function showToast(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); }

  const manpower = (parseInt(form.operator)||0)+(parseInt(form.helper)||0)+(parseInt(form.seamSealing)||0);
  const { oneHourTarget, dailyTarget } = calcTargets(form.smv, form.planEfficiency, form.operator, form.workingHours);

  const loadLayouts = useCallback(async () => {
    setListLoading(true);
    try {
      const p = new URLSearchParams();
      if (effectiveFactory) p.set("factory", effectiveFactory);
      if (filterFloor) p.set("floor", filterFloor);
      if (filterLine)  p.set("lineNo", filterLine);
      const res  = await fetch(`/api/line-layouts?${p}`);
      const json = await res.json();
      setLayouts(json.success ? (json.data || []) : []);
    } finally { setListLoading(false); }
  }, [filterFloor, filterLine, effectiveFactory]);

  useEffect(() => { if (view === "list") loadLayouts(); }, [view, filterFloor, filterLine, effectiveFactory]);

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
        body: JSON.stringify({ ...form, factory: effectiveFactory, manpower, oneHourTarget, dailyTarget, sketchUrl }),
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

  // Swap serial numbers of two processes directly (called from LayoutGrid drag)
  async function handleSwapSerial(fromId, fromSerial, toId, toSerial) {
    if (!currentLayout) return;
    // Optimistic update in UI first
    setCurrentLayout((prev) => ({
      ...prev,
      processes: prev.processes.map((p) => {
        if (p._id === fromId) return { ...p, serialNo: toSerial };
        if (p._id === toId)   return { ...p, serialNo: fromSerial };
        return p;
      }),
    }));
    try {
      const res  = await fetch(`/api/line-layouts/${currentLayout._id}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          action: "swap_serial",
          fromId, fromSerial,
          toId,   toSerial,
        }),
      });
      const json = await res.json();
      if (json.success) { setCurrentLayout(json.data); }
      else { showToast("error", json.message); }
    } catch {
      showToast("error", "Serial swap করতে সমস্যা হয়েছে।");
    }
  }

  // Move a process into an empty slot (change its serialNo)
  async function handleMoveToSlot(fromId, newSerial) {
    if (!currentLayout) return;
    // Optimistic UI update
    setCurrentLayout((prev) => ({
      ...prev,
      processes: prev.processes.map((p) =>
        p._id === fromId ? { ...p, serialNo: newSerial } : p
      ),
    }));
    try {
      const res  = await fetch(`/api/line-layouts/${currentLayout._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move_to_slot", processId: fromId, newSerial }),
      });
      const json = await res.json();
      if (json.success) { setCurrentLayout(json.data); }
      else { showToast("error", json.message); }
    } catch {
      showToast("error", "Serial পরিবর্তন করতে সমস্যা হয়েছে।");
    }
  }

  // Called when user clicks "আপডেট করুন" in edit modal
  function handleSaveProcessEdit(e) {
    e.preventDefault();
    if (!editingProcess || !currentLayout) return;
    const machineChanged =
      editingProcess.machineType !== editingProcess.originalMachineType;

    if (machineChanged && editingProcess.machineType !== "HELPER") {
      // Open floor picker for new machine type
      setShowEditPicker(true);
    } else if (machineChanged && editingProcess.machineType === "HELPER") {
      // HELPER needs no floor — just return old machines and save with empty machines
      doSaveProcessEdit([]);
    } else {
      // Serial / processName only — no machine inventory change
      doSaveProcessEdit(null); // null = keep existing machines
    }
  }

  // machinesSelected = array of new machines (or null = keep existing, or [] = clear)
  async function doSaveProcessEdit(machinesSelected) {
    if (!editingProcess || !currentLayout) return;
    setShowEditPicker(false);
    setProcEditSaving(true);
    try {
      const res  = await fetch(`/api/line-layouts/${currentLayout._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:       "edit_process",
          processId:    editingProcess._id,
          serialNo:     Number(editingProcess.serialNo),
          processName:  editingProcess.processName,
          machineType:  editingProcess.machineType,
          // send original machines so API can return them to inventory
          oldMachines:  editingProcess.originalMachines,
          // null = don't touch machines; [] = HELPER; [...] = new assignment
          newMachines:  machinesSelected,
          machineChanged: machinesSelected !== null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCurrentLayout(json.data);
        setEditingProcess(null);
        showToast("success", "Process আপডেট হয়েছে!");
      } else showToast("error", json.message);
    } finally { setProcEditSaving(false); }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    // FIX: outer container uses absolute positioning so scale doesn't clip content
    <div className="w-screen h-screen overflow-hidden bg-slate-100">
      <div
        style={{
          transform: "scale(0.67)",
          transformOrigin: "top left",
          width:  "149.25vw",
          height: "149.25vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        className="font-sans text-slate-800">

        <Toast toast={toast} />
        {showPicker && (
          <MachineFloorPicker machineType={pForm.machineType}
            factory={effectiveFactory}
            onConfirm={handleAddProcess} onCancel={() => setShowPicker(false)} />
        )}

        {showEditPicker && editingProcess && (
          <MachineFloorPicker
            machineType={editingProcess.machineType}
            factory={effectiveFactory}
            onConfirm={(machinesSelected) => doSaveProcessEdit(machinesSelected)}
            onCancel={() => setShowEditPicker(false)}
          />
        )}

        {/* ── Process Edit Modal ── */}
        {editingProcess && !showEditPicker && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-t-2xl" />
              <form onSubmit={handleSaveProcessEdit} className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-800 text-lg">✏️ Process Edit করুন</h3>
                  <button type="button" onClick={() => setEditingProcess(null)}
                    className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
                </div>

                {/* Serial No */}
                <LField label="Serial No">
                  <select value={editingProcess.serialNo}
                    onChange={(e) => setEditingProcess((p) => ({ ...p, serialNo: +e.target.value }))}
                    className="w-full bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-amber-500">
                    {SERIAL_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </LField>

                {/* Process Name */}
                <LField label="Process Name">
                  <select value={editingProcess.processName}
                    onChange={(e) => setEditingProcess((p) => ({ ...p, processName: e.target.value }))}
                    className="w-full bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-amber-500">
                    <option value="">— Process select করুন —</option>
                    {PROCESS_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </LField>

                {/* Machine Type */}
                <LField label="Machine Type">
                  <select value={editingProcess.machineType}
                    onChange={(e) => setEditingProcess((p) => ({ ...p, machineType: e.target.value }))}
                    className="w-full bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-amber-500">
                    <option value="">— Machine Type —</option>
                    {MACHINE_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </LField>

                {editingProcess.machineType && (() => {
                  const c = mc(editingProcess.machineType);
                  return (
                    <div className="rounded-lg px-4 py-2 border-l-4 text-sm font-bold"
                      style={{ background: c.bg, borderLeftColor: c.accent, color: c.text }}>
                      {editingProcess.machineType}
                    </div>
                  );
                })()}

                {editingProcess.machineType !== editingProcess.originalMachineType ? (
                  <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    🔄 Machine type বদলেছে — পুরনো machines inventory তে ফিরে যাবে এবং নতুন floor থেকে নিতে হবে।
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    Machine assignment অপরিবর্তিত। শুধু serial ও process name আপডেট হবে।
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={procEditSaving || !editingProcess.processName || !editingProcess.machineType}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl text-base transition-all">
                    {procEditSaving
                      ? "সেভ হচ্ছে..."
                      : editingProcess.machineType !== editingProcess.originalMachineType && editingProcess.machineType !== "HELPER"
                        ? "✓ পরবর্তী → Floor select করুন"
                        : "✓ আপডেট করুন"}
                  </button>
                  <button type="button" onClick={() => setEditingProcess(null)}
                    className="px-5 border border-slate-300 hover:border-slate-400 text-slate-600 rounded-xl text-base transition-all">
                    বাতিল
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-300 bg-white shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-1.5 bg-blue-600 rounded-full" />
            <div>
              <p className="text-xs tracking-[0.3em] text-blue-600 uppercase font-bold">IE Department</p>
              <h1 className="text-2xl font-black tracking-tight leading-tight text-slate-900">Line Layout</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 uppercase tracking-widest font-bold">Factory</span>
                <select value={filterFactory} onChange={(e) => setFilterFactory(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-700 text-base rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
                  <option value="">সব Factory</option>
                  {FACTORY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            ) : (
              <span className="text-base bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg font-bold">
                🏭 {userFactory || "—"}
              </span>
            )}
            {view !== "list" && (
              <button onClick={() => setView("list")}
                className="px-4 py-2 border border-slate-300 hover:border-slate-400 text-slate-600 rounded-xl text-base font-semibold transition-all bg-white">
                ← সব Layouts
              </button>
            )}
            {view === "list" && (
              <button onClick={() => { setView("form"); setForm({floor:"",lineNo:"",buyer:"",style:"",item:"",smv:"",planEfficiency:"",operator:"",helper:"",seamSealing:"",workingHours:8}); setSketchPreview(""); }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-base transition-all shadow-sm">
                + নতুন Layout
              </button>
            )}
            {view === "builder" && (
              <button onClick={() => { setView("list"); loadLayouts(); }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-base transition-all">
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
                className="bg-white border border-slate-300 text-slate-700 text-base rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
                <option value="">সব Floor</option>
                {FLOOR_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={filterLine} onChange={(e) => setFilterLine(e.target.value)}
                className="bg-white border border-slate-300 text-slate-700 text-base rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
                <option value="">সব Line</option>
                {LINE_OPTIONS.map((l) => <option key={l} value={l}>Line {l}</option>)}
              </select>
            </div>

            {listLoading ? (
              <p className="text-slate-400 text-base animate-pulse text-center py-20">লোড হচ্ছে...</p>
            ) : layouts.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <p className="text-5xl mb-3">📐</p>
                <p className="text-base">কোনো Layout নেই। নতুন তৈরি করুন।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {layouts.map((l) => (
                  <div key={l._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-violet-500" />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          {l.factory && (
                            <span className="text-xs bg-blue-50 border border-blue-200 text-blue-600 px-2 py-0.5 rounded-full font-bold mr-1">
                              🏭 {l.factory}
                            </span>
                          )}
                          <div className="text-base text-blue-600 font-bold mt-1">{l.floor} · Line {l.lineNo}</div>
                          <h3 className="font-black text-slate-900 text-lg mt-0.5">{l.buyer}</h3>
                          <p className="text-slate-500 text-base">{l.style} — {l.item}</p>
                        </div>
                        <span className="text-sm bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-semibold">
                          {l.processes?.length || 0} process
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        {[
                          { label:"SMV",        val: l.smv,                  color:"text-slate-700" },
                          { label:"Efficiency", val: `${l.planEfficiency}%`, color:"text-blue-700" },
                          { label:"Manpower",   val: l.manpower,             color:"text-slate-700" },
                          { label:"1Hr Target", val: l.oneHourTarget,         color:"text-emerald-700" },
                          { label:`Daily (${l.workingHours}h)`, val: l.dailyTarget, color:"text-violet-700" },
                          { label:"Op/Hel/SS",  val: `${l.operator}/${l.helper}/${l.seamSealing}`, color:"text-slate-700" },
                        ].map(({ label, val, color }) => (
                          <div key={label} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2">
                            <div className="text-xs font-bold uppercase text-slate-400">{label}</div>
                            <div className={`text-base font-black ${color}`}>{val}</div>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => { setCurrentLayout(l); prefillEditForm(l); setBuilderTab("process"); setView("builder"); }}
                        className="w-full py-3 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-blue-700 rounded-xl text-base font-bold transition-all">
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
          <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-50">
            <form onSubmit={handleCreateLayout} className="w-full max-w-2xl">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-violet-500" />
                <div className="p-8 space-y-5">
                  <h2 className="text-2xl font-black text-slate-900 mb-1">নতুন Line Layout তৈরি করুন</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <LField label="Floor *"><LSelect value={form.floor} onChange={(v) => setForm((p) => ({...p,floor:v}))} options={FLOOR_OPTIONS} placeholder="— Floor —" /></LField>
                    <LField label="Line No *"><LSelect value={form.lineNo} onChange={(v) => setForm((p) => ({...p,lineNo:v}))} options={LINE_OPTIONS} placeholder="— Line —" renderOption={(o) => `Line ${o}`} /></LField>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <LField label="Buyer *"><LSelect value={form.buyer} onChange={(v) => setForm((p) => ({...p,buyer:v}))} options={BUYER_OPTIONS} placeholder="— Buyer —" /></LField>
                    <LField label="Style"><LInput value={form.style} onChange={(v) => setForm((p) => ({...p,style:v}))} placeholder="121058" /></LField>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <LField label="Item"><LInput value={form.item} onChange={(v) => setForm((p) => ({...p,item:v}))} placeholder="Rain Jacket" /></LField>
                    <LField label="SMV"><LInput type="number" value={form.smv} onChange={(v) => setForm((p) => ({...p,smv:v}))} placeholder="43.2" /></LField>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <LField label="Plan Efficiency (%)"><LInput type="number" value={form.planEfficiency} onChange={(v) => setForm((p) => ({...p,planEfficiency:v}))} placeholder="70" /></LField>
                    <LField label="Working Hours">
                      <select value={form.workingHours} onChange={(e) => setForm((p) => ({...p,workingHours:+e.target.value}))}
                        className="w-full bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-blue-500">
                        {HOURS_OPTIONS.map((h) => <option key={h} value={h}>{h} ঘণ্টা</option>)}
                      </select>
                    </LField>
                    <LField label="Manpower (auto)">
                      <div className="w-full bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-3 py-3 text-base font-black flex justify-between">
                        <span>{manpower}</span><span className="text-slate-400 text-sm font-normal">auto</span>
                      </div>
                    </LField>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[["Operator","operator"],["Helper","helper"],["Seam Sealing","seamSealing"]].map(([label,key]) => (
                      <LField key={key} label={label}><LInput type="number" value={form[key]} onChange={(v) => setForm((p) => ({...p,[key]:v}))} placeholder="0" /></LField>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <LField label="1 Hour Target (auto)">
                      <div className="w-full bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-lg px-3 py-3 text-xl font-black">{oneHourTarget}</div>
                    </LField>
                    <LField label={`Total Daily Target (${form.workingHours}h, auto)`}>
                      <div className="w-full bg-violet-50 border border-violet-300 text-violet-700 rounded-lg px-3 py-3 text-xl font-black">{dailyTarget}</div>
                    </LField>
                  </div>
                  <LField label="Line Sketch / Image (optional)">
                    <div onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-5 cursor-pointer transition-all text-center bg-slate-50">
                      {sketchPreview ? <img src={sketchPreview} alt="sketch" className="max-h-36 mx-auto rounded-lg object-contain" />
                        : <p className="text-slate-400 text-base">ক্লিক করে image select করুন</p>}
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSketchChange} />
                    </div>
                  </LField>
                </div>
                <div className="px-8 pb-8">
                  <button type="submit" disabled={saving||uploading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-4 rounded-xl text-base tracking-widest uppercase transition-all shadow-sm">
                    {uploading ? "Image আপলোড হচ্ছে..." : saving ? "তৈরি হচ্ছে..." : "Layout তৈরি করুন →"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ══ BUILDER VIEW ═════════════════════════════════════════════════════ */}
        {view === "builder" && currentLayout && (
          // FIX: use explicit overflow-hidden + min-h-0 so flex children scroll correctly
          <div className="flex flex-1 overflow-hidden min-h-0">

            {/* LEFT panel */}
            <div className="w-[440px] shrink-0 border-r-2 border-slate-200 flex flex-col bg-white shadow-sm overflow-hidden">

              {/* Tab Bar */}
              <div className="flex border-b-2 border-slate-200 shrink-0">
                {[
                  { key:"edit",    label:"✏️ Edit" },
                  { key:"process", label:"＋ Process" },
                  { key:"list",    label:"☰ List" },
                ].map((t) => (
                  <button key={t.key} onClick={() => setBuilderTab(t.key)}
                    className={`flex-1 py-3 text-sm font-bold transition-all border-b-2
                      ${builderTab === t.key
                        ? "border-blue-600 text-blue-700 bg-blue-50"
                        : "border-transparent text-slate-500 hover:text-slate-700 bg-white"}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── TAB: EDIT HEADER ── */}
              {builderTab === "edit" && (
                <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
                    <span className="text-base text-blue-700 font-black">{currentLayout.floor} · Line {currentLayout.lineNo}</span>
                    <div className="grid grid-cols-3 gap-1.5 text-center mt-2">
                      {[
                        { l:"1Hr Tgt", v: currentLayout.oneHourTarget, c:"text-emerald-700" },
                        { l:`Daily(${currentLayout.workingHours}h)`, v: currentLayout.dailyTarget, c:"text-violet-700" },
                        { l:"Manpower", v: currentLayout.manpower, c:"text-blue-700" },
                      ].map(({ l, v, c }) => (
                        <div key={l} className="bg-white border border-slate-200 rounded-lg px-2 py-2">
                          <div className="text-xs text-slate-400 font-medium">{l}</div>
                          <div className={`text-base font-black ${c}`}>{v}</div>
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
                    <p className="text-sm text-amber-600 uppercase tracking-widest font-bold">Style পরিবর্তন করুন</p>
                    <div className="grid grid-cols-2 gap-3">
                      <LField label="Buyer"><LSelect value={editForm.buyer} onChange={(v) => setEditForm((p) => ({...p,buyer:v}))} options={BUYER_OPTIONS} placeholder="— Buyer —" /></LField>
                      <LField label="Style"><LInput value={editForm.style} onChange={(v) => setEditForm((p) => ({...p,style:v}))} placeholder="Style No" /></LField>
                    </div>
                    <LField label="Item"><LInput value={editForm.item} onChange={(v) => setEditForm((p) => ({...p,item:v}))} placeholder="Item Name" /></LField>
                    <div className="grid grid-cols-2 gap-3">
                      <LField label="SMV"><LInput type="number" value={editForm.smv} onChange={(v) => setEditForm((p) => ({...p,smv:v}))} placeholder="43.2" /></LField>
                      <LField label="Plan Efficiency (%)"><LInput type="number" value={editForm.planEfficiency} onChange={(v) => setEditForm((p) => ({...p,planEfficiency:v}))} placeholder="70" /></LField>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <LField label="Operator"><LInput type="number" value={editForm.operator} onChange={(v) => setEditForm((p) => ({...p,operator:v}))} placeholder="0" /></LField>
                      <LField label="Helper"><LInput type="number" value={editForm.helper} onChange={(v) => setEditForm((p) => ({...p,helper:v}))} placeholder="0" /></LField>
                      <LField label="Seam Sealing"><LInput type="number" value={editForm.seamSealing} onChange={(v) => setEditForm((p) => ({...p,seamSealing:v}))} placeholder="0" /></LField>
                    </div>
                    <LField label="Working Hours">
                      <select value={editForm.workingHours} onChange={(e) => setEditForm((p) => ({...p,workingHours:+e.target.value}))}
                        className="w-full bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-blue-500">
                        {HOURS_OPTIONS.map((h) => <option key={h} value={h}>{h} ঘণ্টা</option>)}
                      </select>
                    </LField>
                    {(() => {
                      const { oneHourTarget: oht, dailyTarget: dt } = calcTargets(editForm.smv, editForm.planEfficiency, editForm.operator, editForm.workingHours);
                      const mp = (parseInt(editForm.operator)||0)+(parseInt(editForm.helper)||0)+(parseInt(editForm.seamSealing)||0);
                      return (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-semibold">নতুন Target Preview</p>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            {[
                              { l:"Manpower",   v:mp,  c:"text-blue-700"    },
                              { l:"1Hr Target", v:oht, c:"text-emerald-700" },
                              { l:`Daily(${editForm.workingHours}h)`, v:dt, c:"text-violet-700" },
                            ].map(({ l,v,c }) => (
                              <div key={l} className="bg-white border border-slate-200 rounded-lg px-2 py-2">
                                <div className="text-xs text-slate-400">{l}</div>
                                <div className={`text-lg font-black ${c}`}>{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    <button type="submit" disabled={editSaving}
                      className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-3 rounded-xl text-base uppercase tracking-widest transition-all">
                      {editSaving ? "আপডেট হচ্ছে..." : "✓ Header আপডেট করুন"}
                    </button>
                  </form>
                </div>
              )}

              {/* ── TAB: ADD PROCESS ── */}
              {builderTab === "process" && (
                <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
                  <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">Process যোগ করুন</p>
                  <LField label="Serial No">
                    <select value={pForm.serialNo} onChange={(e) => setPForm((p) => ({...p,serialNo:+e.target.value}))}
                      className="w-full bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-blue-500">
                      {SERIAL_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </LField>
                  <LField label="Process Name">
                    <select value={pForm.processName} onChange={(e) => setPForm((p) => ({...p,processName:e.target.value}))}
                      className="w-full bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-blue-500">
                      <option value="">— Process select করুন —</option>
                      {PROCESS_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </LField>
                  <LField label="Machine Type">
                    <select value={pForm.machineType} onChange={(e) => setPForm((p) => ({...p,machineType:e.target.value}))}
                      className="w-full bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-blue-500">
                      <option value="">— Machine Type —</option>
                      {MACHINE_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </LField>
                  {pForm.machineType && (() => {
                    const c = mc(pForm.machineType);
                    return (
                      <div className="rounded-lg px-4 py-3 border-l-4 text-base font-bold"
                        style={{ background: c.bg, borderLeftColor: c.accent, color: c.text }}>
                        {pForm.machineType}
                      </div>
                    );
                  })()}
                  <button onClick={openPicker}
                    disabled={addingProcess || !pForm.processName || !pForm.machineType}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-3.5 rounded-xl text-base uppercase tracking-wider transition-all shadow-sm">
                    {addingProcess ? "যোগ হচ্ছে..." : pForm.machineType === "HELPER" ? "+ HELPER যোগ করুন" : "+ Machine select করে যোগ করুন"}
                  </button>
                </div>
              )}

              {/* ── TAB: PROCESS LIST ── */}
              {builderTab === "list" && (
                <div className="flex-1 overflow-y-auto min-h-0 p-4">
                  <p className="text-sm text-slate-400 uppercase tracking-widest mb-3 font-bold">
                    Added Processes ({currentLayout.processes?.length || 0})
                  </p>
                  {(currentLayout.processes?.length || 0) === 0 ? (
                    <p className="text-slate-400 text-base text-center py-10">কোনো process নেই।</p>
                  ) : (
                    <div className="space-y-2">
                      {[...currentLayout.processes].sort((a,b)=>a.serialNo-b.serialNo).map((p) => {
                        const c = mc(p.machineType);
                        return (
                          <div key={p._id} className="rounded-lg px-3 py-2.5 border-l-4"
                            style={{ background: c.bg, borderLeftColor: c.accent, borderTop:`1px solid rgba(0,0,0,0.07)`, borderRight:`1px solid rgba(0,0,0,0.07)`, borderBottom:`1px solid rgba(0,0,0,0.07)` }}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-xs font-black px-2 py-0.5 rounded shrink-0"
                                    style={{ background: c.badge, color: c.badgeText }}>
                                    #{p.serialNo}
                                  </span>
                                  <span className="text-sm font-bold truncate" style={{ color: c.text }}>
                                    {p.processName}
                                  </span>
                                </div>
                                <div className="text-xs font-semibold" style={{ color: c.accent }}>
                                  {p.machineType} · {p.machines?.map((m) => m.fromFloor).join(", ") || "No machine"}
                                </div>
                              </div>
                              {/* Edit + Waste buttons */}
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  onClick={() => setEditingProcess({
                                    _id:                 p._id,
                                    serialNo:            p.serialNo,
                                    processName:         p.processName,
                                    machineType:         p.machineType,
                                    originalMachineType: p.machineType,
                                    originalMachines:    p.machines || [],
                                  })}
                                  className="px-2.5 py-1 rounded-lg text-sm font-bold text-amber-600 border border-amber-200 hover:bg-amber-50 transition-all bg-white">
                                  ✏️
                                </button>
                                <button onClick={() => handleWasteProcess(p._id, currentLayout.floor)}
                                  className="px-2.5 py-1 rounded-lg text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-all bg-white">
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT — Layout Grid: FIX = overflow-hidden so LayoutGrid controls its own scroll */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white">
              <div className="px-4 py-2.5 border-b-2 border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 uppercase tracking-widest font-bold">Layout</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-base text-slate-700 font-bold">{currentLayout.style} — {currentLayout.item}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  {[
                    { l:"Buyer",  v: currentLayout.buyer,          c:"text-blue-700"    },
                    { l:"1Hr",    v: currentLayout.oneHourTarget,   c:"text-emerald-700" },
                    { l:"Daily",  v: currentLayout.dailyTarget,     c:"text-violet-700"  },
                    { l:"MP",     v: currentLayout.manpower,        c:"text-amber-700"   },
                  ].map(({ l, v, c }) => (
                    <span key={l} className="bg-white border border-slate-200 px-3 py-1 rounded-full">
                      <span className="text-slate-400">{l}: </span>
                      <span className={`font-black ${c}`}>{v}</span>
                    </span>
                  ))}
                </div>
              </div>
              {/* FIX: flex-1 + min-h-0 ensures LayoutGrid fills remaining space and scrolls */}
              <div className="flex-1 min-h-0">
                <LayoutGrid
                  processes={currentLayout.processes || []}
                  sketchUrl={currentLayout.sketchUrl}
                  layoutFloor={currentLayout.floor}
                  layoutInfo={currentLayout}
                  onWaste={handleWasteProcess}
                  onSwapSerial={handleSwapSerial}
                  onMoveToSlot={handleMoveToSlot}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Light-theme Field / Input / Select helpers ───────────────────────────────
function LField({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  );
}
function LInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-3 text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors placeholder:text-slate-400" />
  );
}
function LSelect({ value, onChange, options, placeholder, renderOption }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-3 text-base appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors">
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{renderOption ? renderOption(o) : o}</option>)}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">▾</span>
    </div>
  );
}
