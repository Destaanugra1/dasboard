import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { blogPosts, blogCategories } from "@/src/db/schema";
import { and, asc, count, desc, eq, ilike } from "drizzle-orm";
import { auth } from "@/auth";
import { canWrite } from "@/src/lib/authz";
import { slugify } from "@/src/lib/slug";

// Public — GET posts with filtering
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const category = params.get("category");
  const status = params.get("status") as "published" | "draft" | null;
  const featured = params.get("featured") === "true";
  const trending = params.get("trending") === "true";
  const popular = params.get("popular") === "true";
  const page = Number(params.get("page") ?? "1");
  const pageSize = Number(params.get("pageSize") ?? "10");

  const conditions = [];
  if (q) conditions.push(ilike(blogPosts.title, `%${q}%`));
  if (status) conditions.push(eq(blogPosts.status, status));
  if (featured) conditions.push(eq(blogPosts.isFeatured, true));
  if (trending) conditions.push(eq(blogPosts.isTrending, true));
  if (popular) conditions.push(eq(blogPosts.isPopular, true));
  if (category) conditions.push(eq(blogCategories.slug, category));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      coverImageUrl: blogPosts.coverImageUrl,
      authorName: blogPosts.authorName,
      authorAvatarUrl: blogPosts.authorAvatarUrl,
      isFeatured: blogPosts.isFeatured,
      isTrending: blogPosts.isTrending,
      isPopular: blogPosts.isPopular,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      categoryId: blogPosts.categoryId,
      categoryName: blogCategories.name,
      categorySlug: blogCategories.slug,
      categoryIcon: blogCategories.icon,
      categoryColor: blogCategories.color,
    })
    .from(blogPosts)
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .where(whereClause)
    .orderBy(desc(blogPosts.publishedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalResult = await db
    .select({ value: count() })
    .from(blogPosts)
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .where(whereClause);

  return NextResponse.json({ data: rows, page, pageSize, total: totalResult[0]?.value ?? 0 });
}

// Auth — POST create post
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canWrite(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, excerpt, content, coverImageUrl, categoryId, authorName, authorAvatarUrl,
    isFeatured, isTrending, isPopular, status, publishedAt } = body;

  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const slug = slugify(title);

  const [row] = await db
    .insert(blogPosts)
    .values({
      title,
      slug,
      excerpt,
      content,
      coverImageUrl,
      categoryId: categoryId ?? null,
      authorName: authorName ?? "Admin",
      authorAvatarUrl,
      isFeatured: isFeatured ?? false,
      isTrending: isTrending ?? false,
      isPopular: isPopular ?? false,
      status: status ?? "draft",
      publishedAt: publishedAt ? new Date(publishedAt) : null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
