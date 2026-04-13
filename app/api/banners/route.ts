import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { banners } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const data = await db
      .select({
        id: banners.id,
        desktopImageUrl: banners.desktopImageUrl,
        mobileImageUrl: banners.mobileImageUrl,
        isActive: banners.isActive,
        createdAt: banners.createdAt,
      })
      .from(banners)
      .orderBy(desc(banners.id));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET Banners Error:", error);
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { desktopImageUrl, mobileImageUrl, isActive } = body;

    if (!desktopImageUrl || !mobileImageUrl) {
      return NextResponse.json({ error: "Both desktop and mobile image URLs are required" }, { status: 400 });
    }

    // If making this active, deactivate all others first
    if (isActive) {
      await db.update(banners).set({ isActive: false });
    }

    const [newBanner] = await db
      .insert(banners)
      .values({
        desktopImageUrl,
        mobileImageUrl,
        isActive: isActive || false,
      })
      .returning();

    return NextResponse.json(newBanner);
  } catch (error: any) {
    console.error("POST Banners Error:", error);
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}
