import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { sitePopups } from "@/src/db/schema";
import { eq } from "drizzle-orm";

// PUT update popup
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const { type, isActive, title, message, imageUrl, buttonText, buttonUrl, targetPaths, showOnDev } = body;

    const [updated] = await db
      .update(sitePopups)
      .set({
        ...(type !== undefined && { type }),
        ...(isActive !== undefined && { isActive }),
        ...(title !== undefined && { title }),
        ...(message !== undefined && { message }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(buttonText !== undefined && { buttonText }),
        ...(buttonUrl !== undefined && { buttonUrl }),
        ...(targetPaths !== undefined && { targetPaths }),
        ...(showOnDev !== undefined && { showOnDev }),
        updatedAt: new Date(),
      })
      .where(eq(sitePopups.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Popup not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT Popup Error:", error);
    return NextResponse.json({ error: "Failed to update popup" }, { status: 500 });
  }
}

// DELETE popup
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    await db.delete(sitePopups).where(eq(sitePopups.id, id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Popup Error:", error);
    return NextResponse.json({ error: "Failed to delete popup" }, { status: 500 });
  }
}
