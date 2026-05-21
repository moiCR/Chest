"use client";

import { Modal } from "@/components/ui/Modal";
import { XIcon } from "lucide-react";
import { motion, useAnimationControls } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";

type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  initialUsername?: string;
  originEl?: HTMLElement | null;
};

export function EditProfileModal({
  isOpen,
  onClose,
  initialEmail = "",
  initialUsername = "",
  originEl,
}: EditProfileModalProps) {
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorControls = useAnimationControls();

  useEffect(() => {
    if (!isOpen) return;

    window.requestAnimationFrame(() => {
      setUsername(initialUsername);
      setEmail(initialEmail);
      setPassword("");
      setHasError(false);
      setErrorMessage("");
      setIsSubmitting(false);
      errorControls.set({ x: 0 });
    });
  }, [errorControls, initialEmail, initialUsername, isOpen]);

  const resetError = () => {
    setHasError(false);
    setErrorMessage("");
  };

  const handleClose = () => {
    setPassword("");
    resetError();
    onClose();
  };

  const showError = async (message: string) => {
    setHasError(true);
    setErrorMessage(message);
    await errorControls.start({
      x: [0, -8, 8, -6, 6, -3, 3, 0],
      transition: { duration: 0.36, ease: "easeInOut" },
    });
    errorControls.set({ x: 0 });
  };

  const inputClassName = [
    "h-16 w-full rounded-xl border bg-black px-4 pb-3 pt-7 text-white/80 outline-none transition",
    hasError
      ? "border-red-500/80 focus:border-red-400"
      : "border-white/15 focus:border-white/35",
  ].join(" ");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username && !email && !password) {
      await showError("At least one field is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        await showError("Your session expired. Please log in again.");
        return;
      }

      const apiUrl = (
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:2005"
      )
        .replace(/^https:\/\/localhost(?=[:/]|$)/, "http://localhost")
        .replace(/\/$/, "");

      const response = await fetch(`${apiUrl}/auth/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          ...(password ? { password } : {}),
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;

        await showError(data?.message ?? "Unable to update profile.");
        return;
      }

      const data = (await response.json()) as {
        token?: string;
        user?: unknown;
      };

      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }

      if (data.user) {
        localStorage.setItem("authUser", JSON.stringify(data.user));
      }

      handleClose();
    } catch {
      await showError("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      className="rounded-[42px]! border-none bg-black p-4 text-white shadow-[0_22px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]! dark:bg-black"
      isOpen={isOpen}
      isSecondaryModal
      onClose={handleClose}
      originEl={originEl}
    >
      <div className="flex w-[min(680px,calc(100dvw-32px))] flex-col">
        <header className="flex shrink-0 items-center justify-between gap-4">
          <div className="px-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/38">
              Account
            </p>
            <h2 className="mt-3 text-4xl font-bold leading-none text-white/80">
              Edit profile
            </h2>
          </div>
          <button
            aria-label="Close edit profile"
            className="cursor-pointer rounded-full p-2 text-white/70 transition duration-300 hover:bg-white/10 hover:text-white"
            onClick={handleClose}
            type="button"
          >
            <XIcon size={18} />
          </button>
        </header>

        <form
          className="mt-8 flex flex-col px-2 pb-2"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <motion.div animate={errorControls} className="relative">
              <label
                className="absolute left-4 top-2 text-xs text-white/45"
                htmlFor="profile-username"
              >
                Username
              </label>
              <input
                aria-invalid={hasError}
                className={inputClassName}
                id="profile-username"
                onChange={(event) => {
                  setUsername(event.target.value);
                  resetError();
                }}
                type="text"
                value={username}
              />
            </motion.div>

            <motion.div animate={errorControls} className="relative">
              <label
                className="absolute left-4 top-2 text-xs text-white/45"
                htmlFor="profile-email"
              >
                Email
              </label>
              <input
                aria-invalid={hasError}
                className={inputClassName}
                id="profile-email"
                onChange={(event) => {
                  setEmail(event.target.value);
                  resetError();
                }}
                type="email"
                value={email}
              />
            </motion.div>

            <motion.div
              animate={errorControls}
              className="relative md:col-span-2"
            >
              <label
                className="absolute left-4 top-2 text-xs text-white/45"
                htmlFor="profile-password"
              >
                New password
              </label>
              <input
                aria-describedby={errorMessage ? "profile-error" : undefined}
                aria-invalid={hasError}
                className={inputClassName}
                id="profile-password"
                onChange={(event) => {
                  setPassword(event.target.value);
                  resetError();
                }}
                placeholder="Leave empty to keep current"
                type="password"
                value={password}
              />
            </motion.div>
          </div>

          <div className="mt-3 min-h-4">
            {errorMessage ? (
              <p
                className="text-xs leading-none text-red-400"
                id="profile-error"
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
            <button
              className="h-14 cursor-pointer rounded-xl bg-white/6 px-5 text-sm font-medium text-white/78 transition duration-300 hover:bg-white/10 hover:text-white"
              onClick={handleClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="h-14 flex-1 cursor-pointer rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/65"
              disabled={isSubmitting}
              type="submit"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
