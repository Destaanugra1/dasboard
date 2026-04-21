export type UserRole = "admin" | "staff" | "viewer";

export type DashboardArea = "store" | "blog" | "admin";

const STORE_PREFIXES = [
  "/dashboard",
  "/dashboard/products",
  "/dashboard/orders",
  "/dashboard/media",
  "/dashboard/analytics",
  "/dashboard/settings",
];

const ADMIN_PREFIXES = ["/dashboard/users"];

const BLOG_PREFIX = "/dashboard/blog";

export function canWrite(role: UserRole): boolean {
  return role === "admin" || role === "staff";
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function canAccessStore(role: UserRole): boolean {
  return role === "admin" || role === "staff";
}

export function canManageStore(role: UserRole): boolean {
  return role === "admin" || role === "staff";
}

export function canAccessBlog(role: UserRole): boolean {
  return role === "admin" || role === "viewer";
}

export function canManageBlog(role: UserRole): boolean {
  return role === "admin";
}

export function canAccessDashboardPath(role: UserRole, pathname: string): boolean {
  if (pathname.startsWith(BLOG_PREFIX)) {
    return canAccessBlog(role);
  }

  if (ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return isAdmin(role);
  }

  if (STORE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return canAccessStore(role);
  }

  return isAdmin(role);
}

export function defaultDashboardPath(role: UserRole): string {
  if (role === "viewer") return "/dashboard/blog";
  if (role === "staff") return "/dashboard/products";
  return "/dashboard";
}
