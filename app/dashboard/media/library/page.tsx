import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MediaLibrary } from "@/components/dashboard/media/media-library";
import { canAccessStore, defaultDashboardPath } from "@/src/lib/authz";

export default async function MediaLibraryPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!canAccessStore(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return <MediaLibrary />;
}
