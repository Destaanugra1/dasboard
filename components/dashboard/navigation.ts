import {
  BarChart2,
  Image,
  LayoutDashboard,
  Newspaper,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import type { UserRole } from "@/src/lib/authz";

export type NavItem = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: Array<{ label: string; href: string; roles?: UserRole[] }>;
  roles?: UserRole[];
};

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "staff"],
  },
  {
    label: "Users",
    icon: Users,
    roles: ["admin"],
    children: [
      { label: "All Users", href: "/dashboard/users" },
      { label: "Roles & Permissions", href: "/dashboard/users/roles" },
      { label: "Activity Log", href: "/dashboard/users/activity" },
    ],
  },
  {
    label: "Products",
    icon: Package,
    roles: ["admin", "staff"],
    children: [
      { label: "All Products", href: "/dashboard/products" },
      { label: "Categories", href: "/dashboard/products/categories" },
      { label: "Inventory", href: "/dashboard/products/inventory" },
    ],
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    roles: ["admin", "staff"],
    children: [
      { label: "All Orders", href: "/dashboard/orders" },
      { label: "Pending", href: "/dashboard/orders/pending" },
      { label: "Returns", href: "/dashboard/orders/returns" },
    ],
  },
  {
    label: "Analytics",
    icon: BarChart2,
    roles: ["admin", "staff"],
    children: [
      { label: "Overview", href: "/dashboard/analytics" },
      { label: "Revenue", href: "/dashboard/analytics/revenue" },
      { label: "Traffic", href: "/dashboard/analytics/traffic" },
    ],
  },
  {
    label: "Blog",
    icon: Newspaper,
    roles: ["admin", "viewer"],
    children: [
      { label: "Semua Artikel", href: "/dashboard/blog", roles: ["admin", "viewer"] },
      { label: "Tulis Artikel", href: "/dashboard/blog/new", roles: ["admin"] },
      { label: "Kategori", href: "/dashboard/blog/categories", roles: ["admin"] },
      { label: "Pengaturan", href: "/dashboard/blog/settings", roles: ["admin"] },
    ],
  },
  {
    label: "Media",
    icon: Image,
    roles: ["admin", "staff"],
    children: [
      { label: "Upload", href: "/dashboard/media/upload" },
      { label: "Library", href: "/dashboard/media/library" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    roles: ["admin", "staff"],
    children: [
      { label: "General", href: "/dashboard/settings" },
      { label: "Banners", href: "/dashboard/settings/banners" },
      { label: "Popups", href: "/dashboard/settings/popups" },
      { label: "Profile", href: "/dashboard/settings/profile" },
      { label: "Integrations", href: "/dashboard/settings/integrations" },
    ],
  },
];
