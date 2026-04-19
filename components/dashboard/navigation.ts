import {
  BarChart2,
  Image,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";

export type NavItem = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: Array<{ label: string; href: string }>;
};

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    icon: Users,
    children: [
      { label: "All Users", href: "/dashboard/users" },
      { label: "Roles & Permissions", href: "/dashboard/users/roles" },
      { label: "Activity Log", href: "/dashboard/users/activity" },
    ],
  },
  {
    label: "Products",
    icon: Package,
    children: [
      { label: "All Products", href: "/dashboard/products" },
      { label: "Categories", href: "/dashboard/products/categories" },
      { label: "Inventory", href: "/dashboard/products/inventory" },
    ],
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    children: [
      { label: "All Orders", href: "/dashboard/orders" },
      { label: "Pending", href: "/dashboard/orders/pending" },
      { label: "Returns", href: "/dashboard/orders/returns" },
    ],
  },
  {
    label: "Analytics",
    icon: BarChart2,
    children: [
      { label: "Overview", href: "/dashboard/analytics" },
      { label: "Revenue", href: "/dashboard/analytics/revenue" },
      { label: "Traffic", href: "/dashboard/analytics/traffic" },
    ],
  },
  {
    label: "Media",
    icon: Image,
    children: [
      { label: "Upload", href: "/dashboard/media/upload" },
      { label: "Library", href: "/dashboard/media/library" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "General", href: "/dashboard/settings" },
      { label: "Banners", href: "/dashboard/settings/banners" },
      { label: "Popups", href: "/dashboard/settings/popups" },
      { label: "Profile", href: "/dashboard/settings/profile" },
      { label: "Integrations", href: "/dashboard/settings/integrations" },
    ],
  },
];
