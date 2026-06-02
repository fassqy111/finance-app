"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "Главная",
    icon: "⌂",
  },
  {
    href: "/operations",
    label: "Операции",
    icon: "⇄",
  },
  {
    href: "/budget",
    label: "Бюджет",
    icon: "◷",
  },
  {
    href: "/analytics",
    label: "Аналитика",
    icon: "▥",
  },
  {
    href: "/profile",
    label: "Профиль",
    icon: "○",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3">
      <div className="mx-auto w-full max-w-md rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-2 text-slate-600 shadow-2xl shadow-slate-400/30 backdrop-blur-xl transition dark:border-white/10 dark:bg-[#0B0E17]/90 dark:text-white dark:shadow-black/50 sm:max-w-lg md:max-w-2xl lg:max-w-3xl">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 transition ${
                  isActive
                    ? "bg-emerald-400/15 text-emerald-700 dark:text-emerald-300"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-white/[0.04] dark:hover:text-white"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-xl text-base ${
                    isActive
                      ? "bg-emerald-400/20 text-emerald-700 dark:text-emerald-300"
                      : "bg-transparent"
                  }`}
                >
                  {item.icon}
                </span>

                <span className="mt-1 text-[11px] font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}