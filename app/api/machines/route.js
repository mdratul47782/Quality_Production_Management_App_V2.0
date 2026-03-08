// app/api/machines/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/services/mongo";
import { machineModel } from "@/models/machine-model";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (name) {
      const machine = await machineModel.findOne({ machineName: name }).lean();
      if (!machine) {
        return NextResponse.json({ success: false, data: null }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: machine });
    }

    const machines = await machineModel.find({}).lean();
    return NextResponse.json({
      success: true,
      data: machines ?? [], // ✅ safe fallback
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to fetch" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { machineName, floorName, running, idle, repairable, damage } = body;

    if (!machineName || !floorName) {
      return NextResponse.json(
        { success: false, message: "machineName এবং floorName দেওয়া আবশ্যক।" },
        { status: 400 }
      );
    }

    // ✅ Stock = Running + Idle + Repairable (damage NOT subtracted)
    function calcStockQty(floors) {
      return floors.reduce((total, f) => {
        return total + (f.running ?? 0) + (f.idle ?? 0) + (f.repairable ?? 0);
      }, 0);
    }

    let machine = await machineModel.findOne({ machineName });

    if (!machine) {
      const floors = [
        {
          floorName,
          running:    running    ?? 0,
          idle:       idle       ?? 0,
          repairable: repairable ?? 0,
          damage:     damage     ?? 0,
        },
      ];
      machine = await machineModel.create({
        machineName,
        stockQty: calcStockQty(floors),
        floors,
      });
      return NextResponse.json(
        { success: true, message: "Machine তৈরি হয়েছে।", data: machine },
        { status: 201 }
      );
    }

    const floorIndex = machine.floors.findIndex((f) => f.floorName === floorName);

    if (floorIndex >= 0) {
      machine.floors[floorIndex].running    = running    ?? machine.floors[floorIndex].running;
      machine.floors[floorIndex].idle       = idle       ?? machine.floors[floorIndex].idle;
      machine.floors[floorIndex].repairable = repairable ?? machine.floors[floorIndex].repairable;
      machine.floors[floorIndex].damage     = damage     ?? machine.floors[floorIndex].damage;
    } else {
      machine.floors.push({
        floorName,
        running:    running    ?? 0,
        idle:       idle       ?? 0,
        repairable: repairable ?? 0,
        damage:     damage     ?? 0,
      });
    }

    // ✅ Always recalculate across ALL floors server-side
    machine.stockQty = calcStockQty(machine.floors);

    await machine.save();
    return NextResponse.json({
      success: true,
      message: "Machine আপডেট হয়েছে।",
      data: machine,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to save" },
      { status: 500 }
    );
  }
}