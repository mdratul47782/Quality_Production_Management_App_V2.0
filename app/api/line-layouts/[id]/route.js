// app/api/line-layouts/[id]/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/services/mongo";
import { lineLayoutModel } from "@/models/lineLayout-model";
import { machineModel }    from "@/models/machine-model";

// GET /api/line-layouts/[id]
export async function GET(_, context) {
  try {
    await dbConnect();
    const { id } = await context.params; // ✅ await params
    const layout = await lineLayoutModel.findById(id).lean();
    if (!layout) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: layout });
  } catch (err) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

// PATCH /api/line-layouts/[id]
export async function PATCH(request, context) {
  try {
    await dbConnect();
    const { id } = await context.params;
    const body   = await request.json();
    const { action } = body;

    const layout = await lineLayoutModel.findById(id);
    if (!layout) return NextResponse.json({ success: false, message: "Layout not found" }, { status: 404 });

    // ── UPDATE HEADER ────────────────────────────────────────────────────────
    if (action === "update_header") {
      const { buyer, style, item, smv, planEfficiency, operator, helper, seamSealing, workingHours } = body;

      if (buyer        !== undefined) layout.buyer          = buyer;
      if (style        !== undefined) layout.style          = style;
      if (item         !== undefined) layout.item           = item;
      if (smv          !== undefined) layout.smv            = parseFloat(smv) || layout.smv;
      if (planEfficiency !== undefined) layout.planEfficiency = parseFloat(planEfficiency) || layout.planEfficiency;
      if (operator     !== undefined) layout.operator       = parseInt(operator)     || 0;
      if (helper       !== undefined) layout.helper         = parseInt(helper)       || 0;
      if (seamSealing  !== undefined) layout.seamSealing    = parseInt(seamSealing)  || 0;
      if (workingHours !== undefined) layout.workingHours   = parseInt(workingHours) || 8;

      // Recalculate derived fields
      layout.manpower = (layout.operator || 0) + (layout.helper || 0) + (layout.seamSealing || 0);
      const eff = (layout.planEfficiency || 0) / 100;
      const s   = layout.smv || 0;
      layout.oneHourTarget = s > 0 ? Math.round((60 / s) * eff * (layout.operator || 0)) : 0;
      layout.dailyTarget   = Math.max(0, layout.oneHourTarget * (layout.workingHours || 8) - 2);

      await layout.save();
      const updated = await lineLayoutModel.findById(id).lean();
      return NextResponse.json({ success: true, data: updated });
    }

    // ── REORDER SERIAL ───────────────────────────────────────────────────────
    if (action === "reorder_serial") {
      // body.updates = [{ processId, serialNo }]
      const { updates } = body;
      for (const { processId, serialNo } of updates || []) {
        const entry = layout.processes.id(processId);
        if (entry) entry.serialNo = serialNo;
      }
      await layout.save();
      const updated = await lineLayoutModel.findById(id).lean();
      return NextResponse.json({ success: true, data: updated });
    }

    // ── ADD PROCESS ──────────────────────────────────────────────────────────
    if (action === "add_process") {
      const { serialNo, processName, machineType, machinesSelected } = body;

      // Deduct idle from each selected machine's floor → add to running
      for (const sel of machinesSelected || []) {
        const machine = await machineModel.findById(sel.machineId);
        if (!machine) continue;
        const fi = machine.floors.findIndex((f) => f.floorName === sel.fromFloor);
        if (fi >= 0 && machine.floors[fi].idle > 0) {
          machine.floors[fi].idle    = Math.max(0, machine.floors[fi].idle - 1);
          machine.floors[fi].running = (machine.floors[fi].running || 0) + 1;
          machine.stockQty = machine.floors.reduce(
            (t, f) => t + (f.running || 0) + (f.idle || 0) + (f.repairable || 0), 0
          );
          await machine.save();
        }
      }

      layout.processes.push({
        serialNo,
        processName,
        machineType,
        machines: machinesSelected || [],
      });

      await layout.save();
      // Return fresh lean copy so _id fields are plain strings
      const updated = await lineLayoutModel.findById(id).lean();
      return NextResponse.json({ success: true, data: updated });
    }

    // ── REMOVE PROCESS ───────────────────────────────────────────────────────
    if (action === "remove_process") {
      const { processId, wasteFloor } = body;
      const entry = layout.processes.id(processId);
      if (!entry) return NextResponse.json({ success: false, message: "Process not found" }, { status: 404 });

      // Restore idle for each machine — either to wasteFloor or original floor
      for (const sel of entry.machines || []) {
        const machine = await machineModel.findById(sel.machineId);
        if (!machine) continue;

        // Decrement running from original floor
        const fi = machine.floors.findIndex((f) => f.floorName === sel.fromFloor);
        if (fi >= 0) {
          machine.floors[fi].running = Math.max(0, (machine.floors[fi].running || 0) - 1);
        }

        // Add idle to wasteFloor (or original floor if no wasteFloor)
        const targetFloor = wasteFloor || sel.fromFloor;
        const ti = machine.floors.findIndex((f) => f.floorName === targetFloor);
        if (ti >= 0) {
          machine.floors[ti].idle = (machine.floors[ti].idle || 0) + 1;
        } else if (wasteFloor) {
          // Floor doesn't exist yet on this machine — create it
          machine.floors.push({ floorName: wasteFloor, running: 0, idle: 1, repairable: 0, damage: 0 });
        } else if (fi >= 0) {
          // fallback: restore idle to original
          machine.floors[fi].idle = (machine.floors[fi].idle || 0) + 1;
        }

        machine.stockQty = machine.floors.reduce(
          (t, f) => t + (f.running || 0) + (f.idle || 0) + (f.repairable || 0), 0
        );
        await machine.save();
      }

      layout.processes.pull({ _id: processId });
      await layout.save();

      const updated = await lineLayoutModel.findById(id).lean();
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

// DELETE /api/line-layouts/[id]
export async function DELETE(_, context) {
  try {
    await dbConnect();
    const { id } = await context.params; // ✅ await params
    await lineLayoutModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}