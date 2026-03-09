// app/api/line-layouts/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/services/mongo";
import { lineLayoutModel } from "@/models/lineLayout-model";

function calcTargets(smv, planEfficiency, operator, workingHours) {
  const eff = (planEfficiency || 0) / 100;
  const oneHour = smv > 0 ? Math.round((60 / smv) * eff * (operator || 0)) : 0;
  const daily   = Math.max(0, oneHour * (workingHours || 8) - 2);
  return { oneHourTarget: oneHour, dailyTarget: daily };
}

// GET /api/line-layouts?floor=B-3&lineNo=01
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const floor  = searchParams.get("floor");
    const lineNo = searchParams.get("lineNo");

    const query = {};
    if (floor)  query.floor  = floor;
    if (lineNo) query.lineNo = lineNo;

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
      floor, lineNo, buyer, style, item,
      smv, planEfficiency, operator, helper, seamSealing,
      workingHours, sketchUrl,
    } = body;

    if (!floor || !lineNo || !buyer) {
      return NextResponse.json(
        { success: false, message: "floor, lineNo, buyer আবশ্যক।" },
        { status: 400 }
      );
    }

    const manpower = (operator || 0) + (helper || 0) + (seamSealing || 0);
    const { oneHourTarget, dailyTarget } = calcTargets(smv, planEfficiency, operator, workingHours);

    const layout = await lineLayoutModel.create({
      floor, lineNo, buyer, style, item,
      smv, planEfficiency, operator, helper, seamSealing,
      manpower, workingHours: workingHours || 8,
      oneHourTarget, dailyTarget,
      sketchUrl: sketchUrl || "",
      processes: [],
    });

    return NextResponse.json({ success: true, data: layout }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}