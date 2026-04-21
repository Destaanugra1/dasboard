import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { isAdmin } from "@/src/lib/authz";

type UserRole = "admin" | "staff" | "viewer";
type UserStatus = "active" | "inactive";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(context.params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: user });
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(context.params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    status?: UserStatus;
    avatarUrl?: string;
  };

  const updateValues: {
    name?: string;
    email?: string;
    passwordHash?: string;
    role?: UserRole;
    status?: UserStatus;
    avatarUrl?: string;
  } = {};

  if (body.name) updateValues.name = body.name;
  if (body.email) updateValues.email = body.email;
  if (body.role) updateValues.role = body.role;
  if (body.status) updateValues.status = body.status;
  if (typeof body.avatarUrl === "string") updateValues.avatarUrl = body.avatarUrl;
  if (body.password) updateValues.passwordHash = await bcrypt.hash(body.password, 10);

  const [updated] = await db
    .update(users)
    .set(updateValues)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      avatarUrl: users.avatarUrl,
    });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(context.params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set({ status: "inactive" })
    .where(eq(users.id, id))
    .returning({ id: users.id });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}
