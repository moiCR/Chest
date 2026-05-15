"use client";

import { LoginModal } from "@/components/LoginModal";
import { RegisterModal } from "@/components/RegisterModal";
import {
  SharedModal,
  SharedModalElement,
  SharedModalRoot,
} from "@/components/ui/SharedModal";
import { ArrowUpRight, X } from "lucide-react";
import { motion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";

const LOGIN_LAYOUT_ID = "login-modal";
const REGISTER_LAYOUT_ID = "register-modal";
const MODAL_TRANSITION_LOCK_MS = 520;
type AuthOrigin = "hero-login" | "hero-register" | "buy-now";
type FeatureId = "dashboard" | "products" | "licenses";

const features: Array<{
  id: FeatureId;
  title: string;
  label: string;
  description: string;
  stat: string;
}> = [
  {
    id: "dashboard",
    title: "Dashboard",
    label: "Overview",
    description: "A clean command center for sales, keys, and customer activity.",
    stat: "Live view",
  },
  {
    id: "products",
    title: "Products",
    label: "Catalog",
    description: "Organize every plugin, release, and license rule without clutter.",
    stat: "Simple setup",
  },
  {
    id: "licenses",
    title: "Licenses",
    label: "Access",
    description: "Track activations and manage customer access from one place.",
    stat: "Fast control",
  },
];

function BentoCard({
  children,
  className = "",
  showArrow = true,
  style,
  onClick,
  hidden = false,
  disabled = false,
  ariaLabel,
}: {
  children?: ReactNode;
  className?: string;
  showArrow?: boolean;
  style?: CSSProperties;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  hidden?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const content = (
    <>
      {showArrow ? (
        <ArrowUpRight
          aria-hidden="true"
          className="absolute right-7 top-7 z-10 h-5 w-5 text-white/80"
          strokeWidth={2}
        />
      ) : null}
      <div className="relative z-10 h-full">{children}</div>
    </>
  );

  const cardClass = `relative overflow-hidden rounded-[44px] bg-[#080808] ${className}`;
  const mergedStyle = {
    ...style,
    pointerEvents: hidden || disabled ? "none" : style?.pointerEvents,
  };

  if (onClick) {
    return (
      <motion.button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel}
        className={`${cardClass} cursor-pointer text-left disabled:cursor-default`}
        style={mergedStyle}
        transition={{ duration: 0.16, ease: "easeOut" }}
        whileHover={disabled ? undefined : { y: -4 }}
        whileTap={disabled ? undefined : { scale: 0.985 }}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <article
      className={`relative overflow-hidden rounded-[44px] bg-[#080808] ${className}`}
      style={mergedStyle}
    >
      {content}
    </article>
  );
}

function FeatureCardContent({
  feature,
  compact = false,
}: {
  feature: (typeof features)[number];
  compact?: boolean;
}) {
  return (
    <div className="flex h-full flex-col justify-end p-7">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/32">
        {feature.label}
      </p>
      <SharedModalElement
        sharedId={`${feature.id}-title`}
        className={
          compact
            ? "mt-3 text-[34px] font-extrabold leading-none tracking-[-2px]"
            : "mt-3 text-[48px] font-extrabold leading-none tracking-[-3px]"
        }
      >
        {feature.title}
      </SharedModalElement>
      <p className="mt-4 max-w-[320px] text-base font-medium leading-[1.15] text-white/48">
        {feature.description}
      </p>
      <span className="mt-8 w-fit rounded-full bg-white/8 px-4 py-2 text-sm font-bold text-white/70">
        {feature.stat}
      </span>
    </div>
  );
}

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<
    (typeof features)[number] | null
  >(null);
  const [loginOriginEl, setLoginOriginEl] = useState<HTMLElement | null>(null);
  const [registerOriginEl, setRegisterOriginEl] =
    useState<HTMLElement | null>(null);
  const [featureOriginEl, setFeatureOriginEl] = useState<HTMLElement | null>(
    null,
  );
  const [activeOrigin, setActiveOrigin] = useState<AuthOrigin | null>(null);
  const [isModalTransitionLocked, setIsModalTransitionLocked] = useState(false);
  const modalLockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const lockModalTransitions = () => {
    setIsModalTransitionLocked(true);

    if (modalLockTimeoutRef.current) {
      clearTimeout(modalLockTimeoutRef.current);
    }

    modalLockTimeoutRef.current = setTimeout(() => {
      setIsModalTransitionLocked(false);
      modalLockTimeoutRef.current = null;
    }, MODAL_TRANSITION_LOCK_MS);
  };

  useEffect(() => {
    return () => {
      if (modalLockTimeoutRef.current) {
        clearTimeout(modalLockTimeoutRef.current);
      }
    };
  }, []);

  const openLogin = (
    event: MouseEvent<HTMLButtonElement>,
    origin: AuthOrigin,
  ) => {
    if (
      isModalTransitionLocked ||
      isLoginOpen ||
      isRegisterOpen ||
      selectedFeature
    ) {
      return;
    }

    lockModalTransitions();
    setLoginOriginEl(event.currentTarget);
    setActiveOrigin(origin);
    setIsLoginOpen(true);
  };

  const openRegister = (
    event: MouseEvent<HTMLButtonElement>,
    origin: AuthOrigin,
  ) => {
    if (
      isModalTransitionLocked ||
      isLoginOpen ||
      isRegisterOpen ||
      selectedFeature
    ) {
      return;
    }

    lockModalTransitions();
    setRegisterOriginEl(event.currentTarget);
    setActiveOrigin(origin);
    setIsRegisterOpen(true);
  };

  const closeLogin = () => {
    if (isModalTransitionLocked) return;

    lockModalTransitions();
    setIsLoginOpen(false);
    setActiveOrigin(null);
  };

  const closeRegister = () => {
    if (isModalTransitionLocked) return;

    lockModalTransitions();
    setIsRegisterOpen(false);
    setActiveOrigin(null);
  };

  const openFeature = (
    feature: (typeof features)[number],
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    if (isModalTransitionLocked || selectedFeature) return;

    lockModalTransitions();
    setSelectedFeature(feature);
    setFeatureOriginEl(event.currentTarget);
  };

  const closeFeature = () => {
    if (isModalTransitionLocked) return;

    lockModalTransitions();
    setSelectedFeature(null);
  };

  return (
    <SharedModalRoot
      groupId="chest-feature-modals"
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <main className="min-h-screen overflow-y-auto bg-black p-4 text-white">
        <section className="mx-auto w-full max-w-[1440px]">
          <div
            className="grid h-[calc(100dvh-70px)] grid-cols-[1.18fr_0.68fr_0.48fr] grid-rows-2 gap-4"
            style={{
              gridTemplateAreas: `
              "hero center top"
              "hero center mid"
            `,
            }}
          >
            <BentoCard
              className="flex flex-col px-8 pb-8 pt-10"
              showArrow={false}
              style={{ gridArea: "hero" }}
            >
              <div className="flex h-full flex-col justify-center pt-24">
                <h1 className="text-[96px] font-extrabold leading-[0.88] tracking-[-6px]">
                  Chest
                  <br />
                  Licenses
                </h1>
                <p className="mt-6 max-w-[430px] text-[26px] font-semibold leading-[1.05] tracking-[-1px] text-white/58">
                  Your licenses and products, clear and simple in one place.
                </p>
                <div className="mt-10 flex gap-3">
                  <motion.button
                    layoutId={REGISTER_LAYOUT_ID}
                    className="h-11 min-w-[122px] cursor-pointer rounded-full bg-[#e7e7e7] px-6 text-lg font-bold text-black disabled:cursor-default"
                    style={{
                      borderRadius: 9999,
                      pointerEvents:
                        isRegisterOpen || isModalTransitionLocked
                          ? "none"
                          : undefined,
                      visibility:
                        isRegisterOpen && activeOrigin === "hero-register"
                          ? "hidden"
                          : undefined,
                    }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                    whileHover={
                      isModalTransitionLocked
                        ? undefined
                        : { scaleX: 1.08, scaleY: 1.02 }
                    }
                    whileTap={
                      isModalTransitionLocked
                        ? undefined
                        : { scaleX: 1.03, scaleY: 0.98 }
                    }
                    onClick={(event) => openRegister(event, "hero-register")}
                    type="button"
                  >
                    Register
                  </motion.button>
                  <motion.button
                    layoutId={LOGIN_LAYOUT_ID}
                    className="h-11 min-w-[122px] cursor-pointer rounded-full bg-white/8 px-6 text-lg font-bold text-white disabled:cursor-default"
                    style={{
                      borderRadius: 9999,
                      pointerEvents:
                        isLoginOpen || isModalTransitionLocked
                          ? "none"
                          : undefined,
                      visibility:
                        isLoginOpen && activeOrigin === "hero-login"
                          ? "hidden"
                          : undefined,
                    }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                    whileHover={
                      isModalTransitionLocked
                        ? undefined
                        : { scaleX: 1.08, scaleY: 1.02 }
                    }
                    whileTap={
                      isModalTransitionLocked
                        ? undefined
                        : { scaleX: 1.03, scaleY: 0.98 }
                    }
                    onClick={(event) => openLogin(event, "hero-login")}
                    type="button"
                  >
                    Log in
                  </motion.button>
                </div>
              </div>
            </BentoCard>

            <BentoCard
              className="cursor-pointer"
              onClick={(event) => openFeature(features[0], event)}
              hidden={selectedFeature?.id === features[0].id}
              disabled={isModalTransitionLocked}
              ariaLabel={`Open ${features[0].title}`}
              style={{ gridArea: "center" }}
            >
              <FeatureCardContent feature={features[0]} />
            </BentoCard>

            <BentoCard
              onClick={(event) => openFeature(features[1], event)}
              hidden={selectedFeature?.id === features[1].id}
              disabled={isModalTransitionLocked}
              ariaLabel={`Open ${features[1].title}`}
              style={{ gridArea: "top" }}
            >
              <FeatureCardContent feature={features[1]} compact />
            </BentoCard>

            <BentoCard
              onClick={(event) => openFeature(features[2], event)}
              hidden={selectedFeature?.id === features[2].id}
              disabled={isModalTransitionLocked}
              ariaLabel={`Open ${features[2].title}`}
              style={{ gridArea: "mid" }}
            >
              <FeatureCardContent feature={features[2]} compact />
            </BentoCard>
          </div>

          <section className="mt-4 h-[calc(100dvh-32px)]">
            <BentoCard className="h-full px-10" showArrow={false}>
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex items-end justify-center gap-1">
                  <span className="text-[64px] font-extrabold leading-none tracking-[-2px]">
                    $4.99
                  </span>
                  <span className="pb-2 text-[18px] font-bold text-white/90">
                    / month
                  </span>
                </div>

              <motion.button
                className="mt-4 h-10 w-[160px] cursor-pointer rounded-full bg-[#e6e6e6] text-base font-extrabold text-black disabled:cursor-default"
                onClick={(event) => openLogin(event, "buy-now")}
                style={{
                    pointerEvents:
                      isLoginOpen || isModalTransitionLocked
                        ? "none"
                        : undefined,
                    visibility:
                      isLoginOpen && activeOrigin === "buy-now"
                        ? "hidden"
                        : undefined,
                }}
                transition={{ duration: 0.12, ease: "easeOut" }}
                whileHover={
                  isModalTransitionLocked
                    ? undefined
                    : { scaleX: 1.08, scaleY: 1.02 }
                }
                whileTap={
                  isModalTransitionLocked
                    ? undefined
                    : { scaleX: 1.03, scaleY: 0.98 }
                }
                type="button"
              >
                Buy now
              </motion.button>
              </div>
            </BentoCard>
          </section>
        </section>
      </main>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={closeLogin}
        originEl={loginOriginEl}
        layoutId={LOGIN_LAYOUT_ID}
      />
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={closeRegister}
        originEl={registerOriginEl}
        layoutId={REGISTER_LAYOUT_ID}
      />
      <SharedModal
        isOpen={!!selectedFeature}
        onClose={closeFeature}
        originEl={featureOriginEl}
        layoutId={selectedFeature ? `${selectedFeature.id}-modal` : undefined}
        className="h-dvh! max-h-dvh! w-dvw! max-w-dvw! rounded-none! border-0! bg-[#080808]! text-white shadow-none! dark:bg-[#080808]!"
      >
        {selectedFeature ? (
          <section className="flex h-full flex-col overflow-hidden bg-[#080808] text-white">
            <header className="flex items-start justify-between gap-5 px-8 py-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/38">
                  {selectedFeature.label}
                </p>
                <SharedModalElement
                  sharedId={`${selectedFeature.id}-title`}
                  className="mt-3 text-[3.8rem] font-extrabold leading-none tracking-[-3px] text-[#f2eee8]"
                >
                  {selectedFeature.title}
                </SharedModalElement>
              </div>

              <button
                type="button"
                onClick={closeFeature}
                disabled={isModalTransitionLocked}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25"
                aria-label={`Close ${selectedFeature.title}`}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className="grid min-h-0 flex-1 gap-8 overflow-y-auto px-8 pb-8 md:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-h-[420px] rounded-[34px] bg-white/[0.035] p-5">
                <div className="flex h-full flex-col rounded-[26px] bg-[#101010] p-5">
                  <div className="flex items-center justify-between border-b border-white/8 pb-5">
                    <div>
                      <span className="text-sm font-bold text-white/72">
                        Dashboard preview
                      </span>
                      <p className="mt-1 text-sm text-white/32">
                        Image placeholder
                      </p>
                    </div>
                    <span className="h-2.5 w-2.5 rounded-full bg-white/45" />
                  </div>
                  <div className="grid flex-1 gap-3 pt-5 sm:grid-cols-3">
                    <div className="rounded-[18px] bg-white/8" />
                    <div className="rounded-[18px] bg-white/8" />
                    <div className="rounded-[18px] bg-white/8" />
                    <div className="rounded-[18px] bg-white/6 sm:col-span-2" />
                    <div className="rounded-[18px] bg-white/6" />
                  </div>
                </div>
              </div>

              <aside className="self-end pb-4">
                <p className="text-[1.35rem] font-semibold leading-[1.08] tracking-[-0.5px] text-[#f2eee8]">
                  {selectedFeature.description}
                </p>
                <p className="mt-5 text-base leading-6 text-white/38">
                  This space is ready for the real dashboard image once the
                  product screens are finished.
                </p>
              </aside>
            </div>
          </section>
        ) : null}
      </SharedModal>
    </SharedModalRoot>
  );
}
