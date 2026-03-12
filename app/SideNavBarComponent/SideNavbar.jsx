"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  ClipboardList,
  Activity,
  LogOut,
  LogIn,
  ChartNoAxesCombined,
  MonitorCloud,
  User,
  Table2,
  GitCompare,
  FileText,
  Factory,
  PanelLeftRightDashed,
  ChevronRight,
} from "lucide-react";

const COLLAPSED_W = 56;
const EXPANDED_W  = 220;

// ── Nav structure ──────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Floor Dashboard",
    icon: MonitorCloud,
    group: "common",
    href: "/floor-dashboard",
    children: [],
  },
  {
    label: "Management View",
    icon: ChartNoAxesCombined,
    group: "common",
    children: [
      { label: "Floor Summary", href: "/floor-summary",  icon: ChartNoAxesCombined },
      { label: "Floor Compare", href: "/floor-compare",  icon: GitCompare },
    ],
  },
  {
    label: "Production",
    icon: Activity,
    group: "production",
    children: [
      { label: "Production Input", href: "/ProductionInput", icon: Activity },
    ],
  },
  {
    label: "Quality",
    icon: ClipboardList,
    group: "quality",
    children: [
      { label: "Quality Input",         href: "/QualityInput",        icon: ClipboardList },
      { label: "Quality Summary Table", href: "/QualitySummaryTable", icon: Table2 },
    ],
  },
  {
    label: "Style Media Register",
    icon: FileText,
    group: "tracker",
    children: [
      { label: "Style Media Register", href: "/style-media-register", icon: FileText },
    ],
  },
  {
    label: "Maintenance Department",
    icon: Factory,
    group: "maintenance",
    children: [
      { label: "Machine Inventory", href: "/IEDepartment/MachineInventory", icon: Factory },
    ],
  },
  {
    label: "IE Department",
    icon: PanelLeftRightDashed,
    group: "ie",
    children: [
      { label: "Line Layout", href: "/IEDepartment/LineLayout", icon: PanelLeftRightDashed },
    ],
  },
];

// ── role → allowed groups ──────────────────────────────────────────────────
function getAllowedGroups(role, trackerType) {
  if (role === "Management" || role === "Developer" || role === "Others") {
    return ["common", "production", "quality", "tracker", "ie", "maintenance"];
  }
  if (role === "Data tracker") {
    if (trackerType === "Quality")     return ["common", "quality",    "tracker"];
    if (trackerType === "Production")  return ["common", "production", "tracker"];
    if (trackerType === "Maintenance") return ["common", "maintenance"];
    if (trackerType === "IE")          return ["common", "ie"];
    return ["common"];
  }
  return [];
}

function ActiveDot() {
  return (
    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] shrink-0" />
  );
}

export default function SideNavbar() {
  const { auth, setAuth } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const [expanded, setExpanded]     = useState(false);
  const [openGroups, setOpenGroups] = useState({});

  // ── Sync sidebar width → CSS variable on <html> so layout.js can use it ──
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-w",
      `${expanded ? EXPANDED_W : COLLAPSED_W}px`
    );
  }, [expanded]);

  // Set initial value immediately on mount (before first paint)
  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", `${COLLAPSED_W}px`);
  }, []);

  const handleLogout = () => {
    setAuth(null);
    router.push("/login");
  };

  const user         = auth?.user || auth || {};
  const userName     = user?.user_name            || "";
  const userRole     = user?.role                 || "";
  const trackerType  = user?.tracker_type         || "";
  const userFactory  = user?.factory              || "";
  const userBuilding = user?.assigned_building || user?.building || "";

  const allowedGroups = getAllowedGroups(userRole, trackerType);
  const roleLabel =
    userRole === "Data tracker" && trackerType
      ? `${trackerType} Tracker`
      : userRole || "—";

  function toggleGroup(label) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function isGroupActive(navGroup) {
    if (navGroup.href && (pathname === navGroup.href || pathname.startsWith(navGroup.href + "/"))) return true;
    return (navGroup.children || []).some(
      (c) => pathname === c.href || pathname.startsWith(c.href + "/")
    );
  }

  function handleProtectedClick(e, group) {
    if (!allowedGroups.includes(group)) {
      e.preventDefault();
      router.push("/login");
    }
  }

  // Shared transition style for text/labels sliding in/out
  function fadeSlide(show) {
    return {
      opacity: show ? 1 : 0,
      maxWidth: show ? "200px" : "0px",
      transition: "opacity 180ms, max-width 280ms cubic-bezier(0.4,0,0.2,1)",
      overflow: "hidden",
      whiteSpace: "nowrap",
    };
  }

  return (
    <aside
      style={{
        width: expanded ? `${EXPANDED_W}px` : `${COLLAPSED_W}px`,
        transition: "width 280ms cubic-bezier(0.4,0,0.2,1)",
      }}
      className="fixed inset-y-0 left-0 z-40 h-full bg-slate-950 border-r border-slate-800/60 flex flex-col overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="flex flex-col items-center shrink-0 border-b border-slate-800/60 py-2 px-2 gap-2">

        {/* Row: logo + (when expanded) app name + collapse arrow */}
        <div className="flex items-center w-full gap-2">
          <Link href="/" className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-[0_0_18px_rgba(15,23,42,0.9)]">
              <Image
                src="/HKD_LOGO.png"
                alt="HKD"
                width={30}
                height={30}
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Expanded: title + collapse arrow */}
          {/* Expanded: title + collapse arrow */}
<div style={fadeSlide(expanded)} className="flex items-center justify-between flex-1 min-w-0">
  <span className="text-[9px] font-extrabold text-slate-100 tracking-widest uppercase leading-tight max-w-[120px] whitespace-normal">
    HKD Outdoor Innovations ltd.
  </span>
  <button
    onClick={() => setExpanded(false)}
    className="h-7 w-7 flex-shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
    aria-label="Collapse sidebar"
  >
    <ChevronRight size={15} className="rotate-180" />
  </button>
</div>
        </div>

        {/* Hamburger sits below the logo, centered in collapsed width */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center justify-center h-7 w-9 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <div className="flex flex-col gap-[4px]">
            <span className="block h-[2px] w-[18px] bg-current rounded-full" />
            <span className="block h-[2px] w-[13px] bg-current rounded-full" />
            <span className="block h-[2px] w-[18px] bg-current rounded-full" />
          </div>
        </button>

      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-0.5 px-1.5 scrollbar-none">
        {NAV_GROUPS.map((navGroup) => {
          const allowed = allowedGroups.includes(navGroup.group);
          const active  = isGroupActive(navGroup);
          const isOpen  = openGroups[navGroup.label] ?? active; // auto-open active group
          const hasKids = navGroup.children && navGroup.children.length > 0;
          const Icon    = navGroup.icon;

          const itemCls = [
            "flex items-center gap-2.5 h-9 rounded-xl px-2 transition-all duration-150 group relative w-full",
            active && allowed
              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              : allowed
                ? "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-transparent"
                : "text-slate-600 opacity-40 cursor-default border border-transparent",
          ].join(" ");

          const labelEl = (
            <span style={fadeSlide(expanded)} className="text-[11px] font-bold flex-1 text-left">
              {navGroup.label}
            </span>
          );

          // Tooltip shown only when collapsed
          const tooltipEl = !expanded && (
            <div className="pointer-events-none absolute left-[52px] top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
              <div className="bg-slate-800 border border-slate-700 text-slate-100 text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-xl">
                {navGroup.label}
              </div>
            </div>
          );

          // ── Direct link (no children) ──
          if (!hasKids) {
            return (
              <Link
                key={navGroup.label}
                href={navGroup.href}
                onClick={(e) => handleProtectedClick(e, navGroup.group)}
                className={itemCls}
              >
                <Icon size={16} className="shrink-0" />
                {labelEl}
                {active && allowed && expanded && <ActiveDot />}
                {tooltipEl}
              </Link>
            );
          }

          // ── Group with children ──
          return (
            <div key={navGroup.label}>
              <button
                onClick={() => {
                  if (!allowed) { router.push("/login"); return; }
                  // If collapsed, expand first; if expanded, toggle folder
                  if (!expanded) setExpanded(true);
                  else toggleGroup(navGroup.label);
                }}
                className={itemCls}
              >
                <Icon size={16} className="shrink-0" />
                {labelEl}
                {expanded && allowed && (
                  <ChevronRight
                    size={13}
                    className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                  />
                )}
                {tooltipEl}
              </button>

              {/* Animated children drawer */}
              <div
                style={{
                  maxHeight: expanded && isOpen ? `${navGroup.children.length * 36 + 8}px` : "0px",
                  opacity: expanded && isOpen ? 1 : 0,
                  transition: "max-height 240ms cubic-bezier(0.4,0,0.2,1), opacity 180ms",
                  overflow: "hidden",
                }}
              >
                <div className="ml-3 pl-3 border-l border-slate-700/50 mt-0.5 mb-1 space-y-0.5">
                  {navGroup.children.map((child) => {
                    const childActive = pathname === child.href || pathname.startsWith(child.href + "/");
                    const ChildIcon   = child.icon;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={(e) => handleProtectedClick(e, navGroup.group)}
                        className={[
                          "flex items-center gap-2 h-8 rounded-lg px-2 transition-all duration-150",
                          childActive
                            ? "bg-emerald-500/20 text-emerald-300 font-extrabold"
                            : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 font-bold",
                        ].join(" ")}
                      >
                        <ChildIcon size={13} className="shrink-0 opacity-70" />
                        <span className="text-[11px] whitespace-nowrap">{child.label}</span>
                        {childActive && <ActiveDot />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Bottom: user info + logout ── */}
      <div className="shrink-0 border-t border-slate-800/60 px-1.5 py-2 space-y-1">
        {auth && (
          <div className="flex items-center gap-2 px-1 group relative">
            <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300 shrink-0">
              <User size={13} />
            </div>
            <div style={fadeSlide(expanded)} className="flex flex-col min-w-0">
              <span className="text-[10px] font-extrabold text-slate-100 truncate leading-tight">{userName || "User"}</span>
              <span className="text-[9px] text-slate-400 truncate leading-tight">{roleLabel}</span>
            </div>

            {/* User tooltip when collapsed */}
            {!expanded && (
              <div className="pointer-events-none absolute left-[52px] bottom-0 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                <div className="rounded-xl border border-white/10 bg-slate-900/95 shadow-xl overflow-hidden min-w-[160px]">
                  <div className="px-3 py-2 border-b border-white/10">
                    <div className="text-[11px] font-extrabold text-white">{userName || "User"}</div>
                    <div className="text-[9px] text-slate-400">{roleLabel}</div>
                  </div>
                  <div className="px-3 py-1.5 space-y-1">
                    <div className="flex justify-between text-[9px]">
                      <span className="text-slate-500">Factory</span>
                      <span className="text-slate-200 font-semibold">{userFactory || "—"}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-slate-500">Building</span>
                      <span className="text-slate-200 font-semibold">{userBuilding || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {auth ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 h-8 rounded-xl px-2 border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-200 transition-all"
          >
            <LogOut size={14} className="shrink-0" />
            <span style={fadeSlide(expanded)} className="text-[11px] font-bold">Logout</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="w-full flex items-center gap-2.5 h-8 rounded-xl px-2 border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 hover:text-sky-200 transition-all"
          >
            <LogIn size={14} className="shrink-0" />
            <span style={fadeSlide(expanded)} className="text-[11px] font-bold">Login</span>
          </Link>
        )}
      </div>
    </aside>
  );
}