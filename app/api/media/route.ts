import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { media } from "@/src/db/schema";
import { canAccessStore, canManageStore } from "@/src/lib/authz";
import { cloudinary } from "@/src/lib/cloudinary";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canAccessStore(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await db.select().from(media).orderBy(desc(media.createdAt));
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageStore(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    url: string;
    publicId: string;
    filename: string;
    size: number;
  };

  if (!body.url || !body.publicId || !body.filename || !body.size) {
    return NextResponse.json({ error: "url, publicId, filename, size are required" }, { status: 400 });
  }

  const [created] = await db
    .insert(media)
    .values({
      url: body.url,
      publicId: body.publicId,
      filename: body.filename,
      size: body.size,
      uploadedBy: Number(session.user.id),
    })
    .returning();

  return NextResponse.json({ data: created }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageStore(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(request.nextUrl.searchParams.get("id") ?? "0");
  if (id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [record] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(media).where(eq(media.id, id));

  try {
    await cloudinary.uploader.destroy(record.publicId);
  } catch {
    // Ignore cloudinary deletion failures to keep DB operation successful.
  }

  return NextResponse.json({ ok: true });
}
