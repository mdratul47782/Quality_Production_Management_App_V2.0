"use client";
// app/IEDepartment/MachineInventory/page.js

import { useState } from "react";
import MachineInventoryForm  from "./MachineInventoryForm";
import MachineInventoryTable from "./MachineInventoryTable";

export default function Page() {
  // refreshKey বাড়লে Table আবার fetch করবে
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
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

        {/* LEFT — Form (fixed width) */}
        <div className="w-[420px] shrink-0 border-r border-slate-800 overflow-y-auto">
          <MachineInventoryForm onSaveSuccess={() => setRefreshKey((k) => k + 1)} />
        </div>

        {/* RIGHT — Table (fills remaining space) */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <MachineInventoryTable refreshKey={refreshKey} />
        </div>

      </div>
    </div>
  );
}