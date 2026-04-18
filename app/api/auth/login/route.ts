import { NextResponse } from "next/server";
import { generateTokens } from "../auth";

export async function POST(request: Request) {
  // In a real app you would validate credentials here.
  // For this demo we just issue a token with a generic payload.
  const payload = { sub: "system" };
  const { accessToken, refreshToken, accessExpiresAt } = await generateTokens(payload);

  // Set refresh token in HttpOnly cookie
  const response = NextResponse.json({ accessToken, expiresIn: 3600 });
  response.headers.set(
    "Set-Cookie",
    `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`
  );
  // Also set access token cookie (optional) – we store it in client storage as well.
  response.headers.append(
    "Set-Cookie",
    `accessToken=${accessToken}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict`
  );
  return response;
}
