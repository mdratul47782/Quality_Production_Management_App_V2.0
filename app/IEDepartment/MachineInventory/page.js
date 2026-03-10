"use client";
// app/IEDepartment/MachineInventory/page.js

import { useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import MachineInventoryForm  from "./MachineInventoryForm";
import MachineInventoryTable from "./MachineInventoryTable";

const FACTORY_OPTIONS = ["K-2", "K-3", "K-4", "Others"];

export default function Page() {
  const { auth, loading: authLoading } = useAuth();
  const [refreshKey, setRefreshKey]    = useState(0);
  const [filterFactory, setFilterFactory] = useState("");

  const userFactory = auth?.factory ?? "";
  const isAdmin     = auth?.role === "Admin" || auth?.role === "IE";
  const effectiveFactory = isAdmin ? (filterFactory || "") : userFactory;

  if (authLoading) {
    return (
      <div className="w-screen h-screen bg-[#0f1117] flex items-center justify-center">
        <p className="text-slate-500 text-sm animate-pulse font-mono">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0f1117]">
      <div
        style={{
          transform: "scale(0.67)",
          transformOrigin: "top left",
          width:  "149.25vw",
          height: "149.25vh",
        }}
        className="flex flex-col"
      >
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-7 w-1 bg-cyan-400 rounded-full" />
            <div>
              <p className="text-[10px] tracking-[0.3em] text-cyan-400 uppercase font-mono">IE Department</p>
              <h1 className="text-xl font-bold text-white tracking-tight leading-tight">Machine Inventory</h1>
            </div>
          </div>

          {/* Factory badge/filter */}
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">Factory</span>
                <div className="relative">
                  <select
                    value={filterFactory}
                    onChange={(e) => { setFilterFactory(e.target.value); setRefreshKey((k) => k + 1); }}
                    className="bg-[#161b27] border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:border-cyan-500 appearance-none"
                  >
                    <option value="">সব Factory</option>
                    {FACTORY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▾</span>
                </div>
              </div>
            ) : (
              <span className="text-sm bg-cyan-950 border border-cyan-800 text-cyan-300 px-3 py-1.5 rounded-lg font-semibold font-mono">
                🏭 {userFactory || "—"}
              </span>
            )}
          </div>
        </div>

        {/* ── Split Layout: Form (left) | Table (right) ── */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-[420px] shrink-0 border-r border-slate-800 overflow-y-auto">
            <MachineInventoryForm
              factory={effectiveFactory}
              onSaveSuccess={() => setRefreshKey((k) => k + 1)}
            />
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            <MachineInventoryTable
              refreshKey={refreshKey}
              factory={effectiveFactory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}