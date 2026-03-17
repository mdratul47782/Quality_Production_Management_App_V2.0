// app/page.js
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import SignInOut from "../AuthComponents/SignInOut";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  ImageIcon,
  Activity,
  BarChart2,
  Table2,
  MonitorCloud,
  GitCompare,
  PanelLeftRightDashed,
  Wrench,
} from "lucide-react";

// ── Excel SVG Icon ─────────────────────────────────────────────────────────
function ExcelIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="14" height="18" rx="2" fill="#1D6F42" />
      <rect x="10" y="3" width="12" height="18" rx="2" fill="#21A366" />
      <rect x="9" y="3" width="7" height="18" rx="1" fill="#107C41" />
      <path d="M5.5 8.5L8.5 15.5M8.5 8.5L5.5 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="8" x2="19" y2="8" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <line x1="12" y1="11" x2="19" y2="11" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <line x1="12" y1="14" x2="19" y2="14" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

// ── Info Pill ──────────────────────────────────────────────────────────────
function InfoPill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
      <span className="text-white/55">{label}:</span>
      <span className="text-white">{value || "-"}</span>
    </span>
  );
}

// ── Compact Module Tile ────────────────────────────────────────────────────
function Tile({ href, icon: Icon, title, desc, tone = "sky" }) {
  const toneMap = {
    sky:     "from-sky-500/10 to-sky-500/3 border-sky-400/20 hover:border-sky-300/40",
    emerald: "from-emerald-500/10 to-emerald-500/3 border-emerald-400/20 hover:border-emerald-300/40",
    amber:   "from-amber-500/10 to-amber-500/3 border-amber-400/20 hover:border-amber-300/40",
    violet:  "from-violet-500/10 to-violet-500/3 border-violet-400/20 hover:border-violet-300/40",
    rose:    "from-rose-500/10 to-rose-500/3 border-rose-400/20 hover:border-rose-300/40",
    slate:   "from-slate-400/10 to-slate-400/3 border-slate-300/15 hover:border-slate-200/35",
    green:   "from-green-500/10 to-green-500/3 border-green-400/20 hover:border-green-300/40",
    orange:  "from-orange-500/10 to-orange-500/3 border-orange-400/20 hover:border-orange-300/40",
  };

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br ${toneMap[tone]} p-3 transition-all hover:-translate-y-0.5`}
    >
      <div className="flex items-start gap-2.5">
        <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-white/10 bg-white/8 text-white">
          <Icon size={14} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="truncate text-[11px] font-semibold text-white leading-tight">{title}</h3>
            <ArrowRight size={10} className="ml-auto text-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
          <p className="mt-0.5 line-clamp-1 text-[10px] text-white/45">{desc}</p>
        </div>
      </div>
    </Link>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function HomePage() {
  const { auth } = useAuth();

  const userName = useMemo(
    () => auth?.user?.user_name || auth?.user_name || "User",
    [auth]
  );
  const factory = useMemo(
    () => auth?.factory || auth?.user?.factory || auth?.assigned_factory || "",
    [auth]
  );
  const building = useMemo(
    () => auth?.assigned_building || auth?.user?.assigned_building || auth?.building || "",
    [auth]
  );

  return (
    <main className="h-screen overflow-hidden bg-[#070A12] text-white pl-14 flex flex-col">

      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-[-10%] h-[480px] w-[480px] rounded-full bg-emerald-500/12 blur-[80px]" />
        <div className="absolute -top-28 right-[-12%] h-[500px] w-[500px] rounded-full bg-sky-500/12 blur-[80px]" />
        <div className="absolute bottom-[-20%] left-[20%] h-[480px] w-[480px] rounded-full bg-violet-500/10 blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      {/* ── Header ── */}
      <header className="shrink-0 border-b border-white/10 bg-[#070A12]/70 backdrop-blur z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2.5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white border border-white/15 flex items-center justify-center overflow-hidden shadow-sm">
              <Image
                src="/HKD_LOGO.png"
                alt="HKD Outdoor Innovations Ltd."
                width={30}
                height={30}
                className="object-contain"
                priority
              />
            </div>
            <div className="leading-tight">
              <p className="text-[12px] font-semibold text-white/95">HKD Outdoor Innovations Ltd.</p>
              <p className="text-[10px] text-white/50">Production & Quality Management System</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <div className="-mt-2 origin-right scale-[0.75]">
              <SignInOut />
            </div>
            <InfoPill label="Factory" value={factory} />
            <InfoPill label="Floor" value={building} />
          </div>

          <div className="md:hidden">
            <Link
              href="/user-manual"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/90"
            >
              <BookOpen size={14} /> Manual
            </Link>
          </div>
        </div>
      </header>

      {/* ── Page body ── */}
      <div className="flex-1 overflow-hidden flex flex-col mx-auto w-full max-w-7xl px-5 py-5 gap-4">

        {/* ══ HERO ROW ══════════════════════════════════════════════════════
            Left  → hero text + CTA buttons
            Right → factory SVG image, no border, no card, just floating
        ════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-8 items-center shrink-0">

          {/* LEFT — Hero text */}
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60 w-fit">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
              Live dashboards • Fast entry • Clean tracking
            </div>

            <h1 className="text-[36px] font-bold leading-tight">
              YOUR DAILY{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent">
                PRODUCTION & QUALITY
              </span>{" "}
              CONTROL CENTER.
            </h1>

            <p className="text-[12px] leading-relaxed text-white/60 max-w-sm">
              Open modules from the tiles below. Track hourly production, quality inspections,
              machine inventory, and line layouts — all in one system.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/floor-dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-[12px] font-semibold text-emerald-950 shadow-[0_8px_24px_rgba(16,185,129,0.25)] hover:bg-emerald-400 transition-colors"
              >
                <MonitorCloud size={14} />
                Floor Dashboard
              </Link>
              <Link
                href="/ProductionInput"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-3.5 py-2 text-[12px] font-semibold text-white/85 hover:bg-white/14 transition-colors"
              >
                <ClipboardList size={14} />
                Production Input
              </Link>
              <Link
                href="/user-manual"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-3.5 py-2 text-[12px] font-semibold text-white/85 hover:bg-white/14 transition-colors"
              >
                <BookOpen size={14} />
                User Manual
              </Link>
            </div>

            {/* Mobile pills */}
            <div className="flex flex-wrap gap-2 md:hidden mt-1">
              <InfoPill label="User" value={userName} />
              <InfoPill label="Factory" value={factory} />
              <InfoPill label="Floor" value={building} />
            </div>
          </div>

          {/* RIGHT — Floating image, auto-fits any size */}
<div className="relative flex items-center justify-center h-[320px] w-full">
  <Image
    src="/ChatGPT_Image_Mar_17__2026__09_57_46_AM-removebg-preview.png"
    alt="Factory"
    fill
    className="object-contain"
    priority
  />
</div>
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-px flex-1 bg-white/7" />
          <span className="text-[9px] font-bold tracking-widest uppercase text-white/25">All Modules</span>
          <div className="h-px flex-1 bg-white/7" />
        </div>

        {/* ══ TILES GRID ════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 flex-1 content-start">
          <Tile href="/floor-dashboard"               icon={MonitorCloud}         title="Floor Dashboard"   desc="Live line performance"     tone="sky"     />
          <Tile href="/floor-summary"                 icon={BarChart2}            title="Floor Summary"     desc="Day charts & comparisons"  tone="violet"  />
          <Tile href="/floor-compare"                 icon={GitCompare}           title="Floor Compare"     desc="Side-by-side floors"       tone="slate"   />
          <Tile href="/ProductionInput"               icon={Activity}             title="Production Input"  desc="Hourly production entry"   tone="emerald" />
          <Tile href="/QualityInput"                  icon={ClipboardList}        title="Quality Input"     desc="Inspection & defects"      tone="amber"   />
          <Tile href="/QualitySummaryTable"           icon={Table2}               title="Quality Summary"   desc="Hourly quality totals"     tone="slate"   />
          <Tile href="/style-media-register"          icon={ImageIcon}            title="Style Media"       desc="Buyer/Style/Color media"   tone="rose"    />
          <Tile href="/IEDepartment/MachineInventory" icon={ExcelIcon}            title="Machine Inventory" desc="Machine register & export" tone="green"   />
          <Tile href="/IEDepartment/LineLayout"       icon={PanelLeftRightDashed} title="Line Layout"       desc="IE dept line plans"        tone="violet"  />
          <Tile href="/IEDepartment/MachineInventory" icon={Wrench}               title="Maintenance"       desc="Repair & work orders"      tone="orange"  />
        </div>

        {/* ── Footer strip ── */}
        <div className="shrink-0 flex items-center justify-between border-t border-white/6 pt-2">
          <p className="text-[10px] text-white/25">
            © {new Date().getFullYear()} HKD Outdoor Innovations Ltd.
          </p>
          <p className="text-[10px] text-white/25">
            Floor visibility • Quality • Production
          </p>
        </div>

      </div>
    </main>
  );
}