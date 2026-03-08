// app/api/machines/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/services/mongo";
import { machineModel } from "@/models/machine-model";

// GET /api/machines?name=SINGLE NDL (PLAIN M/C)
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
    return NextResponse.json({ success: true, data: machines });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to fetch" },
      { status: 500 }
    );
  }
}

// POST /api/machines — create or upsert floor data
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { machineName, stockQty, floorName, running, idle, repairable, damage } = body;

    if (!machineName || !floorName) {
      return NextResponse.json(
        { success: false, message: "machineName এবং floorName দেওয়া আবশ্যক।" },
        { status: 400 }
      );
    }

    // Find existing machine
    let machine = await machineModel.findOne({ machineName });

    if (!machine) {
      // Create new machine with this floor
      machine = await machineModel.create({
        machineName,
        stockQty: stockQty ?? 0,
        floors: [
          {
            floorName,
            running: running ?? 0,
            idle: idle ?? 0,
            repairable: repairable ?? 0,
            damage: damage ?? 0,
          },
        ],
      });
      return NextResponse.json(
        { success: true, message: "Machine তৈরি হয়েছে।", data: machine },
        { status: 201 }
      );
    }

    // Update stock qty
    if (stockQty !== undefined) {
      machine.stockQty = stockQty;
    }

    // Check if floor already exists
    const floorIndex = machine.floors.findIndex((f) => f.floorName === floorName);

    if (floorIndex >= 0) {
      // Update existing floor
      machine.floors[floorIndex].running = running ?? machine.floors[floorIndex].running;
      machine.floors[floorIndex].idle = idle ?? machine.floors[floorIndex].idle;
      machine.floors[floorIndex].repairable = repairable ?? machine.floors[floorIndex].repairable;
      machine.floors[floorIndex].damage = damage ?? machine.floors[floorIndex].damage;
    } else {
      // Add new floor entry
      machine.floors.push({
        floorName,
        running: running ?? 0,
        idle: idle ?? 0,
        repairable: repairable ?? 0,
        damage: damage ?? 0,
      });
    }

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