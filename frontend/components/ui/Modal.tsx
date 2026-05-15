"use client";

/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/immutability, react-hooks/set-state-in-effect */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export interface ModalProps extends Omit<HTMLMotionProps<"div">, "layoutId"> {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  layoutId?: string;
  anchorEl?: HTMLElement | null;
  originEl?: HTMLElement | null;
  sharedElementIds?: string[];
  disableOriginAnimation?: boolean;
}

const centeredStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  height: "fit-content",
  margin: "auto",
  maxHeight: "90vh",
  borderRadius: 24,
  overflowY: "auto",
};

export function Modal({
  isOpen,
  onClose,
  children,
  layoutId: _layoutId,
  anchorEl,
  originEl,
  sharedElementIds: _sharedElementIds,
  disableOriginAnimation = false,
  className,
  ...modalAttrs
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const controls = useAnimationControls();
  const [isMounted, setIsMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [panelVisible, setPanelVisible] = useState(false);
  const [positionStyle, setPositionStyle] =
    useState<CSSProperties>(centeredStyle);

  const prevOverflow = useRef("");
  const prevPaddingRight = useRef("");
  const prevScrollbarCompensation = useRef("");
  const restoreOriginRef = useRef<(() => void) | null>(null);
  const isAnchored = !!anchorEl;
  const animationEl = originEl ?? anchorEl ?? null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const backdropClass = useMemo(
    () =>
      cn(
        "fixed inset-0 z-40 backdrop-blur-xs",
        isAnchored ? "bg-transparent" : "bg-white/5 dark:bg-black/10",
      ),
    [isAnchored],
  );

  const panelClass = useMemo(
    () =>
      cn(
        "absolute z-50 overflow-hidden border-2 border-[#c7d6c8] bg-[#fbfdf8] shadow-[0_10px_0_#b9c7b8,0_22px_44px_rgba(38,56,45,0.18)] dark:border-[#26382d] dark:bg-[#121412] dark:shadow-[0_10px_0_#060806,0_22px_44px_rgba(0,0,0,0.45)]",
        !isAnchored
          ? "w-fit max-w-[calc(100dvw-24px)] rounded-[20px] md:min-w-[320px]"
          : "w-fit max-w-[calc(100dvw-24px)] rounded-xl md:min-w-48",
        className,
      ),
    [className, isAnchored],
  );

  const hideOrigin = useCallback(() => {
    if (!animationEl || restoreOriginRef.current) return;

    const previousVisibility = animationEl.style.visibility;
    animationEl.style.visibility = "hidden";
    restoreOriginRef.current = () => {
      animationEl.style.visibility = previousVisibility;
      restoreOriginRef.current = null;
    };
  }, [animationEl]);

  const restoreOrigin = useCallback(() => {
    restoreOriginRef.current?.();
  }, []);

  const updatePosition = useCallback(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (vw < 768) {
      setPositionStyle({
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        maxHeight: "100vh",
        margin: 0,
        borderRadius: 0,
        overflowY: "auto",
      });
      return;
    }

    const anchorRect = anchorEl?.getBoundingClientRect();

    if (!anchorRect) {
      setPositionStyle(centeredStyle);
      return;
    }

    const pad = 12;
    modal.style.width = "";
    modal.style.height = "";

    const modalW = modal.offsetWidth || 420;
    const modalH = modal.offsetHeight || 520;
    const { top, left, width, bottom } = anchorRect;
    const bottomPad = 12;

    let posX = left + width / 2 - modalW / 2;
    let posY = top;

    if (posY + modalH > vh - bottomPad) {
      posY = bottom - modalH;
    }

    posX = Math.max(pad, Math.min(posX, vw - modalW - pad));
    posY = Math.max(pad, Math.min(posY, vh - modalH - bottomPad));

    setPositionStyle({
      position: "fixed",
      left: posX,
      top: posY,
      width: modalW,
      maxHeight: `calc(100vh - ${pad * 2}px)`,
      borderRadius: 24,
      overflowY: "auto",
    });
  }, [anchorEl]);

  const getOriginSnapshot = useCallback(() => {
    if (!animationEl || disableOriginAnimation) return null;

    const rect = animationEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    return {
      rect,
      borderRadius: window.getComputedStyle(animationEl).borderRadius,
    };
  }, [animationEl, disableOriginAnimation]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    }
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!shouldRender) return;
    updatePosition();
  }, [shouldRender, updatePosition]);

  useLayoutEffect(() => {
    const modal = modalRef.current;
    if (!modal || !shouldRender) return;

    let cancelled = false;
    const frame = window.requestAnimationFrame(async () => {
      if (cancelled) return;

      const finalRect = modal.getBoundingClientRect();
      const finalRadius = window.getComputedStyle(modal).borderRadius;
      const openingOrigin = getOriginSnapshot();
      const isAnchorAnimation = !!anchorEl && !originEl;
      const transformOrigin =
        isAnchorAnimation && openingOrigin
          ? Math.abs(openingOrigin.rect.bottom - finalRect.bottom) <
            Math.abs(openingOrigin.rect.top - finalRect.top)
          ? "center bottom"
          : "center top"
        : "top left";
      const originX = isAnchorAnimation
        ? (openingOrigin?.rect.left ?? finalRect.left) +
          (openingOrigin?.rect.width ?? finalRect.width) / 2 -
          (finalRect.left + finalRect.width / 2)
        : (openingOrigin?.rect.left ?? 0) - finalRect.left;
      const originY = isAnchorAnimation
        ? transformOrigin === "center bottom"
          ? (openingOrigin?.rect.bottom ?? 0) - finalRect.bottom
          : (openingOrigin?.rect.top ?? 0) - finalRect.top
        : (openingOrigin?.rect.top ?? 0) - finalRect.top;

      if (isOpen) {
        if (openingOrigin) {
          controls.set({
            x: originX,
            y: originY,
            scaleX: openingOrigin.rect.width / finalRect.width,
            scaleY: openingOrigin.rect.height / finalRect.height,
            scale: 1,
            borderRadius: openingOrigin.borderRadius,
            opacity: 1,
            transformOrigin,
          });
        } else {
          controls.set({ scale: 0.95, opacity: 0 });
        }

        setPanelVisible(true);
        await controls.start({
          x: 0,
          y: 0,
          scale: 1,
          scaleX: 1,
          scaleY: 1,
          borderRadius: finalRadius,
          opacity: 1,
          transition: {
            duration: openingOrigin ? 0.38 : 0.22,
            ease: [0.22, 1, 0.36, 1],
          },
        });
        return;
      }

      const origin = getOriginSnapshot();
      if (origin) {
        const isAnchorAnimation = !!anchorEl && !originEl;
        const transformOrigin = isAnchorAnimation
          ? Math.abs(origin.rect.bottom - finalRect.bottom) <
            Math.abs(origin.rect.top - finalRect.top)
            ? "center bottom"
            : "center top"
          : "top left";
        const originX = isAnchorAnimation
          ? origin.rect.left +
            origin.rect.width / 2 -
            (finalRect.left + finalRect.width / 2)
          : origin.rect.left - finalRect.left;
        const originY = isAnchorAnimation
          ? transformOrigin === "center bottom"
            ? origin.rect.bottom - finalRect.bottom
            : origin.rect.top - finalRect.top
          : origin.rect.top - finalRect.top;

        hideOrigin();
        await controls.start({
          x: originX,
          y: originY,
          scaleX: origin.rect.width / finalRect.width,
          scaleY: origin.rect.height / finalRect.height,
          scale: 1,
          borderRadius: origin.borderRadius,
          opacity: 0,
          transformOrigin,
          transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
        });
        restoreOrigin();
      } else {
        await controls.start({
          scale: 0.95,
          opacity: 0,
          transition: { duration: 0.18, ease: "easeIn" },
        });
      }

      if (!cancelled) {
        setPanelVisible(false);
        setShouldRender(false);
      }
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [
    anchorEl,
    controls,
    getOriginSnapshot,
    hideOrigin,
    isOpen,
    originEl,
    restoreOrigin,
    shouldRender,
  ]);

  useEffect(() => {
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [updatePosition]);

  useEffect(() => restoreOrigin, [restoreOrigin]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    prevOverflow.current = document.body.style.overflow;
    prevPaddingRight.current = document.body.style.paddingRight;
    prevScrollbarCompensation.current =
      document.documentElement.style.getPropertyValue(
        "--scrollbar-compensation",
      );

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.documentElement.style.setProperty(
        "--scrollbar-compensation",
        `${scrollbarWidth}px`,
      );
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow.current;
      document.body.style.paddingRight = prevPaddingRight.current;
      document.documentElement.style.setProperty(
        "--scrollbar-compensation",
        prevScrollbarCompensation.current,
      );
    };
  }, [isOpen, onClose]);

  if (!isMounted) return null;

  return createPortal(
    <>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="modal-backdrop"
            className={backdropClass}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {shouldRender && (
        <motion.div
          ref={modalRef}
          style={{
            ...positionStyle,
            visibility: panelVisible ? "visible" : "hidden",
          }}
          className={panelClass}
          animate={controls}
          {...modalAttrs}
        >
          {children}
        </motion.div>
      )}
    </>,
    document.body,
  );
}
