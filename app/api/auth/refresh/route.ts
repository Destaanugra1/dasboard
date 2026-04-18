import { NextResponse } from "next/server";
import { refreshAccessToken } from "../auth";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const refreshToken = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("refreshToken="))
    ?.split("=")[1];

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const result = await refreshAccessToken(refreshToken);
  if (!result) {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  // Set new access token in HttpOnly cookie (optional) and also return JSON
  const response = NextResponse.json({ accessToken: result.accessToken, expiresIn: 3600 });
  response.headers.set(
    "Set-Cookie",
    `accessToken=${result.accessToken}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict`
  );
  return response;
}
