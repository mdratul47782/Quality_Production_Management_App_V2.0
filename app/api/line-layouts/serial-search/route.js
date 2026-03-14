// app/api/line-layouts/serial-search/route.js
// GET /api/line-layouts/serial-search?serial=SN-001&factory=K-2
// Returns every layout+process where the given serial number is currently assigned.

import { NextResponse } from "next/server";
import { dbConnect }       from "@/services/mongo";
import { lineLayoutModel } from "@/models/lineLayout-model";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const serial  = searchParams.get("serial")?.trim().toUpperCase();
    const factory = searchParams.get("factory");

    if (!serial) {
      return NextResponse.json(
        { success: false, message: "serial param is required" },
        { status: 400 }
      );
    }

    const query = {};
    if (factory) query.factory = factory;

    // Fetch all layouts (with processes embedded)
    const layouts = await lineLayoutModel.find(query).lean();

    const results = [];

    for (const layout of layouts) {
      for (const proc of (layout.processes || [])) {
        const match = (proc.machines || []).find(
          (m) => m.serialNumber?.toUpperCase() === serial
        );
        if (match) {
          results.push({
            layoutId:    layout._id,
            factory:     layout.factory,
            floor:       layout.floor,
            lineNo:      layout.lineNo,
            buyer:       layout.buyer,
            style:       layout.style,
            item:        layout.item,
            serialNo:    proc.serialNo,
            processName: proc.processName,
            machineType: proc.machineType,
            machineName: match.machineName,
            fromFloor:   match.fromFloor,
            serialNumber: match.serialNumber,
          });
        }
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err?.message || "Search failed" },
      { status: 500 }
    );
  }
}