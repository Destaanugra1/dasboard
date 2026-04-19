import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/app/api/auth/auth";

function getSessionToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get("__Secure-authjs.session-token")?.value ??
    request.cookies.get("authjs.session-token")?.value
  );
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigins = [
    "http://localhost:5173", 
    "http://localhost:3000", 
    "http://localhost:5174",
    "https://www.xenonlabs.my.id",
    "https://xenonlabs.my.id"
  ];
  const isAllowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  // Handle CORS preflight OPTIONS requests for all /api endpoints
  if (pathname.startsWith("/api") && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": isAllowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  let response = NextResponse.next();

  // Dashboard session authentication (unchanged behavior)
  if (pathname.startsWith("/dashboard")) {
    const token = getSessionToken(request);
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // API routing & token authentication
  if (pathname.startsWith("/api")) {
    const isPublicRoute =
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/api/store/checkout") ||
      pathname.startsWith("/api/store/banners") ||
      pathname.startsWith("/api/store/products") ||
      pathname.startsWith("/api/store/popup") ||
      pathname.startsWith("/api/webhooks") ||
      pathname.startsWith("/api/blog") ||
      /^\/api\/store\/orders\/[^/]+\/status/.test(pathname) ||
      /^\/api\/store\/orders\/[^/]+\/mock-pay/.test(pathname);

    if (!isPublicRoute) {
      const sessionToken = getSessionToken(request);
      // Jika request datang dari internal dashboard UI (punya cookies NextAuth), kita loloskan.
      // Jika dari eksternal (client React), cek JWT token.
      if (!sessionToken) {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          response = NextResponse.json({ error: "Missing token" }, { status: 401 });
        } else {
          const token = authHeader.split(" ")[1];
          const payload = await verifyAccessToken(token);
          if (!payload) {
            response = NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
          }
        }
      }
    }

    // Attach CORS headers to GET, POST, and other methods for /api
    response.headers.set("Access-Control-Allow-Origin", isAllowedOrigin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};

