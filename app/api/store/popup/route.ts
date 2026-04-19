import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { sitePopups } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
export const revalidate = 0;

// Public endpoint — returns the currently active popup (one per type)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path") || "/";

    const activePopups = await db
      .select()
      .from(sitePopups)
      .where(eq(sitePopups.isActive, true));

    // Filter by path matching
    const matchedPopups = activePopups.filter((p) => {
      if (p.targetPaths === "*") return true;
      const paths = p.targetPaths.split(",").map((x) => x.trim());
      // Simple startsWith or exact match? Let's use exact match or startsWith
      return paths.some(pt => path === pt || (pt !== "/" && path.startsWith(pt)));
    });

    // Separate by type, return active ad and active maintenance
    const ad = matchedPopups.find((p) => p.type === "ad") || null;
    const maintenance = matchedPopups.find((p) => p.type === "maintenance") || null;

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
