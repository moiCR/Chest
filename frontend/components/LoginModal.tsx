"use client";

import { XIcon } from "lucide-react";
import { motion, useAnimationControls } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";

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
  const router = useRouter();
  const [username, setUsername] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [hasLoginError, setHasLoginError] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorControls = useAnimationControls();

  const resetForm = useCallback(() => {
    setUsername(undefined);
    setPassword(undefined);
    setHasLoginError(false);
    setLoginErrorMessage("");
    setIsSubmitting(false);
    errorControls.set({ x: 0 });
  }, [errorControls]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const inputClassName = [
    "w-full rounded-xl border bg-black px-4 pb-3 pt-7 text-white/80 outline-none transition",
    hasLoginError
      ? "border-red-500/80 focus:border-red-400"
      : "border-white/15 focus:border-white/35",
  ].join(" ");

  const showLoginError = async (message: string) => {
    setHasLoginError(true);
    setLoginErrorMessage(message);
    await errorControls.start({
      x: [0, -8, 8, -6, 6, -3, 3, 0],
      transition: { duration: 0.36, ease: "easeInOut" },
    });
    errorControls.set({ x: 0 });
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username || !password) {
      await showLoginError("All fields are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = (
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:2005"
      )
        .replace(/^https:\/\/localhost(?=[:/]|$)/, "http://localhost")
        .replace(/\/$/, "");
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;

        await showLoginError(
          data?.message ?? "Unable to log in. Please try again.",
        );
        return;
      }

      const data = (await response.json()) as {
        token?: string;
        user?: unknown;
      };

      if (!data.token) {
        await showLoginError("Unable to log in. Please try again.");
        return;
      }

      localStorage.setItem("authToken", data.token);

      if (data.user) {
        localStorage.setItem("authUser", JSON.stringify(data.user));
      }

      setHasLoginError(false);
      handleClose();
      router.push("/dashboard");
    } catch {
      await showLoginError("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      originEl={originEl}
      layoutId={layoutId}
      className="rounded-[42px]! bg-bg-black text-white/80 border-none p-4 shadow-none! dark:bg-black"
    >
      <div className="flex min-h-200 min-w-200 flex-col">
        <section className="flex shrink-0 flex-row items-center justify-end">
          <button
            className="cursor-pointer rounded-full p-2 hover:bg-white/10"
            onClick={handleClose}
          >
            <XIcon size={18} />
          </button>
        </section>

        <section className="flex min-h-0 flex-1 items-center justify-center">
          <div className="flex w-full max-w-md flex-col items-start text-left">
            <h1 className="text-4xl text-white/80 font-bold">Welcome back</h1>

            <form
              className="mt-8 flex w-full flex-col gap-4"
              onSubmit={handleLogin}
            >
              <motion.div animate={errorControls} className="relative">
                <label
                  htmlFor="login-username"
                  className="absolute left-4 top-2 text-xs text-white/45"
                >
                  Username
                </label>
                <input
                  id="login-username"
                  type="text"
                  value={username ?? ""}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setHasLoginError(false);
                    setLoginErrorMessage("");
                  }}
                  aria-invalid={hasLoginError}
                  className={inputClassName}
                />
              </motion.div>
              <motion.div animate={errorControls} className="relative">
                <label
                  htmlFor="login-password"
                  className="absolute left-4 top-2 text-xs text-white/45"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  value={password ?? ""}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setHasLoginError(false);
                    setLoginErrorMessage("");
                  }}
                  aria-invalid={hasLoginError}
                  aria-describedby={
                    loginErrorMessage ? "login-error" : undefined
                  }
                  className={inputClassName}
                />
              </motion.div>
              {loginErrorMessage && (
                <div className="-mt-2 min-h-4">
                  <p
                    id="login-error"
                    className={[
                      "text-xs leading-none text-red-400 transition-opacity",
                      loginErrorMessage ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                    role="alert"
                  >
                    {loginErrorMessage}
                  </p>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-16 w-full cursor-pointer rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/65"
              >
                Login In
              </button>
              <button
                type="button"
                className="cursor-pointer self-start text-sm text-white/50 transition hover:text-white/80"
              >
                Forgot your password?{" "}
                <span className="text-white/80">Reset it now</span>
              </button>
            </form>
          </div>
        </section>
      </div>
    </Modal>
  );
}
