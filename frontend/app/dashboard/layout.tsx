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

  // Navigation routes definition
  const navItems = [
    { href: "/dashboard", icon: HouseIcon, label: "Home" },
    { href: "/dashboard/licenses", icon: KeyRound, label: "Licenses" },
    { href: "/dashboard/products", icon: Box, label: "Products" },
  ];

  return (
    <div className="h-dvh w-full overflow-hidden bg-black text-white">
      <div className="flex h-full">
        <aside className="hidden w-52 h-full shrink-0 flex-col rounded-r-[42px] border border-white/10 bg-white/1 backdrop-blur-2xl backdrop-saturate-150 px-3 py-5 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] sm:flex relative z-10">
          <div className="flex h-12 w-fit p-4 items-center justify-center">
            <Boxes size={24} />
            <span className="ml-2 text-xl font-semibold">Dashboard</span>
          </div>
          <hr className="border-white/10" />
          <nav className="mt-5 flex flex-col gap-2">
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
            className="mt-auto flex h-12 w-fit gap-2 p-4 cursor-pointer items-center justify-center rounded-full bg-white/6 text-white/60 transition hover:bg-white/12 hover:text-white"
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
            <span className="font-medium whitespace-nowrap">Settings</span>
          </motion.button>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[38px] bg-black">
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

const MotionLink = motion.create(Link);

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
    <MotionLink
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      href={href}
      layout
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className={`group relative flex h-12 gap-2 px-4 items-center rounded-full transition-colors duration-300 ${
        isActive
          ? "bg-white text-black shadow-sm w-full"
          : "bg-white/6 text-white/60 hover:bg-white/12 hover:text-white w-fit"
      }`}
    >
      <Icon size={20} strokeWidth={2.2} />
      <span className="font-medium whitespace-nowrap">{label}</span>
    </MotionLink>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
