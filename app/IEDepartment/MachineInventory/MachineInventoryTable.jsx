"use client";
// app/IEDepartment/MachineInventory/MachineInventoryTable.jsx

import React, { useState, useEffect } from "react";

// ── Column definitions matching Excel "TTL Machine Status" ──────────────────
const FLOOR_COLS = [
  { floor: "A2",  runKey: "A-2_run",  idleKey: "A-2_idle"  },
  { floor: "A3",  runKey: "A-3_run",  idleKey: "A-3_idle"  },
  { floor: "A4",  runKey: "A-4_run",  idleKey: "A-4_idle"  },
  { floor: "A5",  runKey: "A-5_run",  idleKey: "A-5_idle"  },
  { floor: "B2",  runKey: "B-2_run",  idleKey: "B-2_idle"  },
  { floor: "B3",  runKey: "B-3_run",  idleKey: "B-3_idle"  },
  { floor: "B4",  runKey: "B-4_run",  idleKey: "B-4_idle"  },
  { floor: "B5",  runKey: "B-5_run",  idleKey: "B-5_idle"  },
];

// ── Helper: convert DB machine doc → flat row object ────────────────────────
function flattenMachine(doc) {
  const row = {
    _id:         doc._id,
    slNo:        doc.slNo ?? "—",
    machineName: doc.machineName,
    stockQty:    doc.stockQty ?? 0,
    repairable:  0,
    damage:      0,
  };
  FLOOR_COLS.forEach(({ floor, runKey, idleKey }) => {
    // FLOOR_COLS এ "A2" কিন্তু DB তে "A-2" — তাই convert করতে হবে
    const dbKey = floor[0] + "-" + floor.slice(1); // "A2" → "A-2", "B3" → "B-3"
    const found = doc.floors?.find((f) => f.floorName === dbKey);
    row[runKey]  = found?.running    ?? 0;
    row[idleKey] = found?.idle       ?? 0;
    if (found) {
      row.repairable += found.repairable ?? 0;
      row.damage     += found.damage     ?? 0;
    }
  });
  return row;
}

// ── Cell components ──────────────────────────────────────────────────────────
const RunCell  = ({ v }) => (
  <td className="text-center text-xs px-1.5 py-1.5 border-r border-slate-700/50 text-emerald-300 font-medium min-w-[36px]">
    {v || <span className="text-slate-700">—</span>}
  </td>
);
const IdleCell = ({ v }) => (
  <td className="text-center text-xs px-1.5 py-1.5 border-r border-slate-700/50 bg-amber-950/20 text-amber-300 font-medium min-w-[36px]">
    {v || <span className="text-slate-700">—</span>}
  </td>
);

// ── Main Component ───────────────────────────────────────────────────────────
export default function MachineInventoryTable({ refreshKey }) {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [sortCol, setSortCol]   = useState("slNo");
  const [sortDir, setSortDir]   = useState("asc");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res  = await fetch("/api/machines");
        const json = await res.json();
        if (json.success) {
          setRows(json.data.map(flattenMachine));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  // ── Filter + Sort ──────────────────────────────────────────────────────────
  const filtered = rows
    .filter((r) =>
      r.machineName.toLowerCase().includes(search.toLowerCase())
    )
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

  const SortIcon = ({ col }) =>
    sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕";

  // ── Summaries ──────────────────────────────────────────────────────────────
  const totalStock      = rows.reduce((s, r) => s + r.stockQty, 0);
  const totalRunning    = rows.reduce((s, r) => FLOOR_COLS.reduce((a, { runKey }) => a + (r[runKey] || 0), s), 0);
  const totalIdle       = rows.reduce((s, r) => FLOOR_COLS.reduce((a, { idleKey }) => a + (r[idleKey] || 0), s), 0);
  const totalRepairable = rows.reduce((s, r) => s + r.repairable, 0);
  const totalDamage     = rows.reduce((s, r) => s + r.damage, 0);

  return (
    <div className="flex flex-col h-full bg-[#0f1117]">

      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800">
        {/* Summary pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Stock",      val: totalStock,      color: "bg-slate-800 text-slate-200" },
            { label: "Running",    val: totalRunning,    color: "bg-emerald-950 text-emerald-300" },
            { label: "Idle",       val: totalIdle,       color: "bg-amber-950  text-amber-300"   },
            { label: "Repairable", val: totalRepairable, color: "bg-orange-950 text-orange-300"  },
            { label: "Damage",     val: totalDamage,     color: "bg-red-950    text-red-300"     },
          ].map(({ label, val, color }) => (
            <span key={label} className={`${color} text-xs font-semibold px-3 py-1 rounded-full`}>
              {label}: {val}
            </span>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Machine খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#161b27] border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 w-52 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
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
          <table className="w-full border-collapse text-xs" style={{ minWidth: "1100px" }}>
            <thead className="sticky top-0 z-10">

              {/* ── Header Row 1: group labels ── */}
              <tr className="bg-[#161b27] border-b border-slate-700">
                <th rowSpan={2} className="border-r border-slate-700 px-2 py-2 text-slate-400 font-semibold cursor-pointer whitespace-nowrap" onClick={() => handleSort("slNo")}>
                  S/L<SortIcon col="slNo" />
                </th>
                <th rowSpan={2} className="border-r border-slate-700 px-2 py-2 text-left text-slate-400 font-semibold cursor-pointer whitespace-nowrap" onClick={() => handleSort("machineName")}>
                  Machine Name<SortIcon col="machineName" />
                </th>
                <th rowSpan={2} className="border-r border-slate-700 px-2 py-2 text-slate-400 font-semibold cursor-pointer whitespace-nowrap" onClick={() => handleSort("stockQty")}>
                  Stock<SortIcon col="stockQty" />
                </th>
                {/* Floor group headers */}
                {FLOOR_COLS.map(({ floor }) => (
                  <th key={floor} colSpan={2} className="border-r border-slate-700 px-1 py-1.5 text-center text-cyan-400 font-bold tracking-wider">
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

              {/* ── Header Row 2: Run / Idle sub-labels ── */}
              <tr className="bg-[#1a2030] border-b border-slate-700">
                {FLOOR_COLS.map(({ floor }) => (
                  <React.Fragment key={floor}>
                    <th className="border-r border-slate-700/50 px-1 py-1 text-center text-emerald-500 font-medium">
                      Run
                    </th>
                    <th className="border-r border-slate-700 px-1 py-1 text-center text-amber-500 font-medium bg-amber-950/20">
                      Idle
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map((row, idx) => (
                <tr
                  key={row._id}
                  className={`border-b border-slate-800 transition-colors hover:bg-slate-800/30 ${
                    idx % 2 === 0 ? "bg-[#0f1117]" : "bg-[#131720]"
                  }`}
                >
                  {/* S/L */}
                  <td className="text-center border-r border-slate-700/50 px-2 py-1.5 text-slate-500">
                    {row.slNo}
                  </td>

                  {/* Machine Name */}
                  <td className="border-r border-slate-700/50 px-2 py-1.5 text-slate-200 whitespace-nowrap font-medium">
                    {row.machineName}
                  </td>

                  {/* Stock */}
                  <td className="text-center border-r border-slate-700/50 px-2 py-1.5 text-white font-bold">
                    {row.stockQty}
                  </td>

                  {/* Floor columns */}
                  {FLOOR_COLS.map(({ floor, runKey, idleKey }) => (
                    <React.Fragment key={floor}>
                      <RunCell  v={row[runKey]}  />
                      <IdleCell v={row[idleKey]} />
                    </React.Fragment>
                  ))}

                  {/* Repairable */}
                  <td className="text-center border-r border-slate-700/50 px-2 py-1.5 text-orange-400 font-medium">
                    {row.repairable || <span className="text-slate-700">—</span>}
                  </td>

                  {/* Damage */}
                  <td className="text-center px-2 py-1.5 text-red-400 font-medium">
                    {row.damage || <span className="text-slate-700">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* ── Footer Totals ── */}
            <tfoot className="sticky bottom-0 bg-[#1a2030] border-t-2 border-slate-600">
              <tr>
                <td className="border-r border-slate-700 px-2 py-2" />
                <td className="border-r border-slate-700 px-2 py-2 text-slate-300 font-bold text-xs">
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