"use client";

import SettingsModal from "@/components/SettingsModal";
import {
  Boxes,
  KeyRound,
  type LucideIcon,
  HouseIcon,
  Settings,
  Box,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [settingsAnchorEl, setSettingsAnchorEl] =
    useState<HTMLButtonElement | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", icon: HouseIcon, label: "Main" },
    { href: "/dashboard/licenses", icon: KeyRound, label: "Licenses" },
    { href: "/dashboard/products", icon: Box, label: "Products" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#050505] p-4 text-white sm:p-6 lg:p-10">
      <div className="flex min-h-[calc(100vh-2rem)] gap-4 sm:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-5rem)] lg:gap-6">
        <aside className="hidden w-19 shrink-0 flex-col items-center rounded-full border border-white/10 bg-black/80 px-3 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.14)] sm:flex">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black">
            <Boxes size={22} strokeWidth={2.4} />
          </div>

          <nav className="mt-5 flex flex-col gap-3">
            {navItems.map((item) => (
              <SidebarItem
                href={item.href}
                icon={item.icon}
                isActive={isActivePath(pathname, item.href)}
                key={item.href}
                label={item.label}
              />
            ))}
          </nav>

          <motion.button
            aria-label="Settings"
            aria-expanded={isSettingsOpen}
            className="mt-auto flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/6 text-white/60 transition hover:bg-white/12 hover:text-white"
            style={{
              borderRadius: 9999,
              opacity: isSettingsOpen ? 0 : 1,
              pointerEvents: isSettingsOpen ? "none" : undefined,
            }}
            onClick={() => setIsSettingsOpen(true)}
            onPointerDown={(event) => setSettingsAnchorEl(event.currentTarget)}
            ref={setSettingsAnchorEl}
            transition={{ duration: 0.12, ease: "easeOut" }}
            whileTap={{ scale: 0.94 }}
            type="button"
            layoutId="dashboard-settings"
          >
            <Settings size={20} strokeWidth={2.2} />
          </motion.button>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[38px] border border-white/10 bg-black shadow-[0_28px_100px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)]">
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>

      <SettingsModal
        anchorEl={settingsAnchorEl}
        isOpen={isSettingsOpen}
        layoutId="dashboard-settings"
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

function SidebarItem({
  href,
  icon: Icon,
  isActive,
  label,
}: {
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  label: string;
}) {
  return (
    <Link
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex h-12 w-12 items-center justify-center rounded-full transition ${
        isActive
          ? "bg-white text-black"
          : "bg-white/6 text-white/60 hover:bg-white/12 hover:text-white"
      }`}
      href={href}
    >
      <Icon size={20} strokeWidth={2.2} />
      <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-10 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-black px-3 py-2 text-xs font-medium text-white/80 opacity-0 shadow-[0_16px_50px_rgba(0,0,0,0.55)] transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
      </span>
    </Link>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
