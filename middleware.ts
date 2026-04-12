import { NextRequest, NextResponse } from "next/server";

function getSessionToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get("__Secure-authjs.session-token")?.value ??
    request.cookies.get("authjs.session-token")?.value
  );
}

export default function middleware(request: NextRequest) {
  const token = getSessionToken(request);

  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
