import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { sitePopups } from "@/src/db/schema";
import { desc } from "drizzle-orm";
import { auth } from "@/auth";
import { canManageStore } from "@/src/lib/authz";

// GET all popups (for dashboard management)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageStore(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await db
      .select()
      .from(sitePopups)
      .orderBy(desc(sitePopups.createdAt));
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET Popups Error:", error);
    return NextResponse.json({ error: "Failed to fetch popups" }, { status: 500 });
  }
}

// POST create new popup
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageStore(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { type, isActive, title, message, imageUrl, buttonText, buttonUrl, targetPaths, showOnDev } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!["ad", "maintenance"].includes(type)) {
      return NextResponse.json({ error: "Invalid type. Must be 'ad' or 'maintenance'" }, { status: 400 });
    }

    const [newPopup] = await db
      .insert(sitePopups)
      .values({
        type,
        isActive: isActive ?? false,
        title,
        message: message || null,
        imageUrl: imageUrl || null,
        buttonText: buttonText || null,
        buttonUrl: buttonUrl || null,
        targetPaths: targetPaths || "*",
        showOnDev: showOnDev ?? false,
      })
      .returning();

    return NextResponse.json(newPopup);
  } catch (error: any) {
    console.error("POST Popups Error:", error);
    return NextResponse.json({ error: "Failed to create popup" }, { status: 500 });
  }
}
