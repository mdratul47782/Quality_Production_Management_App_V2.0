// app/api/line-layouts/[id]/route.js
import { NextResponse } from "next/server";
import { dbConnect }       from "@/services/mongo";
import { lineLayoutModel } from "@/models/lineLayout-model";
import { machineModel }    from "@/models/machine-model";

// ── Helper: mark machine units Running / Idle in inventory ────────────────────
// floorOverride: when provided, also moves the unit's floorName to that floor.
//   • For "Running" → pass the layout's floor so A4 machine shows as Running on A2
//   • For "Idle" (waste) → pass the wasteFloor so it shows Idle on the waste floor
//   • For "Idle" (delete/no floor change) → pass null to keep machine on its current floor
async function updateMachineStatuses(entries, newStatus, floorOverride = null) {
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
      if (floorOverride) {
        machine.units[unitIdx].floorName = floorOverride;
      }
      await machine.save();
    } catch (e) {
      console.warn("updateMachineStatuses warning:", e.message);
    }
  }
}

// FIX: correct formula — manpower = operator + helper + seamSealing
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

// ── GET /api/line-layouts/[id] ────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
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
    const { id } = await params;
    const layout = await lineLayoutModel.findById(id);
    if (!layout)
      return NextResponse.json({ success: false, message: "Layout পাওয়া যায়নি।" }, { status: 404 });

    for (const proc of layout.processes || []) {
      // FIX: restore each machine to its original floor (fromFloor) when layout is deleted
      for (const m of (proc.machines || [])) {
        await updateMachineStatuses(
          [{ machineId: m.machineId, serialNumber: m.serialNumber }],
          "Idle",
          m.fromFloor || null
        );
      }
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
    const { id } = await params;
    const body   = await request.json();
    const layout = await lineLayoutModel.findById(id);
    if (!layout)
      return NextResponse.json({ success: false, message: "Layout পাওয়া যায়নি।" }, { status: 404 });

    // ── ACTION: add_process ──────────────────────────────────────────────────
    if (body.action === "add_process") {
      const { serialNo, processName, machineType, machinesSelected } = body;

      if (machinesSelected && machinesSelected.length > 0) {
        // FIX: pass layout.floor so floorName moves to the layout floor (e.g. A2),
        // not stays on the source floor (e.g. A4). Inventory shows Running on A2 correctly.
        await updateMachineStatuses(
          machinesSelected.map((m) => ({
            machineId:    m.machineId,
            serialNumber: m.serialNumber,
          })),
          "Running",
          layout.floor
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
        // FIX: restore each old machine to its original fromFloor, not leave on layout floor
        for (const m of (oldMachines || [])) {
          await updateMachineStatuses(
            [{ machineId: m.machineId, serialNumber: m.serialNumber }],
            "Idle",
            m.fromFloor || null
          );
        }
        if (newMachines && newMachines.length > 0) {
          // FIX: same as add_process — move floorName to layout floor when Running
          await updateMachineStatuses(
            newMachines.map((m) => ({
              machineId:    m.machineId,
              serialNumber: m.serialNumber,
            })),
            "Running",
            layout.floor
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
    // FIX: use correct formula, accept sketchUrl for image updates
    if (body.action === "update_header") {
      const {
        buyer, style, item,
        smv, planEfficiency,
        operator, helper, seamSealing,
        workingHours,
        sketchUrl,   // ← NEW: optional image url from upload
      } = body;

      // FIX: use the corrected calcTargets (manpower includes helper + seamSealing)
      const { manpower, oneHourTarget, dailyTarget } = calcTargets(
        smv, planEfficiency, operator, helper, seamSealing, workingHours
      );

      Object.assign(layout, {
        buyer,
        style,
        item,
        smv:            parseFloat(smv)            || 0,
        planEfficiency: parseFloat(planEfficiency) || 0,
        operator:       parseInt(operator)         || 0,
        helper:         parseInt(helper)           || 0,
        seamSealing:    parseInt(seamSealing)      || 0,
        workingHours:   parseInt(workingHours)     || 8,
        manpower,
        oneHourTarget,
        dailyTarget,
        // Only update sketchUrl if a value was passed (empty string clears it, undefined keeps old)
        ...(sketchUrl !== undefined ? { sketchUrl } : {}),
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