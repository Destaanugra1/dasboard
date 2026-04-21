"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { useMemo, useState } from "react";
import { navItems } from "./navigation";
import { ThemeToggle } from "./theme-toggle";

type DashboardShellProps = {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: "admin" | "staff" | "viewer";
  };
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Users: pathname.startsWith("/dashboard/users"),
    Products: pathname.startsWith("/dashboard/products"),
    Orders: pathname.startsWith("/dashboard/orders"),
    Analytics: pathname.startsWith("/dashboard/analytics"),
    Blog: pathname.startsWith("/dashboard/blog"),
    Media: pathname.startsWith("/dashboard/media"),
    Settings: pathname.startsWith("/dashboard/settings"),
  });

  const breadcrumb = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length <= 1) {
      return "Overview";
    }
    return parts
      .slice(1)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(" / ");
  }, [pathname]);

  function toggleGroup(label: string) {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function itemIsActive(href?: string) {
    if (!href) {
      return false;
    }
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  const sidebar = (
    <aside className="glass-card fixed left-4 top-4 z-40 h-[calc(100vh-2rem)] w-sidebar overflow-y-auto p-4 md:left-6 md:top-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted">Admin</p>
          <h1 className="text-lg font-semibold text-textPrimary">Commerce OS</h1>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 md:hidden"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="space-y-2">
        {navItems
          .filter((item) => !item.roles || item.roles.includes(user.role))
          .map((item) => {
          const Icon = item.icon;
          if (item.href) {
            const active = itemIsActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  active
                    ? "bg-accentBlue/25 text-textPrimary"
                    : "text-muted hover:bg-white/5 hover:text-textPrimary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          }

          return (
            <div key={item.label} className="rounded-xl">
              {(() => {
                const isGroupActive = item.children?.some((child) => itemIsActive(child.href));
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.label)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition hover:bg-white/5 hover:text-textPrimary ${
                        isGroupActive ? "text-textPrimary font-medium" : "text-muted"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${isGroupActive ? "text-accentBlue" : ""}`} />
                        {item.label}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition ${expanded[item.label] ? "rotate-180" : ""}`}
                      />
                    </button>
              {expanded[item.label] ? (
                <div className="mt-1 space-y-1 pl-8">
                  {item.children
                    ?.filter((child) => !child.roles || child.roles.includes(user.role))
                    .map((child) => {
                    const active = itemIsActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block rounded-lg px-3 py-1.5 text-sm transition ${
                          active
                            ? "bg-accentBlue/20 text-textPrimary"
                            : "text-muted hover:bg-white/5 hover:text-textPrimary"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
                  </>
                );
              })()}
            </div>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen">
      <div className="hidden md:block">{sidebar}</div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden">
          <div className="relative h-full w-[85%] max-w-[320px]">{sidebar}</div>
        </div>
      ) : null}

      <div className="md:pl-[calc(var(--sidebar-w)+3rem)]">
        <header className="sticky top-0 z-30 px-4 py-4 md:px-6 md:py-6">
          <div className="glass-card flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 md:hidden"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Dashboard</p>
                <p className="text-sm font-medium text-textPrimary">{breadcrumb}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="glass-card hidden items-center gap-3 px-3 py-2 sm:flex">
                <div className="h-8 w-8 rounded-full bg-accentBlue/30" />
                <div>
                  <p className="text-sm font-medium text-textPrimary">{user.name}</p>
                  <p className="text-xs text-muted">{user.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="glass-card inline-flex h-10 w-10 items-center justify-center text-textPrimary"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="px-4 pb-8 md:px-6"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
