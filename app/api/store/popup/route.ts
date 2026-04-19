import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { sitePopups } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
export const revalidate = 0;

// Public endpoint — returns the currently active popup (one per type)
export async function GET() {
  try {
    const activePopups = await db
      .select()
      .from(sitePopups)
      .where(eq(sitePopups.isActive, true));

    // Separate by type, return active ad and active maintenance
    const ad = activePopups.find((p) => p.type === "ad") || null;
    const maintenance = activePopups.find((p) => p.type === "maintenance") || null;

    return NextResponse.json({ success: true, data: { ad, maintenance } });
  } catch (error: any) {
    console.error("GET Store Popup Error:", error);
    return NextResponse.json({ error: "Failed to fetch popup" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
