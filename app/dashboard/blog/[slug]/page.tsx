import { asc } from "drizzle-orm";
import { db } from "@/src/db";
import { blogCategories } from "@/src/db/schema";
import { BlogPostForm } from "@/components/dashboard/blog/blog-post-form";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "Edit Artikel — Dashboard" };

export default async function EditBlogPostPage({ params }: Props) {
  const { slug } = await params;

  const cats = await db
    .select({ id: blogCategories.id, name: blogCategories.name, slug: blogCategories.slug, icon: blogCategories.icon })
    .from(blogCategories)
    .orderBy(asc(blogCategories.name));

  return <BlogPostForm slug={slug} categories={cats} />;
}
