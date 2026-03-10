// app/api/line-layouts/[id]/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/services/mongo";
import { lineLayoutModel } from "@/models/lineLayout-model";
import { machineModel }    from "@/models/machine-model";

// GET /api/line-layouts/[id]
export async function GET(_, context) {
  try {
    await dbConnect();
    const { id } = await context.params;
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

      if (buyer          !== undefined) layout.buyer          = buyer;
      if (style          !== undefined) layout.style          = style;
      if (item           !== undefined) layout.item           = item;
      if (smv            !== undefined) layout.smv            = parseFloat(smv)            || layout.smv;
      if (planEfficiency !== undefined) layout.planEfficiency = parseFloat(planEfficiency) || layout.planEfficiency;
      if (operator       !== undefined) layout.operator       = parseInt(operator)         || 0;
      if (helper         !== undefined) layout.helper         = parseInt(helper)           || 0;
      if (seamSealing    !== undefined) layout.seamSealing    = parseInt(seamSealing)      || 0;
      if (workingHours   !== undefined) layout.workingHours   = parseInt(workingHours)     || 8;

      layout.manpower      = (layout.operator || 0) + (layout.helper || 0) + (layout.seamSealing || 0);
      const eff            = (layout.planEfficiency || 0) / 100;
      const s              = layout.smv || 0;
      layout.oneHourTarget = s > 0 ? Math.round((60 / s) * eff * (layout.operator || 0)) : 0;
      layout.dailyTarget   = Math.max(0, layout.oneHourTarget * (layout.workingHours || 8) - 2);

      await layout.save();
      const updated = await lineLayoutModel.findById(id).lean();
      return NextResponse.json({ success: true, data: updated });
    }

    // ── REORDER SERIAL ───────────────────────────────────────────────────────
    if (action === "reorder_serial") {
      // body.updates = [{ processId, serialNo }]
      // Client already sends clean 1-based consecutive serials after drag
      const { updates } = body;
      for (const { processId, serialNo } of updates || []) {
        const entry = layout.processes.id(processId);
        if (entry) entry.serialNo = serialNo;
      }
      await layout.save();
      const updated = await lineLayoutModel.findById(id).lean();
      return NextResponse.json({ success: true, data: updated });
    }

    // ── MOVE TO SLOT (move one process into a serial slot) ──────────────────
    if (action === "move_to_slot") {
      const { processId, newSerial } = body;
      const entry = layout.processes.id(processId);
      if (!entry)
        return NextResponse.json({ success: false, message: "Process not found" }, { status: 404 });

      // Multiple processes can share a serial — no conflict check needed
      entry.serialNo = newSerial;
      await layout.save();
      const updated = await lineLayoutModel.findById(id).lean();
      return NextResponse.json({ success: true, data: updated });
    }

    // ── SWAP SERIAL (two processes exchange their serial numbers) ────────────
    if (action === "swap_serial") {
      const { fromId, fromSerial, toId, toSerial } = body;
      const fromEntry = layout.processes.id(fromId);
      const toEntry   = layout.processes.id(toId);
      if (!fromEntry || !toEntry)
        return NextResponse.json({ success: false, message: "Process not found" }, { status: 404 });

      fromEntry.serialNo = toSerial;
      toEntry.serialNo   = fromSerial;

      await layout.save();
      const updated = await lineLayoutModel.findById(id).lean();
      return NextResponse.json({ success: true, data: updated });
    }

    // ── EDIT PROCESS ─────────────────────────────────────────────────────────
    if (action === "edit_process") {
      const { processId, serialNo, processName, machineType,
              machineChanged, oldMachines, newMachines } = body;

      const entry = layout.processes.id(processId);
      if (!entry)
        return NextResponse.json({ success: false, message: "Process not found" }, { status: 404 });

      // ── If machine type changed: return old machines → inventory, assign new ─
      if (machineChanged) {
        // 1. Return old machines to inventory (running→idle at their fromFloor)
        for (const sel of oldMachines || []) {
          const machine = await machineModel.findById(sel.machineId);
          if (!machine) continue;
          const fi = machine.floors.findIndex((f) => f.floorName === sel.fromFloor);
          if (fi >= 0) {
            machine.floors[fi].running = Math.max(0, (machine.floors[fi].running || 0) - 1);
            machine.floors[fi].idle    = (machine.floors[fi].idle || 0) + 1;
          }
          machine.stockQty = machine.floors.reduce(
            (t, f) => t + (f.running || 0) + (f.idle || 0) + (f.repairable || 0), 0
          );
          await machine.save();
        }

        // 2. Take new machines from inventory (idle→running at their fromFloor)
        for (const sel of newMachines || []) {
          const machine = await machineModel.findById(sel.machineId);
          if (!machine) continue;
          const fi = machine.floors.findIndex((f) => f.floorName === sel.fromFloor);
          if (fi >= 0 && machine.floors[fi].idle > 0) {
            machine.floors[fi].idle    = Math.max(0, machine.floors[fi].idle - 1);
            machine.floors[fi].running = (machine.floors[fi].running || 0) + 1;
          }
          machine.stockQty = machine.floors.reduce(
            (t, f) => t + (f.running || 0) + (f.idle || 0) + (f.repairable || 0), 0
          );
          await machine.save();
        }

        // 3. Update process machines list
        entry.machines = newMachines || [];
      }
      // else: machines stay exactly as they were

      if (serialNo    !== undefined) entry.serialNo    = Number(serialNo);
      if (processName !== undefined) entry.processName = processName;
      if (machineType !== undefined) entry.machineType = machineType;

      await layout.save();
      const updated = await lineLayoutModel.findById(id).lean();
      return NextResponse.json({ success: true, data: updated });
    }

    // ── ADD PROCESS ──────────────────────────────────────────────────────────
    if (action === "add_process") {
      const { serialNo, processName, machineType, machinesSelected } = body;

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

      layout.processes.push({ serialNo, processName, machineType, machines: machinesSelected || [] });
      await layout.save();

      const updated = await lineLayoutModel.findById(id).lean();
      return NextResponse.json({ success: true, data: updated });
    }

    // ── REMOVE PROCESS ───────────────────────────────────────────────────────
    if (action === "remove_process") {
      const { processId, wasteFloor } = body;
      const entry = layout.processes.id(processId);
      if (!entry) return NextResponse.json({ success: false, message: "Process not found" }, { status: 404 });

      for (const sel of entry.machines || []) {
        const machine = await machineModel.findById(sel.machineId);
        if (!machine) continue;

        const fi = machine.floors.findIndex((f) => f.floorName === sel.fromFloor);
        if (fi >= 0) {
          machine.floors[fi].running = Math.max(0, (machine.floors[fi].running || 0) - 1);
        }

        const targetFloor = wasteFloor || sel.fromFloor;
        const ti = machine.floors.findIndex((f) => f.floorName === targetFloor);
        if (ti >= 0) {
          machine.floors[ti].idle = (machine.floors[ti].idle || 0) + 1;
        } else if (wasteFloor) {
          machine.floors.push({ floorName: wasteFloor, running: 0, idle: 1, repairable: 0, damage: 0 });
        } else if (fi >= 0) {
          machine.floors[fi].idle = (machine.floors[fi].idle || 0) + 1;
        }

        machine.stockQty = machine.floors.reduce(
          (t, f) => t + (f.running || 0) + (f.idle || 0) + (f.repairable || 0), 0
        );
        await machine.save();
      }

      layout.processes.pull({ _id: processId });

      // Serial numbers stay as-is after delete — gaps are intentional.
      // User can fill the gap by adding a new process with that serial number.

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
    const { id } = await context.params;
    await lineLayoutModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}