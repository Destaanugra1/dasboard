import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { and, asc, count, eq, ilike } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { isAdmin } from "@/src/lib/authz";

type UserRole = "admin" | "staff" | "viewer";
type UserStatus = "active" | "inactive";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const role = params.get("role") as UserRole | null;
  const status = params.get("status") as UserStatus | null;
  const page = Number(params.get("page") ?? "1");
  const pageSize = Number(params.get("pageSize") ?? "10");

  const conditions = [];
  if (q) conditions.push(ilike(users.name, `%${q}%`));
  if (role) conditions.push(eq(users.role, role));
  if (status) conditions.push(eq(users.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(whereClause)
    .orderBy(asc(users.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalResult = await db.select({ value: count() }).from(users).where(whereClause);
  const total = totalResult[0]?.value ?? 0;

  return NextResponse.json({ data, page, pageSize, total });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    status?: UserStatus;
    avatarUrl?: string;
  };

  if (!body.name || !body.email || !body.password) {
    return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
  }

  const hash = await bcrypt.hash(body.password, 10);

  const [created] = await db
    .insert(users)
    .values({
      name: body.name,
      email: body.email,
      passwordHash: hash,
      role: body.role ?? "viewer",
      status: body.status ?? "active",
      avatarUrl: body.avatarUrl,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      avatarUrl: users.avatarUrl,
    });

  return NextResponse.json({ data: created }, { status: 201 });
}
