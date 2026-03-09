"use client";
// app/IEDepartment/MachineInventory/page.js

import { useState } from "react";
import MachineInventoryForm  from "./MachineInventoryForm";
import MachineInventoryTable from "./MachineInventoryTable";

export default function Page() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    // Outer shell — full viewport, hides overflow from scaled content
    <div className="w-screen h-screen overflow-hidden bg-[#0f1117]">

      {/* Scale wrapper — 67% zoom, anchored top-left */}
      <div
        style={{
          transform: "scale(0.67)",
          transformOrigin: "top left",
          width:  "149.25vw",   /* 100 / 0.67 — compensates so content fills width  */
          height: "149.25vh",   /* same for height                                  */
        }}
        className="flex flex-col"
      >

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
          <div className="h-7 w-1 bg-cyan-400 rounded-full" />
          <div>
            <p className="text-[10px] tracking-[0.3em] text-cyan-400 uppercase font-mono">IE Department</p>
            <h1 className="text-xl font-bold text-white tracking-tight leading-tight">
              Machine Inventory
            </h1>
          </div>
        </div>

        {/* ── Split Layout: Form (left) | Table (right) ─────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — Form */}
          <div className="w-[420px] shrink-0 border-r border-slate-800 overflow-y-auto">
            <MachineInventoryForm onSaveSuccess={() => setRefreshKey((k) => k + 1)} />
          </div>

          {/* RIGHT — Table */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <MachineInventoryTable refreshKey={refreshKey} />
          </div>

        </div>
      </div>
    </div>
  );
}