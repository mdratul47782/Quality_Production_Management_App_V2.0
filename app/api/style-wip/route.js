// app/api/style-wip/route.js
import { dbConnect } from "@/services/mongo";
import TargetSetterHeader from "@/models/TargetSetterHeader";
import { HourlyProductionModel } from "@/models/HourlyProduction-model";
import { StyleCapacityModel } from "@/models/StyleCapacity-model";
export const dynamic = "force-dynamic";

function toNumberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Normalise any date value to "YYYY-MM-DD" string.
 * Handles both full ISO strings ("2024-01-15T00:00:00.000Z") and plain
 * date strings ("2024-01-15") that may be stored in MongoDB.
 */
function toDateString(value) {
  if (!value) return "";
  // Already a plain date string
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  // Full ISO string or Date object
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
}

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    const factory           = searchParams.get("factory");
    const assigned_building = searchParams.get("assigned_building");
    const line              = searchParams.get("line");
    const buyer             = searchParams.get("buyer");
    const style             = searchParams.get("style");
    const color_model       = searchParams.get("color_model") || null;
    const dateParam         = searchParams.get("date"); // "YYYY-MM-DD"

    if (!factory || !assigned_building || !line || !buyer || !style || !dateParam) {
      return Response.json(
        {
          success: false,
          message:
            "factory, assigned_building, line, buyer, style, date are all required",
        },
        { status: 400 }
      );
    }

    // Normalise the incoming date param just in case
    const date = toDateString(dateParam);

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1 — Capacity doc
    // color_model is intentionally excluded from the capacity key so that
    // one capacity covers the entire style regardless of color.
    // If you want per-color capacity, include color_model here too.
    // ─────────────────────────────────────────────────────────────────────────
    const capacityQuery = { factory, assigned_building, line, buyer, style };
    // NOTE: Do NOT add color_model here unless StyleCapacityModel stores it per-color.

    const capacityDoc = await StyleCapacityModel.findOne(capacityQuery).lean();
    const capacity    = capacityDoc ? toNumberOrZero(capacityDoc.capacity) : 0;

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2 — Fetch ALL headers for this style up to `date`
    //
    // FIX: We fetch without a date filter first, then normalise & filter in JS.
    // This avoids the string/ISO mismatch that caused $lte to silently fail.
    // ─────────────────────────────────────────────────────────────────────────
    const headerFilter = {
      factory,
      assigned_building,
      line,
      buyer,
      style,
    };
    if (color_model) headerFilter.color_model = color_model;

    // Fetch without date filter — filter in JS after normalising dates
    const allHeadersRaw = await TargetSetterHeader.find(headerFilter)
      .select("_id date run_day color_model")
      .lean();

    // Normalise and filter: only headers whose date <= `date`
    const allHeaders = allHeadersRaw
      .map((h) => ({ ...h, _dateStr: toDateString(h.date) }))
      .filter((h) => h._dateStr <= date)
      .sort((a, b) => (a._dateStr > b._dateStr ? -1 : 1)); // newest first

    if (!allHeaders.length) {
      return Response.json(
        {
          success: true,
          data: {
            factory,
            capacity,
            totalAchieved: 0,
            wip: capacity,
            rawWip: capacity,
            capacityId: capacityDoc?._id || null,
            debug: { reason: "no headers found up to date", date, color_model },
          },
        },
        { status: 200 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3 — Detect current cycle start (most recent run_day = 1)
    // ─────────────────────────────────────────────────────────────────────────
    let cycleStartDate = null;

    for (const h of allHeaders) {
      if (toNumberOrZero(h.run_day) === 1) {
        cycleStartDate = h._dateStr;
        break;
      }
    }

    // Fallback: no run_day=1 → use the oldest header's date
    if (!cycleStartDate) {
      cycleStartDate = allHeaders[allHeaders.length - 1]._dateStr;
    }

    // Only headers inside the current cycle
    const cycleHeaders   = allHeaders.filter((h) => h._dateStr >= cycleStartDate);
    const cycleHeaderIds = cycleHeaders.map((h) => h._id);

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4 — Sum achievedQty from current-cycle headers ONLY
    // ─────────────────────────────────────────────────────────────────────────
    let totalAchieved = 0;

    if (cycleHeaderIds.length > 0) {
      const agg = await HourlyProductionModel.aggregate([
        { $match: { headerId: { $in: cycleHeaderIds } } },
        { $group: { _id: null, totalAchieved: { $sum: "$achievedQty" } } },
      ]);

      if (agg.length > 0) {
        totalAchieved = toNumberOrZero(agg[0].totalAchieved);
      }
    }

    const rawWip = capacity - totalAchieved;
    const wip    = Math.max(rawWip, 0);

    return Response.json(
      {
        success: true,
        data: {
          factory,
          capacity,
          totalAchieved,
          wip,
          rawWip,
          capacityId:       capacityDoc?._id || null,
          cycleStartDate,
          cycleHeaderCount: cycleHeaderIds.length,
          // debug info — remove in production if desired
          debug: {
            date,
            color_model,
            allHeaderCount:   allHeaders.length,
            cycleHeaderCount: cycleHeaderIds.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/style-wip error:", error);
    return Response.json(
      { success: false, message: "Failed to calculate style WIP" },
      { status: 500 }
    );
  }
}