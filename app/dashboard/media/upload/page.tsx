import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MediaUpload } from "@/components/dashboard/media/media-upload";
import { canAccessStore, defaultDashboardPath } from "@/src/lib/authz";

export default async function MediaUploadPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!canAccessStore(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return <MediaUpload />;
}
