"use client";
// app/IEDepartment/MachineInventory/MachineInventoryTable.jsx

import React, { useState, useEffect } from "react";

const FLOOR_COLS = [
  { floor: "A2",      dbKey: "A-2",     runKey: "A2_run",     idleKey: "A2_idle"     },
  { floor: "A3",      dbKey: "A-3",     runKey: "A3_run",     idleKey: "A3_idle"     },
  { floor: "A4",      dbKey: "A-4",     runKey: "A4_run",     idleKey: "A4_idle"     },
  { floor: "A5",      dbKey: "A-5",     runKey: "A5_run",     idleKey: "A5_idle"     },
  { floor: "B2",      dbKey: "B-2",     runKey: "B2_run",     idleKey: "B2_idle"     },
  { floor: "B3",      dbKey: "B-3",     runKey: "B3_run",     idleKey: "B3_idle"     },
  { floor: "B4",      dbKey: "B-4",     runKey: "B4_run",     idleKey: "B4_idle"     },
  { floor: "B5",      dbKey: "B-5",     runKey: "B5_run",     idleKey: "B5_idle"     },
  { floor: "A6",      dbKey: "A-6",     runKey: "A6_run",     idleKey: "A6_idle"     },
  { floor: "B6",      dbKey: "B-6",     runKey: "B6_run",     idleKey: "B6_idle"     },
  { floor: "C4",      dbKey: "C-4",     runKey: "C4_run",     idleKey: "C4_idle"     },
  { floor: "K3",      dbKey: "K-3",     runKey: "K3_run",     idleKey: "K3_idle"     },
  { floor: "SMD/CAD", dbKey: "SMD/CAD", runKey: "SMDCAD_run", idleKey: "SMDCAD_idle" },
  { floor: "Others",  dbKey: "Others",  runKey: "Others_run", idleKey: "Others_idle" },
];

function flattenMachine(doc) {
  const row = {
    _id:         doc._id,
    slNo:        doc.slNo ?? "—",
    machineName: doc.machineName ?? "—",
    stockQty:    doc.stockQty ?? 0,
    repairable:  0,
    damage:      0,
  };
  FLOOR_COLS.forEach(({ dbKey, runKey, idleKey }) => {
    const found = (doc.floors ?? []).find((f) => f.floorName === dbKey); // ✅ safe fallback
    row[runKey]  = found?.running    ?? 0;
    row[idleKey] = found?.idle       ?? 0;
    if (found) {
      row.repairable += found.repairable ?? 0;
      row.damage     += found.damage     ?? 0;
    }
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

export default function MachineInventoryTable({ refreshKey }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [sortCol, setSortCol] = useState("slNo");
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res  = await fetch("/api/machines");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) { // ✅ Array.isArray check
          setRows(json.data.map(flattenMachine));
        } else {
          setRows([]); // ✅ safe fallback
        }
      } catch (e) {
        console.error(e);
        setRows([]); // ✅ safe fallback on network error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshKey]);

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
            { label: "Stock",      val: totalStock,      color: "bg-slate-800 text-slate-200"       },
            { label: "Running",    val: totalRunning,    color: "bg-emerald-950 text-emerald-300"    },
            { label: "Idle",       val: totalIdle,       color: "bg-amber-950 text-amber-300"        },
            { label: "Repairable", val: totalRepairable, color: "bg-orange-950 text-orange-300"      },
            { label: "Damage",     val: totalDamage,     color: "bg-red-950 text-red-300"            },
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
          <table className="w-full border-collapse text-xs" style={{ minWidth: "1400px" }}>
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
                  className="border-r border-slate-700 px-2 py-2 text-slate-400 font-semibold cursor-pointer whitespace-nowrap">
                  Stock <SortIcon col="stockQty" />
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
                <tr key={row._id}
                  className={`border-b border-slate-800 transition-colors hover:bg-slate-800/30 ${
                    idx % 2 === 0 ? "bg-[#0f1117]" : "bg-[#131720]"
                  }`}
                >
                  <td className="text-center border-r border-slate-700/50 px-2 py-1.5 text-slate-500">{row.slNo}</td>
                  <td className="border-r border-slate-700/50 px-2 py-1.5 text-slate-200 whitespace-nowrap font-medium">{row.machineName}</td>
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