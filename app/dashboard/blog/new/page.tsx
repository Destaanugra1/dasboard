import { asc } from "drizzle-orm";
import { db } from "@/src/db";
import { blogCategories } from "@/src/db/schema";
import { BlogPostForm } from "@/components/dashboard/blog/blog-post-form";

export const metadata = { title: "Tulis Artikel — Dashboard" };

export default async function NewBlogPostPage() {
  const cats = await db
    .select({ id: blogCategories.id, name: blogCategories.name, slug: blogCategories.slug, icon: blogCategories.icon })
    .from(blogCategories)
    .orderBy(asc(blogCategories.name));

  return <BlogPostForm categories={cats} />;
}
