// app/api/line-layouts/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/services/mongo";
import { lineLayoutModel } from "@/models/lineLayout-model";

// Correct formula: manpower = operator + helper + seamSealing
// dailyTarget = (manpower × hours × 60 / smv) × (eff/100)
// oneHourTarget = dailyTarget / hours
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

// GET /api/line-layouts?factory=K-2&floor=B-3&lineNo=01
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const factory = searchParams.get("factory");
    const floor   = searchParams.get("floor");
    const lineNo  = searchParams.get("lineNo");

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