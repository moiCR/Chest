"use client";

/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const modalStackListeners = new Set<() => void>();
let modalStack: string[] = [];

const notifyModalStackListeners = () => {
  modalStackListeners.forEach((listener) => listener());
};

const subscribeToModalStack = (listener: () => void) => {
  modalStackListeners.add(listener);
  return () => modalStackListeners.delete(listener);
};

const getModalStackSnapshot = () => modalStack.join("|");

const registerModal = (id: string) => {
  if (!modalStack.includes(id)) {
    modalStack = [...modalStack, id];
    notifyModalStackListeners();
  }
};

const unregisterModal = (id: string) => {
  if (!modalStack.includes(id)) return;

  modalStack = modalStack.filter((modalId) => modalId !== id);
  notifyModalStackListeners();
};

let bodyScrollLockCount = 0;
let previousBodyOverflow = "";
let previousBodyPaddingRight = "";
let previousScrollbarCompensation = "";

const lockBodyScroll = () => {
  if (bodyScrollLockCount === 0) {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    previousBodyOverflow = document.body.style.overflow;
    previousBodyPaddingRight = document.body.style.paddingRight;
    previousScrollbarCompensation =
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
  }

  bodyScrollLockCount += 1;
};

const unlockBodyScroll = () => {
  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);

  if (bodyScrollLockCount !== 0) return;

  document.body.style.overflow = previousBodyOverflow;
  document.body.style.paddingRight = previousBodyPaddingRight;
  document.documentElement.style.setProperty(
    "--scrollbar-compensation",
    previousScrollbarCompensation,
  );
};

export interface ModalProps extends Omit<HTMLMotionProps<"div">, "layoutId"> {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  layoutId?: string;
  anchorEl?: HTMLElement | null;
  anchorPlacement?: "center" | "right-end";
  isSecondaryModal?: boolean;
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
  anchorPlacement = "center",
  isSecondaryModal = false,
  originEl,
  sharedElementIds: _sharedElementIds,
  disableOriginAnimation = false,
  className,
  ...modalAttrs
}: ModalProps) {
  const modalId = useId();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const controls = useAnimationControls();
  const stackSnapshot = useSyncExternalStore(
    subscribeToModalStack,
    getModalStackSnapshot,
    getModalStackSnapshot,
  );
  const [isMounted, setIsMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [panelVisible, setPanelVisible] = useState(false);
  const [positionStyle, setPositionStyle] =
    useState<CSSProperties>(centeredStyle);

  const restoreOriginRef = useRef<(() => void) | null>(null);
  const isAnchored = !!anchorEl;
  const animationEl = originEl ?? anchorEl ?? null;
  const stack = stackSnapshot ? stackSnapshot.split("|") : [];
  const stackIndex = Math.max(0, stack.indexOf(modalId));
  const isTopModal = stack[stack.length - 1] === modalId;
  const canInteractWithPanel = stack.length === 0 || isTopModal;
  const panelZIndex = 50 + Math.max(stackIndex, isSecondaryModal ? 1 : 0) * 10;
  const backdropZIndex = panelZIndex - 5;
  const shouldRenderBackdrop =
    isOpen && (isTopModal || (shouldRender && stack.length === 0));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const backdropClass = useMemo(
    () =>
      cn(
        "fixed inset-0 backdrop-blur-xs",
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

  const computePositionStyle = useCallback(() => {
    const modal = modalRef.current;
    if (!modal) return null;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (vw < 768) {
      return {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        maxHeight: "100vh",
        margin: 0,
        borderRadius: 0,
        overflowY: "auto",
      } satisfies CSSProperties;
    }

    const anchorRect = anchorEl?.getBoundingClientRect();

    if (!anchorRect) {
      return centeredStyle;
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

    if (anchorPlacement === "right-end") {
      posX = anchorRect.right + pad;
      posY = bottom - modalH;
    } else if (posY + modalH > vh - bottomPad) {
      posY = bottom - modalH;
    }

    posX = Math.max(pad, Math.min(posX, vw - modalW - pad));
    posY = Math.max(pad, Math.min(posY, vh - modalH - bottomPad));

    return {
      position: "fixed",
      left: posX,
      top: posY,
      width: modalW,
      maxHeight: `calc(100vh - ${pad * 2}px)`,
      borderRadius: 24,
      overflowY: "auto",
    } satisfies CSSProperties;
  }, [anchorEl, anchorPlacement]);

  const applyPositionStyle = useCallback((style: CSSProperties) => {
    const modal = modalRef.current;
    if (!modal) return;

    modal.style.position = String(style.position ?? "");
    modal.style.inset = String(style.inset ?? "");
    modal.style.left =
      typeof style.left === "number" ? `${style.left}px` : String(style.left ?? "");
    modal.style.top =
      typeof style.top === "number" ? `${style.top}px` : String(style.top ?? "");
    modal.style.width =
      typeof style.width === "number"
        ? `${style.width}px`
        : String(style.width ?? "");
    modal.style.height =
      typeof style.height === "number"
        ? `${style.height}px`
        : String(style.height ?? "");
    modal.style.maxHeight = String(style.maxHeight ?? "");
    modal.style.margin =
      typeof style.margin === "number"
        ? `${style.margin}px`
        : String(style.margin ?? "");
    modal.style.borderRadius =
      typeof style.borderRadius === "number"
        ? `${style.borderRadius}px`
        : String(style.borderRadius ?? "");
    modal.style.overflowY = String(style.overflowY ?? "");
  }, []);

  const updatePosition = useCallback(() => {
    const nextPositionStyle = computePositionStyle();
    if (!nextPositionStyle) return;
    setPositionStyle(nextPositionStyle);
  }, [computePositionStyle]);

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

  useEffect(() => {
    if (!shouldRender) return;

    registerModal(modalId);
    return () => unregisterModal(modalId);
  }, [modalId, shouldRender]);

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

      const measuredPositionStyle = anchorEl ? computePositionStyle() : null;
      if (measuredPositionStyle) {
        setPositionStyle(measuredPositionStyle);
        applyPositionStyle(measuredPositionStyle);
      }

      const finalRect = modal.getBoundingClientRect();
      const finalRadius = window.getComputedStyle(modal).borderRadius;
      const openingOrigin = getOriginSnapshot();
      const isAnchorAnimation = !!anchorEl && !originEl;
      const transformOrigin = isAnchorAnimation ? "center center" : "top left";
      const originX = isAnchorAnimation
        ? (openingOrigin?.rect.left ?? finalRect.left) +
          (openingOrigin?.rect.width ?? finalRect.width) / 2 -
          (finalRect.left + finalRect.width / 2)
        : (openingOrigin?.rect.left ?? 0) - finalRect.left;
      const originY = isAnchorAnimation
        ? (openingOrigin?.rect.top ?? finalRect.top) +
          (openingOrigin?.rect.height ?? finalRect.height) / 2 -
          (finalRect.top + finalRect.height / 2)
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
        const transformOrigin = isAnchorAnimation ? "center center" : "top left";
        const originX = isAnchorAnimation
          ? origin.rect.left +
            origin.rect.width / 2 -
            (finalRect.left + finalRect.width / 2)
          : origin.rect.left - finalRect.left;
        const originY = isAnchorAnimation
          ? origin.rect.top +
            origin.rect.height / 2 -
            (finalRect.top + finalRect.height / 2)
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
    applyPositionStyle,
    computePositionStyle,
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
      if (event.key === "Escape" && isTopModal) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    lockBodyScroll();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unlockBodyScroll();
    };
  }, [isOpen, isTopModal, onClose]);

  if (!isMounted) return null;

  return createPortal(
    <>
      <AnimatePresence initial={false}>
        {shouldRenderBackdrop && (
          <motion.div
            key="modal-backdrop"
            className={backdropClass}
            style={{ zIndex: backdropZIndex }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={isTopModal ? onClose : undefined}
          />
        )}
      </AnimatePresence>

      {shouldRender && (
        <motion.div
          ref={modalRef}
          style={{
            ...positionStyle,
            pointerEvents: canInteractWithPanel ? undefined : "none",
            zIndex: panelZIndex,
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
