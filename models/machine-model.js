// models/machine-model.js
import mongoose from "mongoose";

const floorSchema = new mongoose.Schema(
  {
    floorName: { type: String, required: true },
    running: { type: Number, default: 0 },
    idle: { type: Number, default: 0 },
    repairable: { type: Number, default: 0 },
    damage: { type: Number, default: 0 },
  },
  { _id: false }
);

const machineSchema = new mongoose.Schema(
  {
    machineName: { type: String, required: true },
    stockQty: { type: Number, required: true, default: 0 },
    floors: { type: [floorSchema], default: [] },
  },
  { timestamps: true }
);

export const machineModel =
  mongoose.models.Machine || mongoose.model("Machine", machineSchema);