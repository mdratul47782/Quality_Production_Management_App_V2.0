// app/api/line-layouts/[id]/route.js
import { NextResponse } from "next/server";
import { dbConnect }       from "@/services/mongo";
import { lineLayoutModel } from "@/models/lineLayout-model";
import { machineModel }    from "@/models/machine-model";

// ── Helper: mark machine units Running / Idle in inventory ────────────────────
// wasteFloor: optional — if provided, also moves the unit to that floor
async function updateMachineStatuses(entries, newStatus, wasteFloor = null) {
  if (!entries || entries.length === 0) return;
  for (const entry of entries) {
    if (!entry.serialNumber) continue;
    try {
      const machine = await machineModel.findById(entry.machineId);
      if (!machine) continue;
      const unitIdx = machine.units.findIndex(
        (u) => u.serialNumber === entry.serialNumber
      );
      if (unitIdx < 0) continue;
      machine.units[unitIdx].status = newStatus;
      // ← KEY FIX: move the unit to the waste floor when specified
      if (wasteFloor) {
        machine.units[unitIdx].floorName = wasteFloor;
      }
      await machine.save();
    } catch (e) {
      console.warn("updateMachineStatuses warning:", e.message);
    }
  }
}

function calcTargets(smv, eff, operator, hours) {
  const e = (parseFloat(eff) || 0) / 100;
  const s = parseFloat(smv) || 0;
  const o = parseInt(operator) || 0;
  const h = parseInt(hours) || 8;
  const oneHour = s > 0 ? Math.round((60 / s) * e * o) : 0;
  return { oneHourTarget: oneHour, dailyTarget: Math.max(0, oneHour * h - 2) };
}

// ── GET /api/line-layouts/[id] ────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;                          // ← await params
    const layout = await lineLayoutModel.findById(id).lean();
    if (!layout)
      return NextResponse.json({ success: false, message: "Layout পাওয়া যায়নি।" }, { status: 404 });
    return NextResponse.json({ success: true, data: layout });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── DELETE /api/line-layouts/[id] ─────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;                          // ← await params
    const layout = await lineLayoutModel.findById(id);
    if (!layout)
      return NextResponse.json({ success: false, message: "Layout পাওয়া যায়নি।" }, { status: 404 });

    // Return all machine serials to Idle (at their current floor) before deleting
    for (const proc of layout.processes || []) {
      await updateMachineStatuses(
        (proc.machines || []).map((m) => ({
          machineId:    m.machineId,
          serialNumber: m.serialNumber,
        })),
        "Idle"
        // no wasteFloor here — machines stay at whatever floor they are on
      );
    }

    await lineLayoutModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Layout মুছে ফেলা হয়েছে।" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── PATCH /api/line-layouts/[id] ──────────────────────────────────────────────
export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;                          // ← await params
    const body   = await request.json();
    const layout = await lineLayoutModel.findById(id);
    if (!layout)
      return NextResponse.json({ success: false, message: "Layout পাওয়া যায়নি।" }, { status: 404 });

    // ── ACTION: add_process ──────────────────────────────────────────────────
    if (body.action === "add_process") {
      const { serialNo, processName, machineType, machinesSelected } = body;

      if (machinesSelected && machinesSelected.length > 0) {
        await updateMachineStatuses(
          machinesSelected.map((m) => ({
            machineId:    m.machineId,
            serialNumber: m.serialNumber,
          })),
          "Running"
        );
      }

      layout.processes.push({
        serialNo,
        processName,
        machineType,
        machines: (machinesSelected || []).map((m) => ({
          machineId:    m.machineId    || null,
          machineName:  m.machineName  || "",
          fromFloor:    m.fromFloor    || "",
          serialNumber: m.serialNumber || "",
        })),
      });

      await layout.save();
      return NextResponse.json({ success: true, data: layout });
    }

    // ── ACTION: remove_process (waste) ───────────────────────────────────────
    if (body.action === "remove_process") {
      const { processId, wasteFloor } = body;
      const proc = layout.processes.find((p) => String(p._id) === processId);

      if (proc) {
        // wasteFloor passed so the unit moves to the selected floor, not stays at original
        await updateMachineStatuses(
          (proc.machines || []).map((m) => ({
            machineId:    m.machineId,
            serialNumber: m.serialNumber,
          })),
          "Idle",
          wasteFloor || null
        );
        layout.processes = layout.processes.filter((p) => String(p._id) !== processId);
      }

      await layout.save();
      return NextResponse.json({ success: true, data: layout });
    }

    // ── ACTION: edit_process ─────────────────────────────────────────────────
    if (body.action === "edit_process") {
      const {
        processId, serialNo, processName, machineType,
        oldMachines, newMachines, machineChanged,
      } = body;

      const procIdx = layout.processes.findIndex((p) => String(p._id) === processId);
      if (procIdx < 0)
        return NextResponse.json({ success: false, message: "Process পাওয়া যায়নি।" }, { status: 404 });

      if (machineChanged) {
        await updateMachineStatuses(
          (oldMachines || []).map((m) => ({
            machineId:    m.machineId,
            serialNumber: m.serialNumber,
          })),
          "Idle"
        );
        if (newMachines && newMachines.length > 0) {
          await updateMachineStatuses(
            newMachines.map((m) => ({
              machineId:    m.machineId,
              serialNumber: m.serialNumber,
            })),
            "Running"
          );
        }
        layout.processes[procIdx].machines = (newMachines || []).map((m) => ({
          machineId:    m.machineId    || null,
          machineName:  m.machineName  || "",
          fromFloor:    m.fromFloor    || "",
          serialNumber: m.serialNumber || "",
        }));
      }

      layout.processes[procIdx].serialNo    = serialNo    ?? layout.processes[procIdx].serialNo;
      layout.processes[procIdx].processName = processName ?? layout.processes[procIdx].processName;
      layout.processes[procIdx].machineType = machineType ?? layout.processes[procIdx].machineType;

      await layout.save();
      return NextResponse.json({ success: true, data: layout });
    }

    // ── ACTION: update_header ────────────────────────────────────────────────
    if (body.action === "update_header") {
      const {
        buyer, style, item, smv, planEfficiency,
        operator, helper, seamSealing, workingHours,
      } = body;
      const manpower = (parseInt(operator)||0) + (parseInt(helper)||0) + (parseInt(seamSealing)||0);
      const { oneHourTarget, dailyTarget } = calcTargets(smv, planEfficiency, operator, workingHours);

      Object.assign(layout, {
        buyer, style, item,
        smv:            parseFloat(smv)            || 0,
        planEfficiency: parseFloat(planEfficiency) || 0,
        operator:       parseInt(operator)         || 0,
        helper:         parseInt(helper)           || 0,
        seamSealing:    parseInt(seamSealing)      || 0,
        workingHours:   parseInt(workingHours)     || 8,
        manpower, oneHourTarget, dailyTarget,
      });

      await layout.save();
      return NextResponse.json({ success: true, data: layout });
    }

    // ── ACTION: reorder_serial ───────────────────────────────────────────────
    if (body.action === "reorder_serial") {
      const { updates } = body;
      updates.forEach(({ processId, serialNo }) => {
        const p = layout.processes.find((x) => String(x._id) === processId);
        if (p) p.serialNo = serialNo;
      });
      await layout.save();
      return NextResponse.json({ success: true, data: layout });
    }

    // ── ACTION: swap_serial ──────────────────────────────────────────────────
    if (body.action === "swap_serial") {
      const { fromId, fromSerial, toId, toSerial } = body;
      const fromProc = layout.processes.find((p) => String(p._id) === fromId);
      const toProc   = layout.processes.find((p) => String(p._id) === toId);
      if (fromProc) fromProc.serialNo = toSerial;
      if (toProc)   toProc.serialNo   = fromSerial;
      await layout.save();
      return NextResponse.json({ success: true, data: layout });
    }

    // ── ACTION: move_to_slot ─────────────────────────────────────────────────
    if (body.action === "move_to_slot") {
      const { processId, newSerial } = body;
      const proc = layout.processes.find((p) => String(p._id) === processId);
      if (proc) proc.serialNo = newSerial;
      await layout.save();
      return NextResponse.json({ success: true, data: layout });
    }

    return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });

  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}