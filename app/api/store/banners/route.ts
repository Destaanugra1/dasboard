import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { banners } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
export const revalidate = 0; // Dynamic route

export async function GET() {
  try {
    const [activeBanner] = await db
      .select({
        desktopImageUrl: banners.desktopImageUrl,
        mobileImageUrl: banners.mobileImageUrl,
      })
      .from(banners)
      .where(eq(banners.isActive, true))
      .orderBy(desc(banners.id))
      .limit(1);

    if (!activeBanner) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: activeBanner });
  } catch (error: any) {
    console.error("GET Store Banner Error:", error);
    return NextResponse.json({ error: "Failed to fetch active banner" }, { status: 500 });
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
