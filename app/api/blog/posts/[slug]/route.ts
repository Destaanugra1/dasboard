import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { blogPosts, blogCategories } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { canManageBlog } from "@/src/lib/authz";
import { slugify } from "@/src/lib/slug";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const [row] = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      content: blogPosts.content,
      coverImageUrl: blogPosts.coverImageUrl,
      authorName: blogPosts.authorName,
      authorAvatarUrl: blogPosts.authorAvatarUrl,
      isFeatured: blogPosts.isFeatured,
      isTrending: blogPosts.isTrending,
      isPopular: blogPosts.isPopular,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      updatedAt: blogPosts.updatedAt,
      categoryId: blogPosts.categoryId,
      categoryName: blogCategories.name,
      categorySlug: blogCategories.slug,
      categoryIcon: blogCategories.icon,
      categoryColor: blogCategories.color,
    })
    .from(blogPosts)
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .where(eq(blogPosts.slug, slug));

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageBlog(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  const body = await req.json();

  const updates: Partial<typeof blogPosts.$inferInsert> = { updatedAt: new Date() };
  if (body.title !== undefined) { updates.title = body.title; updates.slug = slugify(body.title); }
  if (body.excerpt !== undefined) updates.excerpt = body.excerpt;
  if (body.content !== undefined) updates.content = body.content;
  if (body.coverImageUrl !== undefined) updates.coverImageUrl = body.coverImageUrl;
  if (body.categoryId !== undefined) updates.categoryId = body.categoryId;
  if (body.authorName !== undefined) updates.authorName = body.authorName;
  if (body.authorAvatarUrl !== undefined) updates.authorAvatarUrl = body.authorAvatarUrl;
  if (body.isFeatured !== undefined) updates.isFeatured = body.isFeatured;
  if (body.isTrending !== undefined) updates.isTrending = body.isTrending;
  if (body.isPopular !== undefined) updates.isPopular = body.isPopular;
  if (body.status !== undefined) updates.status = body.status;
  if (body.publishedAt !== undefined) updates.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;

  const [updated] = await db
    .update(blogPosts)
    .set(updates)
    .where(eq(blogPosts.slug, slug))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageBlog(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  await db.delete(blogPosts).where(eq(blogPosts.slug, slug));
  return NextResponse.json({ success: true });
}
