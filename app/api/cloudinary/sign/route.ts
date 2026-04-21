import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageStore } from "@/src/lib/authz";
import { cloudinary } from "@/src/lib/cloudinary";

type SignatureBody = {
  paramsToSign?: Record<string, string | number | boolean>;
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageStore(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as SignatureBody;
  if (!body.paramsToSign || Object.keys(body.paramsToSign).length === 0) {
    return NextResponse.json({ error: "paramsToSign is required" }, { status: 400 });
  }

  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    return NextResponse.json({ error: "Cloudinary secret is not configured" }, { status: 500 });
  }

  const signature = cloudinary.utils.api_sign_request(body.paramsToSign, apiSecret);
  return NextResponse.json({ signature });
}
