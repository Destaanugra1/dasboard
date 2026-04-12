import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { ProfileForm } from "@/components/dashboard/settings/profile-form";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";

export default async function ProfileSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const userId = Number(session.user.id);
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return <div className="glass-card p-4 text-sm text-muted">User profile not found.</div>;
  }

  return (
    <ProfileForm
      userId={user.id}
      initialName={user.name}
      initialEmail={user.email}
      initialAvatarUrl={user.avatarUrl}
    />
  );
}
