"use client";

import { X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  originEl?: HTMLElement | null;
  layoutId?: string;
};

export function LoginModal({
  isOpen,
  onClose,
  originEl,
  layoutId,
}: LoginModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      originEl={originEl}
      layoutId={layoutId}
      className="h-auto max-h-[min(88dvh,760px)] w-[min(92dvw,460px)] rounded-[30px]! border border-white/10! bg-black! text-white shadow-[0_24px_70px_rgba(0,0,0,0.5)]! dark:bg-black!"
    >
      <section className="flex max-h-[min(88dvh,760px)] flex-col overflow-hidden text-white">
        <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Chest Licenses
            </p>
            <h2 className="mt-2 text-[2.15rem] font-semibold leading-none text-[#f2eee8]">
              Log in
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25"
            aria-label="Close login modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="overflow-y-auto px-4 pb-4">
          <div className="rounded-[28px] border border-white/6 bg-[#1b1b1f] px-6 py-6">
            <p className="text-[1rem] leading-[1.2] text-[#8d91a6]">
              Access your licenses, activations and customers from one panel.
            </p>

            <form
              className="mt-6 space-y-3 text-left"
              onSubmit={(event) => event.preventDefault()}
            >
              <input
                type="email"
                placeholder="Email"
                className="h-[52px] w-full rounded-[18px] border border-white/10 bg-white/6 px-4 text-base text-white outline-none transition placeholder:text-white/32 focus:border-white/30"
              />
              <input
                type="password"
                placeholder="Password"
                className="h-[52px] w-full rounded-[18px] border border-white/10 bg-white/6 px-4 text-base text-white outline-none transition placeholder:text-white/32 focus:border-white/30"
              />

              <button
                type="submit"
                className="mt-2 h-12 w-full rounded-full bg-[#f5f5f5] text-[0.95rem] font-semibold text-black transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </section>
    </Modal>
  );
}
