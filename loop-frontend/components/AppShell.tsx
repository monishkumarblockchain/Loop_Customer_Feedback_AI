"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Building2,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

import {
  getRole,
  canAccessCompanies,
  canAccessUsers,
  clearAuth,
} from "@/lib/auth";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    always: true,
  },
  {
    name: "Feedback",
    href: "/feedback",
    icon: MessageSquare,
    always: true,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    always: true,
  },
  {
    name: "Companies",
    href: "/companies",
    icon: Building2,
    companies: true,
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
    users: true,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    always: true,
  },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const role = getRole();

  const items = navigation.filter((item) => {
    if (item.companies) {
      return canAccessCompanies();
    }

    if (item.users) {
      return canAccessUsers();
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-black">

      {/* TOP HEADER */}
      <header className="border-b border-gray-300 bg-[#f7f7f5]">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* LOGO */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-black text-sm font-bold text-white">
              L
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                LOOP
              </p>

              <p className="text-xs text-gray-500">
                Customer Feedback Intelligence
              </p>
            </div>
          </Link>

          {/* NAVIGATION */}
          <nav className="hidden items-center gap-1 md:flex">

            {items.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                pathname.startsWith(
                  `${item.href}/`
                );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-200 hover:text-black"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

          </nav>

          {/* USER / LOGOUT */}
          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">
              <p className="text-xs text-gray-500">
                Logged in as
              </p>

              <p className="text-sm font-semibold">
                {role}
              </p>
            </div>

            <button
              onClick={() => {
                clearAuth();
                window.location.href = "/login";
              }}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-gray-100"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">
                Logout
              </span>
            </button>

          </div>

        </div>

        {/* MOBILE NAVIGATION */}
        <div className="border-t border-gray-200 px-6 py-2 md:hidden">

          <nav className="flex gap-1 overflow-x-auto">

            {items.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                pathname.startsWith(
                  `${item.href}/`
                );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm ${
                    active
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon size={15} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

          </nav>

        </div>

      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto min-h-[calc(100vh-73px)] max-w-7xl px-6 py-8">
        {children}
      </main>

    </div>
  );
}