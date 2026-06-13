"use client";

import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { forwardRef, useEffect, useRef, useState } from "react";

type AddProductButtonProps = {
  onClick?: () => void;
  onPointerDown?: (el: HTMLButtonElement) => void;
  layoutId?: string;
  isOpen?: boolean;
};

export const AddProductButton = forwardRef<
  HTMLButtonElement,
  AddProductButtonProps
>(function AddProductButton({ onClick, onPointerDown, layoutId, isOpen }, ref) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<"left" | "right">("right");

  useEffect(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    setPlacement(spaceRight > 120 ? "right" : "left");
  }, [wrapperRef, setPlacement]);

  return (
    <div ref={wrapperRef} className="group relative inline-flex">
      <motion.button
        ref={ref}
        className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-black"
        style={{
          borderRadius: 9999,
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? "none" : undefined,
        }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        whileTap={{ scale: 0.94 }}
        type="button"
        layoutId={layoutId}
        onClick={onClick}
        onPointerDown={(event) => onPointerDown?.(event.currentTarget)}
      >
        <span className="flex items-center justify-center">
          <Plus size={16} strokeWidth={2.4} />
        </span>
      </motion.button>
      <span
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-white/60 opacity-0 transition-opacity duration-150 group-hover:opacity-100 ${
          placement === "right" ? "left-full ml-2" : "right-full mr-2"
        }`}
      >
        Add product
      </span>
    </div>
  );
});
