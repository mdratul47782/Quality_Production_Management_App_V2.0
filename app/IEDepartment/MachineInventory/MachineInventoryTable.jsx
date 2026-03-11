"use client";
// app/IEDepartment/MachineInventory/MachineInventoryTable.jsx

import React, { useState, useEffect } from "react";

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

// ── Flatten machine doc (units[]) → table row ─────────────────────────────────
// Counts are derived by aggregating individual unit statuses per floor
function flattenMachine(doc, slNo) {
  const row = {
    _id:         doc._id,
    slNo,
    machineName: doc.machineName,
    stockQty:    doc.units?.length ?? 0,   // total registered units
    repairable:  0,
    damage:      0,
  };

  // Zero-fill all floor cells
  FLOOR_COLS.forEach(({ runKey, idleKey }) => {
    row[runKey]  = 0;
    row[idleKey] = 0;
  });

  // Aggregate per unit
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

const RunCell  = ({ v }) => (
  <td className="text-center text-xs px-1.5 py-1.5 border-r border-slate-700/50 text-emerald-300 font-medium min-w-[36px]">
    {v ? v : <span className="text-slate-700">—</span>}
  </td>
);
const IdleCell = ({ v }) => (
  <td className="text-center text-xs px-1.5 py-1.5 border-r border-slate-700/50 bg-amber-950/20 text-amber-300 font-medium min-w-[36px]">
    {v ? v : <span className="text-slate-700">—</span>}
  </td>
);

export default function MachineInventoryTable({ refreshKey, factory = "" }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [sortCol, setSortCol] = useState("slNo");
  const [sortDir, setSortDir] = useState("asc");

  // Detail drawer state — click a row to see its serial list
  const [expanded, setExpanded] = useState(null); // machineName

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const qs  = factory ? `?factory=${encodeURIComponent(factory)}` : "";
        const res  = await fetch(`/api/machines${qs}`);
        const json = await res.json();
        if (json.success) {
          setRows(json.data.map((doc, i) => flattenMachine(doc, i + 1)));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshKey, factory]);

  const filtered = rows
    .filter((r) => r.machineName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = a[sortCol] ?? 0;
      const vb = b[sortCol] ?? 0;
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === "asc" ? va - vb : vb - va;
    });

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  };

  const SortIcon = ({ col }) => (
    <span className="ml-1 opacity-60">
      {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  const totalStock      = rows.reduce((s, r) => s + r.stockQty, 0);
  const totalRunning    = rows.reduce((s, r) => FLOOR_COLS.reduce((a, { runKey })  => a + (r[runKey]  || 0), s), 0);
  const totalIdle       = rows.reduce((s, r) => FLOOR_COLS.reduce((a, { idleKey }) => a + (r[idleKey] || 0), s), 0);
  const totalRepairable = rows.reduce((s, r) => s + r.repairable, 0);
  const totalDamage     = rows.reduce((s, r) => s + r.damage, 0);

  return (
    <div className="flex flex-col h-full bg-[#0f1117]">

      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800">
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
        <input
          type="text"
          placeholder="Machine খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#161b27] border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 w-52 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-500 text-sm animate-pulse">
            ডেটা লোড হচ্ছে...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
            কোনো ডেটা পাওয়া যায়নি।
          </div>
        ) : (
          <table className="w-full border-collapse text-xs" style={{ minWidth: "1600px" }}>
            <thead className="sticky top-0 z-10">
              {/* Row 1 — group headers */}
              <tr className="bg-[#161b27] border-b border-slate-700">
                <th rowSpan={2} onClick={() => handleSort("slNo")}
                  className="border-r border-slate-700 px-2 py-2 text-slate-400 font-semibold cursor-pointer whitespace-nowrap">
                  S/L <SortIcon col="slNo" />
                </th>
                <th rowSpan={2} onClick={() => handleSort("machineName")}
                  className="border-r border-slate-700 px-2 py-2 text-left text-slate-400 font-semibold cursor-pointer whitespace-nowrap">
                  Machine Name <SortIcon col="machineName" />
                </th>
                <th rowSpan={2} onClick={() => handleSort("stockQty")}
                  className="border-r border-slate-700 px-2 py-2 text-slate-400 font-semibold cursor-pointer whitespace-nowrap"
                  title="Total registered units">
                  Units <SortIcon col="stockQty" />
                </th>
                {FLOOR_COLS.map(({ floor }) => (
                  <th key={floor} colSpan={2}
                    className="border-r border-slate-700 px-1 py-1.5 text-center text-cyan-400 font-bold tracking-wider">
                    {floor}
                  </th>
                ))}
                <th rowSpan={2} className="border-r border-slate-700 px-2 py-2 text-orange-400 font-semibold whitespace-nowrap">
                  Repair
                </th>
                <th rowSpan={2} className="px-2 py-2 text-red-400 font-semibold whitespace-nowrap">
                  Damage
                </th>
              </tr>
              {/* Row 2 — Run/Idle sub-headers */}
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
                  <tr
                    onClick={() => setExpanded(expanded === row.machineName ? null : row.machineName)}
                    className={`border-b border-slate-800 transition-colors cursor-pointer
                      ${expanded === row.machineName ? "bg-slate-800/50" : idx % 2 === 0 ? "bg-[#0f1117]" : "bg-[#131720]"}
                      hover:bg-slate-800/30`}
                  >
                    <td className="text-center border-r border-slate-700/50 px-2 py-1.5 text-slate-500">{row.slNo}</td>
                    <td className="border-r border-slate-700/50 px-2 py-1.5 text-slate-200 whitespace-nowrap font-medium">
                      <span className="mr-1 text-slate-600 text-[10px]">
                        {expanded === row.machineName ? "▾" : "▸"}
                      </span>
                      {row.machineName}
                    </td>
                    <td className="text-center border-r border-slate-700/50 px-2 py-1.5 text-white font-bold">{row.stockQty}</td>

                    {FLOOR_COLS.map(({ floor, runKey, idleKey }) => (
                      <React.Fragment key={floor}>
                        <RunCell  v={row[runKey]}  />
                        <IdleCell v={row[idleKey]} />
                      </React.Fragment>
                    ))}

                    <td className="text-center border-r border-slate-700/50 px-2 py-1.5 text-orange-400 font-medium">
                      {row.repairable || <span className="text-slate-700">—</span>}
                    </td>
                    <td className="text-center px-2 py-1.5 text-red-400 font-medium">
                      {row.damage || <span className="text-slate-700">—</span>}
                    </td>
                  </tr>

                  {/* ── Expanded serial number detail row ── */}
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

            {/* Footer totals */}
            <tfoot className="sticky bottom-0 bg-[#1a2030] border-t-2 border-slate-600">
              <tr>
                <td className="border-r border-slate-700 px-2 py-2" />
                <td className="border-r border-slate-700 px-2 py-2 text-slate-300 font-bold">
                  TOTAL ({filtered.length} types)
                </td>
                <td className="text-center border-r border-slate-700 px-2 py-2 text-white font-bold">
                  {filtered.reduce((s, r) => s + r.stockQty, 0)}
                </td>
                {FLOOR_COLS.map(({ floor, runKey, idleKey }) => (
                  <React.Fragment key={floor}>
                    <td className="text-center text-emerald-300 font-bold border-r border-slate-700/50 px-1 py-2">
                      {filtered.reduce((s, r) => s + (r[runKey] || 0), 0)}
                    </td>
                    <td className="text-center text-amber-300 font-bold border-r border-slate-700 px-1 py-2 bg-amber-950/20">
                      {filtered.reduce((s, r) => s + (r[idleKey] || 0), 0)}
                    </td>
                  </React.Fragment>
                ))}
                <td className="text-center text-orange-400 font-bold border-r border-slate-700 px-2 py-2">
                  {filtered.reduce((s, r) => s + r.repairable, 0)}
                </td>
                <td className="text-center text-red-400 font-bold px-2 py-2">
                  {filtered.reduce((s, r) => s + r.damage, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Sub-component: shows all units for a machine when row is expanded ─────────
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

  const STATUS_COLOR = {
    Running:    "bg-emerald-950 border-emerald-800 text-emerald-300",
    Idle:       "bg-amber-950 border-amber-800 text-amber-300",
    Repairable: "bg-orange-950 border-orange-800 text-orange-300",
    Damage:     "bg-red-950 border-red-800 text-red-300",
  };

  if (loading) return <p className="text-slate-600 text-xs animate-pulse">লোড হচ্ছে...</p>;
  if (!units.length) return <p className="text-slate-600 text-xs">কোনো unit নেই।</p>;

  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-mono">
        {machineName} — {units.length}টি unit
      </p>
      <div className="flex flex-wrap gap-2">
        {units
          .slice()
          .sort((a, b) => a.serialNumber.localeCompare(b.serialNumber))
          .map((u) => (
            <div key={u.serialNumber}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${STATUS_COLOR[u.status] || "bg-slate-800 border-slate-700 text-slate-300"}`}>
              <span className="font-bold">{u.serialNumber}</span>
              <span className="opacity-40">|</span>
              <span className="opacity-70">{u.floorName}</span>
              <span className="opacity-40">|</span>
              <span>{u.status}</span>
            </div>
          ))}
      </div>
    </div>
  );
}