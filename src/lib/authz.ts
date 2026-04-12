export type UserRole = "admin" | "staff" | "viewer";

export function canWrite(role: UserRole): boolean {
  return role === "admin" || role === "staff";
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}
