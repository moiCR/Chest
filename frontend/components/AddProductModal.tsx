"use client";

import { XIcon } from "lucide-react";
import { motion, useAnimationControls } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useCallback, useState, type FormEvent } from "react";

type AddProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  layoutId?: string;
};

const productTypeOptions = [
  { label: "Plugin", value: "plugin" },
  { label: "Mod", value: "mod" },
];

export function AddProductModal({
  isOpen,
  onClose,
  anchorEl,
  layoutId,
}: AddProductModalProps) {
  const [name, setName] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [version, setVersion] = useState<string>();
  const [type, setType] = useState<string>("plugin");
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorControls = useAnimationControls();

  const resetForm = useCallback(() => {
    setName(undefined);
    setDescription(undefined);
    setVersion(undefined);
    setType("plugin");
    setHasError(false);
    setErrorMessage("");
    setIsSubmitting(false);
    errorControls.set({ x: 0 });
  }, [errorControls]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const inputClassName = [
    "w-full rounded-xl border bg-black px-4 pb-3 pt-7 text-white/80 outline-none transition",
    hasError
      ? "border-red-500/80 focus:border-red-400"
      : "border-white/15 focus:border-white/35",
  ].join(" ");

  const resetError = () => {
    setHasError(false);
    setErrorMessage("");
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name || !version) {
      await showError("Name and version are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = (
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3312"
      )
        .replace(/^https:\/\/localhost(?=[:/]|$)/, "http://localhost")
        .replace(/\/$/, "");

      const formData = new FormData();
      formData.append("name", name);
      formData.append("version", version);
      formData.append("category", type);
      if (description) {
        formData.append("description", description);
      }

      const token = localStorage.getItem("authToken");

      const response = await fetch(`${apiUrl}/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;

        await showError(
          data?.message ?? "Unable to create product. Please try again.",
        );
        return;
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
      anchorEl={anchorEl}
      className="rounded-[32px]! border-none bg-black p-4 text-white shadow-[0_22px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]! dark:bg-black"
      isOpen={isOpen}
      layoutId={layoutId}
      onClose={handleClose}
    >
      <div className="flex w-96 flex-col">
        <header className="flex items-center justify-between gap-3">
          <h2 className="px-2 text-lg font-semibold text-white">Add product</h2>
          <button
            aria-label="Close"
            className="cursor-pointer rounded-full p-2 text-white/70 transition duration-300 hover:bg-white/10 hover:text-white"
            onClick={handleClose}
            type="button"
          >
            <XIcon size={18} />
          </button>
        </header>

        <form className="mt-3 flex flex-col gap-3" onSubmit={handleSubmit}>
          <motion.div animate={errorControls} className="relative">
            <label
              htmlFor="product-name"
              className="absolute left-4 top-2 text-xs text-white/45"
            >
              Name
            </label>
            <input
              id="product-name"
              type="text"
              name="name"
              value={name ?? ""}
              onChange={(event) => {
                setName(event.target.value);
                resetError();
              }}
              aria-invalid={hasError}
              className={inputClassName}
            />
          </motion.div>

          <motion.div animate={errorControls} className="relative">
            <label
              htmlFor="product-description"
              className="absolute left-4 top-2 text-xs text-white/45"
            >
              Description
            </label>
            <textarea
              id="product-description"
              name="description"
              value={description ?? ""}
              onChange={(event) => {
                setDescription(event.target.value);
                resetError();
              }}
              rows={2}
              aria-invalid={hasError}
              className={`${inputClassName} resize-none`}
            />
          </motion.div>

          <div className="flex gap-3">
            <motion.div animate={errorControls} className="relative flex-1">
              <label
                htmlFor="product-version"
                className="absolute left-4 top-2 text-xs text-white/45"
              >
                Version
              </label>
              <input
                id="product-version"
                type="text"
                name="version"
                value={version ?? ""}
                onChange={(event) => {
                  setVersion(event.target.value);
                  resetError();
                }}
                aria-invalid={hasError}
                className={inputClassName}
              />
            </motion.div>

            <motion.div animate={errorControls} className="w-32">
              <Select
                options={productTypeOptions}
                value={type}
                onValueChange={setType}
                label="Type"
                placeholder="Type"
              />
            </motion.div>
          </div>

          {errorMessage ? (
            <p
              id="product-error"
              className="-mt-1 text-xs leading-none text-red-400"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-14 w-full cursor-pointer rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/65"
          >
            Create product
          </button>
        </form>
      </div>
    </Modal>
  );
}
