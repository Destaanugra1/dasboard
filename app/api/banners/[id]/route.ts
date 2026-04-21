import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { banners } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { canManageStore } from "@/src/lib/authz";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageStore(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = parseInt(params.id, 10);
    const body = await req.json();
    const { isActive } = body;

    if (isActive) {
      await db.update(banners).set({ isActive: false });
    }

    const [updated] = await db
      .update(banners)
      .set({ isActive })
      .where(eq(banners.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT Banner Error:", error);
    return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageStore(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = parseInt(params.id, 10);
    await db.delete(banners).where(eq(banners.id, id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Banner Error:", error);
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}
