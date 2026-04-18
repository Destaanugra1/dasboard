import { NextResponse } from "next/server";
import { verifyAccessToken } from "./auth";

export async function authMiddleware(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
  // Optionally attach payload to request for downstream use
  // (Next.js Request is immutable, but we can use headers or URL params)
  const url = new URL(request.url);
  url.searchParams.set("userId", payload.sub ?? "");
  return NextResponse.rewrite(url.toString());
}
