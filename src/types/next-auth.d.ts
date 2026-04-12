import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: "admin" | "staff" | "viewer";
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "admin" | "staff" | "viewer";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "staff" | "viewer";
    userId?: string;
  }
}
