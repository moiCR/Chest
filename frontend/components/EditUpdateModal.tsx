"use client";

import { XIcon, Upload } from "lucide-react";
import { motion, useAnimationControls } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { useEffect, useRef, useState, type FormEvent } from "react";

type EditUpdateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  update: {
    id: string;
    title: string;
    version: string;
    description: string;
    type: string;
    branch: string;
  } | null;
  originEl?: HTMLElement | null;
};

const updateTypeOptions = [
  { label: "Major", value: "major" },
  { label: "Minor", value: "minor" },
  { label: "Patch", value: "patch" },
  { label: "Hotfix", value: "hotfix" },
];

const branchOptions = [
  { label: "Release", value: "release" },
  { label: "Beta", value: "beta" },
];

export function EditUpdateModal({
  isOpen,
  onClose,
  productId,
  update,
  originEl,
}: EditUpdateModalProps) {
  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("minor");
  const [branch, setBranch] = useState("release");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const errorControls = useAnimationControls();

  useEffect(() => {
    if (isOpen && update) {
      setTitle(update.title);
      setVersion(update.version);
      setDescription(update.description);
      setType(update.type);
      setBranch(update.branch);
      setFile(null);
      setShowPreview(false);
      setHasError(false);
      setErrorMessage("");
      setIsSubmitting(false);
      errorControls.set({ x: 0 });
    }
  }, [isOpen, update, errorControls]);

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

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title || !version) {
      await showError("Title and version are required");
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
      formData.append("title", title);
      formData.append("version", version);
      formData.append("type", type);
      formData.append("branch", branch);
      if (description) {
        formData.append("description", description);
      }
      if (file) {
        formData.append("file", file);
      }

      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `${apiUrl}/products/${productId}/updates/${update?.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;

        await showError(
          data?.message ?? "Unable to update. Please try again.",
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

  if (!update) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      originEl={originEl}
      className="rounded-[42px]! bg-black text-white/80 border-none p-4 shadow-[0_22px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]! dark:bg-black"
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
          <div className="flex w-full max-w-2xl flex-col items-start text-left">
            <h1 className="text-4xl font-bold text-white/80">Edit update</h1>

            <form
              className="mt-8 flex w-full flex-col gap-4"
              onSubmit={handleSubmit}
            >
              <motion.div animate={errorControls} className="relative">
                <label
                  htmlFor="edit-title"
                  className="absolute left-4 top-2 text-xs text-white/45"
                >
                  Title
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    resetError();
                  }}
                  aria-invalid={hasError}
                  className={[
                    "w-full rounded-xl border bg-black px-4 pb-3 pt-7 text-white/80 outline-none transition",
                    hasError
                      ? "border-red-500/80 focus:border-red-400"
                      : "border-white/15 focus:border-white/35",
                  ].join(" ")}
                />
              </motion.div>

              <div className="flex gap-3">
                <motion.div animate={errorControls} className="relative flex-1">
                  <label
                    htmlFor="edit-version"
                    className="absolute left-4 top-2 text-xs text-white/45"
                  >
                    Version
                  </label>
                  <input
                    id="edit-version"
                    type="text"
                    value={version}
                    onChange={(event) => {
                      setVersion(event.target.value);
                      resetError();
                    }}
                    aria-invalid={hasError}
                    className={[
                      "w-full rounded-xl border bg-black px-4 pb-3 pt-7 text-white/80 outline-none transition",
                      hasError
                        ? "border-red-500/80 focus:border-red-400"
                        : "border-white/15 focus:border-white/35",
                    ].join(" ")}
                  />
                </motion.div>

                <motion.div animate={errorControls} className="w-36">
                  <Select
                    options={updateTypeOptions}
                    value={type}
                    onValueChange={setType}
                    label="Type"
                    placeholder="Type"
                  />
                </motion.div>

                <motion.div animate={errorControls} className="w-36">
                  <Select
                    options={branchOptions}
                    value={branch}
                    onValueChange={setBranch}
                    label="Branch"
                    placeholder="Branch"
                  />
                </motion.div>
              </div>

              <motion.div animate={errorControls} className="relative">
                <label
                  htmlFor="edit-description"
                  className="absolute left-4 top-2 text-xs text-white/45"
                >
                  Description (Markdown)
                </label>
                <textarea
                  id="edit-description"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    resetError();
                  }}
                  rows={6}
                  aria-invalid={hasError}
                  className={[
                    "w-full rounded-xl border bg-black px-4 pb-3 pt-7 font-mono text-sm text-white/80 outline-none transition resize-none",
                    hasError
                      ? "border-red-500/80 focus:border-red-400"
                      : "border-white/15 focus:border-white/35",
                  ].join(" ")}
                />
              </motion.div>

              <motion.div animate={errorControls}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-14 w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-black px-4 text-sm text-white/45 transition hover:border-white/35 hover:text-white/70"
                >
                  <Upload size={16} />
                  <span className="truncate">
                    {file ? file.name : "Upload new file (optional)"}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jar"
                  className="hidden"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    resetError();
                  }}
                />
              </motion.div>

              {errorMessage ? (
                <p
                  id="edit-error"
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
                {isSubmitting ? "Saving..." : "Save changes"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </Modal>
  );
}