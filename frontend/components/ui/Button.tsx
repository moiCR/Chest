"use client";

import { motion } from "motion/react";
import type { ReactNode, MouseEvent, PointerEvent } from "react";

type ButtonProps = {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  onPointerDown?: (e: PointerEvent<HTMLButtonElement>) => void;
  layoutId?: string;
  className?: string;
  hidden?: boolean;
};

export function Button({ children, onClick, onPointerDown, layoutId, className, hidden }: ButtonProps) {
  return (
    <motion.button
      layoutId={layoutId}
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={`flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90 ${className ?? ""}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.94 }}
      style={{
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? "none" : undefined,
      }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      type="button"
    >
      {children}
    </motion.button>
  );
}