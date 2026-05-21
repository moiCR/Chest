"use client";

import { XIcon } from "lucide-react";
import { motion, useAnimationControls } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";

type RegisterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  originEl?: HTMLElement | null;
  layoutId?: string;
};

export function RegisterModal({
  isOpen,
  onClose,
  originEl,
  layoutId,
}: RegisterModalProps) {
  const router = useRouter();
  const [username, setUsername] = useState<string>();
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [hasRegisterError, setHasRegisterError] = useState(false);
  const [registerErrorMessage, setRegisterErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorControls = useAnimationControls();

  const resetForm = useCallback(() => {
    setUsername(undefined);
    setEmail(undefined);
    setPassword(undefined);
    setHasRegisterError(false);
    setRegisterErrorMessage("");
    setIsSubmitting(false);
    errorControls.set({ x: 0 });
  }, [errorControls]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const inputClassName = [
    "w-full rounded-xl border bg-black px-4 pb-3 pt-7 text-white/80 outline-none transition",
    hasRegisterError
      ? "border-red-500/80 focus:border-red-400"
      : "border-white/15 focus:border-white/35",
  ].join(" ");

  const resetError = () => {
    setHasRegisterError(false);
    setRegisterErrorMessage("");
  };

  const showRegisterError = async (message: string) => {
    setHasRegisterError(true);
    setRegisterErrorMessage(message);
    await errorControls.start({
      x: [0, -8, 8, -6, 6, -3, 3, 0],
      transition: { duration: 0.36, ease: "easeInOut" },
    });
    errorControls.set({ x: 0 });
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username || !email || !password) {
      await showRegisterError("All fields are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:2005")
        .replace(/^https:\/\/localhost(?=[:/]|$)/, "http://localhost")
        .replace(/\/$/, "");
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null) as {
          message?: string;
        } | null;

        await showRegisterError(data?.message ?? "Unable to create account. Please try again.");
        return;
      }

      const data = await response.json() as {
        token?: string;
        newUser?: unknown;
      };

      if (!data.token) {
        await showRegisterError("Unable to create account. Please try again.");
        return;
      }

      localStorage.setItem("authToken", data.token);

      if (data.newUser) {
        localStorage.setItem("authUser", JSON.stringify(data.newUser));
      }

      handleClose();
      router.push("/dashboard");
    } catch {
      await showRegisterError("Unable to connect. Please try again.");
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
          <button className="cursor-pointer rounded-full p-2 hover:bg-white/10" onClick={handleClose}>
            <XIcon size={18} />
          </button>
        </section>

        <section className="flex min-h-0 flex-1 items-center justify-center">
          <div className="flex w-full max-w-md flex-col items-start text-left">
            <h1 className="text-4xl font-bold text-white/80">
              Create account
            </h1>

            <form className="mt-8 flex w-full flex-col gap-4" onSubmit={handleRegister}>
              <motion.div animate={errorControls} className="relative">
                <label
                  htmlFor="register-username"
                  className="absolute left-4 top-2 text-xs text-white/45"
                >
                  Username
                </label>
                <input
                  id="register-username"
                  type="text"
                  name="username"
                  value={username ?? ""}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    resetError();
                  }}
                  aria-invalid={hasRegisterError}
                  className={inputClassName}
                />
              </motion.div>

              <motion.div animate={errorControls} className="relative">
                <label
                  htmlFor="register-email"
                  className="absolute left-4 top-2 text-xs text-white/45"
                >
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  value={email ?? ""}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    resetError();
                  }}
                  aria-invalid={hasRegisterError}
                  className={inputClassName}
                />
              </motion.div>

              <motion.div animate={errorControls} className="relative">
                <label
                  htmlFor="register-password"
                  className="absolute left-4 top-2 text-xs text-white/45"
                >
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  name="password"
                  value={password ?? ""}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    resetError();
                  }}
                  aria-invalid={hasRegisterError}
                  aria-describedby={registerErrorMessage ? "register-error" : undefined}
                  className={inputClassName}
                />
              </motion.div>

              {registerErrorMessage ? (
                <p
                  id="register-error"
                  className="-mt-2 text-xs leading-none text-red-400"
                  role="alert"
                >
                  {registerErrorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-16 w-full cursor-pointer rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/65"
              >
                Create account
              </button>
            </form>
          </div>
        </section>
      </div>
    </Modal>
  );
}
