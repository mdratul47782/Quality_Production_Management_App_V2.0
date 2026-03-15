// app/api/line-layouts/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/services/mongo";
import { lineLayoutModel } from "@/models/lineLayout-model";

// Correct formula: manpower = operator + helper + seamSealing
function calcTargets(smv, planEfficiency, operator, helper, seamSealing, workingHours) {
  const manpower = (parseInt(operator) || 0) + (parseInt(helper) || 0) + (parseInt(seamSealing) || 0);
  const e = (parseFloat(planEfficiency) || 0) / 100;
  const s = parseFloat(smv) || 0;
  const h = parseInt(workingHours) || 8;
  if (s === 0 || manpower === 0) return { manpower, oneHourTarget: 0, dailyTarget: 0 };
  const dailyTarget   = Math.round((manpower * h * 60 / s) * e);
  const oneHourTarget = Math.round(dailyTarget / h);
  return { manpower, oneHourTarget, dailyTarget };
}

// GET /api/line-layouts
// Query params:
//   ?factory=K-2&floor=B-3&lineNo=01   → list layouts (existing behaviour)
//   ?serialNumber=SN-001&factory=K-2   → find which layout+process uses this serial
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const factory      = searchParams.get("factory");
    const floor        = searchParams.get("floor");
    const lineNo       = searchParams.get("lineNo");
    const serialNumber = searchParams.get("serialNumber");

    // ── NEW: serial number lookup ─────────────────────────────────────────────
    if (serialNumber) {
      const query = {};
      if (factory) query.factory = factory;

      // Search all layouts (optionally scoped to factory) for the serial number
      const layouts = await lineLayoutModel.find(query).lean();

      for (const layout of layouts) {
        for (const proc of (layout.processes || [])) {
          const machines = proc.machines || [];
          const match    = machines.find(
            (m) => m.serialNumber && m.serialNumber.toUpperCase() === serialNumber.toUpperCase()
          );
          if (match) {
            // Found — return the layout header + the specific process
            return NextResponse.json({
              success: true,
              data: {
                layout: {
                  _id:            layout._id,
                  factory:        layout.factory,
                  floor:          layout.floor,
                  lineNo:         layout.lineNo,
                  buyer:          layout.buyer,
                  style:          layout.style,
                  item:           layout.item,
                  smv:            layout.smv,
                  planEfficiency: layout.planEfficiency,
                  operator:       layout.operator,
                  helper:         layout.helper,
                  seamSealing:    layout.seamSealing,
                  workingHours:   layout.workingHours,
                },
                process: {
                  _id:         proc._id,
                  serialNo:    proc.serialNo,
                  processName: proc.processName,
                  machineType: proc.machineType,
                  machines:    machines,   // all machines in the process (for context)
                },
              },
            });
          }
        }
      }

      // Serial not found in any layout
      return NextResponse.json({ success: true, data: null });
    }

    // ── Existing: list layouts ────────────────────────────────────────────────
    const query = {};
    if (factory) query.factory = factory;
    if (floor)   query.floor   = floor;
    if (lineNo)  query.lineNo  = lineNo;

    const layouts = await lineLayoutModel.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: layouts ?? [] });

  } catch (err) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

// POST /api/line-layouts  — create new layout
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      factory,
      floor, lineNo, buyer, style, item,
      smv, planEfficiency, operator, helper, seamSealing,
      workingHours, sketchUrl,
    } = body;

    if (!floor || !lineNo || !buyer) {
      return NextResponse.json(
        { success: false, message: "floor, lineNo, and buyer are required." },
        { status: 400 }
      );
    }

    const { manpower, oneHourTarget, dailyTarget } = calcTargets(
      smv, planEfficiency, operator, helper, seamSealing, workingHours
    );

    const layout = await lineLayoutModel.create({
      factory:  factory || "",
      floor, lineNo, buyer, style, item,
      smv:            parseFloat(smv)            || 0,
      planEfficiency: parseFloat(planEfficiency) || 0,
      operator:       parseInt(operator)         || 0,
      helper:         parseInt(helper)           || 0,
      seamSealing:    parseInt(seamSealing)      || 0,
      manpower,
      workingHours: parseInt(workingHours) || 8,
      oneHourTarget,
      dailyTarget,
      sketchUrl: sketchUrl || "",
      processes: [],
    });

    return NextResponse.json({ success: true, data: layout }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}