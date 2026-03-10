// models/lineLayout-model.js
import mongoose from "mongoose";

const processEntrySchema = new mongoose.Schema({
  serialNo:    { type: Number, required: true },
  processName: { type: String, required: true },
  machineType: { type: String, required: true },
  machines: [
    {
      machineId:   { type: mongoose.Schema.Types.ObjectId, ref: "Machine" },
      machineName: { type: String },
      fromFloor:   { type: String },
    },
  ],
});

const lineLayoutSchema = new mongoose.Schema(
  {
    factory:        { type: String, default: "" },   // e.g. "K-2"
    floor:          { type: String, required: true },
    lineNo:         { type: String, required: true },
    buyer:          { type: String, required: true },
    style:          { type: String },
    item:           { type: String },
    smv:            { type: Number },
    planEfficiency: { type: Number },   // 0–100
    operator:       { type: Number, default: 0 },
    helper:         { type: Number, default: 0 },
    seamSealing:    { type: Number, default: 0 },
    manpower:       { type: Number, default: 0 },
    workingHours:   { type: Number, default: 8 },
    oneHourTarget:  { type: Number, default: 0 },
    dailyTarget:    { type: Number, default: 0 },
    sketchUrl:      { type: String, default: "" },
    processes:      { type: [processEntrySchema], default: [] },
  },
  { timestamps: true }
);

export const lineLayoutModel =
  mongoose.models.LineLayout ||
  mongoose.model("LineLayout", lineLayoutSchema);