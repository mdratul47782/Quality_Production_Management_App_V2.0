// app/api/machines/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/services/mongo";
import { machineModel } from "@/models/machine-model";

// ─── Floor name normalization ─────────────────────────────────────────────────
// Ensures whatever the client sends, we always store the canonical form
// that matches FLOOR_COLS dbKey in MachineInventoryTable.
const FLOOR_NORMALIZE_MAP = {
  // without dash → with dash
  "a2": "A-2", "a-2": "A-2", "A2": "A-2",
  "b2": "B-2", "b-2": "B-2", "B2": "B-2",
  "a3": "A-3", "a-3": "A-3", "A3": "A-3",
  "b3": "B-3", "b-3": "B-3", "B3": "B-3",
  "a4": "A-4", "a-4": "A-4", "A4": "A-4",
  "b4": "B-4", "b-4": "B-4", "B4": "B-4",
  "a5": "A-5", "a-5": "A-5", "A5": "A-5",
  "b5": "B-5", "b-5": "B-5", "B5": "B-5",
  "a6": "A-6", "a-6": "A-6", "A6": "A-6",      // ← was missing
  "b6": "B-6", "b-6": "B-6", "B6": "B-6",      // ← was missing
  "c4": "C-4", "c-4": "C-4", "C4": "C-4",      // ← was missing
  "k3": "K-3", "k-3": "K-3", "K3": "K-3",      // ← was missing
  // SMD/CAD variants
  "smd/cad": "SMD/CAD",
  "smd/Cad": "SMD/CAD",
  "SMD/Cad": "SMD/CAD",
  "smdcad":  "SMD/CAD",
  "SMDCAD":  "SMD/CAD",
  // others pass through as-is
};

function normalizeFloor(raw) {
  if (!raw) return raw;
  const trimmed = raw.trim();
  // Check exact match first, then lowercase match
  return FLOOR_NORMALIZE_MAP[trimmed]
      ?? FLOOR_NORMALIZE_MAP[trimmed.toLowerCase()]
      ?? trimmed;   // "Others", "New", already-canonical values pass through
}

// ─── GET /api/machines?factory=K-2&name=SINGLE+NDL ───────────────────────────
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const name    = searchParams.get("name");
    const factory = searchParams.get("factory");

    if (name) {
      const query = { machineName: name };
      if (factory) query.factory = factory;
      const machine = await machineModel.findOne(query).lean();
      if (!machine)
        return NextResponse.json({ success: false, data: null }, { status: 404 });
      return NextResponse.json({ success: true, data: machine });
    }

    // List all — optionally filter by factory
    const query = {};
    if (factory) query.factory = factory;
    const machines = await machineModel.find(query).lean();
    return NextResponse.json({ success: true, data: machines ?? [] });

  } catch (err) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to fetch" },
      { status: 500 }
    );
  }
}

// ─── POST /api/machines  — create or upsert floor data ───────────────────────
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { factory, machineName, running, idle, repairable, damage } = body;

    // ← Normalize floor name before anything else
    const floorName = normalizeFloor(body.floorName);

    if (!machineName || !floorName) {
      return NextResponse.json(
        { success: false, message: "machineName এবং floorName দেওয়া আবশ্যক।" },
        { status: 400 }
      );
    }

    function calcStockQty(floors) {
      return floors.reduce(
        (total, f) => total + (f.running ?? 0) + (f.idle ?? 0) + (f.repairable ?? 0),
        0
      );
    }

    const matchQuery = { machineName };
    if (factory) matchQuery.factory = factory;

    let machine = await machineModel.findOne(matchQuery);

    if (!machine) {
      // Create new machine document
      const floors = [{
        floorName,
        running:    running    ?? 0,
        idle:       idle       ?? 0,
        repairable: repairable ?? 0,
        damage:     damage     ?? 0,
      }];
      machine = await machineModel.create({
        factory:  factory || "",
        machineName,
        stockQty: calcStockQty(floors),
        floors,
      });
      return NextResponse.json(
        { success: true, message: "Machine তৈরি হয়েছে।", data: machine },
        { status: 201 }
      );
    }

    // Upsert floor within existing machine
    const fi = machine.floors.findIndex((f) => f.floorName === floorName);
    if (fi >= 0) {
      machine.floors[fi].running    = running    ?? machine.floors[fi].running;
      machine.floors[fi].idle       = idle       ?? machine.floors[fi].idle;
      machine.floors[fi].repairable = repairable ?? machine.floors[fi].repairable;
      machine.floors[fi].damage     = damage     ?? machine.floors[fi].damage;
    } else {
      machine.floors.push({
        floorName,
        running:    running    ?? 0,
        idle:       idle       ?? 0,
        repairable: repairable ?? 0,
        damage:     damage     ?? 0,
      });
    }

    machine.stockQty = calcStockQty(machine.floors);
    await machine.save();
    return NextResponse.json({ success: true, message: "Machine আপডেট হয়েছে।", data: machine });

  } catch (err) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to save" },
      { status: 500 }
    );
  }
}