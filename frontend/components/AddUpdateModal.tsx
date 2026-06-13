"use client";

import { XIcon, Plus, Upload } from "lucide-react";
import { motion, useAnimationControls } from "motion/react";
import { SharedModal, SharedModalElement, SharedModalRoot } from "@/components/ui/SharedModal";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { Select } from "@/components/ui/Select";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

type AddUpdateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  anchorEl?: HTMLElement | null;
  layoutId?: string;
};

const updateTypeOptions = [
  { label: "Major", value: "major" },
  { label: "Minor", value: "minor" },
  { label: "Patch", value: "patch" },
  { label: "Hotfix", value: "hotfix" },
];

export function AddUpdateModal({
  isOpen,
  onClose,
  productId,
  anchorEl,
  layoutId,
}: AddUpdateModalProps) {
  const [title, setTitle] = useState<string>("");
  const [version, setVersion] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [type, setType] = useState<string>("minor");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const errorControls = useAnimationControls();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resetForm = useCallback(() => {
    setTitle("");
    setVersion("");
    setDescription("");
    setType("minor");
    setFile(null);
    setShowPreview(false);
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

    if (!title || !version || !file) {
      await showError("Title, version and file are required");
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
      if (description) {
        formData.append("description", description);
      }
      formData.append("file", file);

      const token = localStorage.getItem("authToken");

      const response = await fetch(`${apiUrl}/products/${productId}/updates`, {
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
          data?.message ?? "Unable to create update. Please try again.",
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

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  return (
    <SharedModalRoot
      groupId="add-update-modal"
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <SharedModal
        isOpen={isOpen}
        onClose={handleClose}
        originEl={anchorEl}
        layoutId={layoutId}
        className="h-dvh! max-h-dvh! w-dvw! max-w-dvw! rounded-none! border-0! bg-[#080808]! text-white shadow-none! dark:bg-[#080808]!"
      >
        <section className="flex h-full flex-col overflow-hidden bg-[#080808] text-white">
          <header className="flex items-start justify-between gap-5 px-8 py-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/38">
                New Update
              </p>
              <SharedModalElement
                sharedId="add-update-title"
                className="mt-3 text-[3.8rem] font-extrabold leading-none tracking-[-3px] text-[#f2eee8]"
              >
                Create Update
              </SharedModalElement>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25"
              aria-label="Close"
            >
              <XIcon size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="grid min-h-0 flex-1 gap-8 overflow-y-auto px-8 pb-8 lg:grid-cols-2">
            <form className="flex flex-1 flex-col gap-4" onSubmit={handleSubmit}>
              <motion.div animate={errorControls} className="relative">
                <label
                  htmlFor="update-title"
                  className="absolute left-4 top-2 text-xs text-white/45"
                >
                  Title
                </label>
                <input
                  id="update-title"
                  type="text"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    resetError();
                  }}
                  aria-invalid={hasError}
                  className={inputClassName}
                />
              </motion.div>

              <div className="flex gap-3">
                <motion.div animate={errorControls} className="relative flex-1">
                  <label
                    htmlFor="update-version"
                    className="absolute left-4 top-2 text-xs text-white/45"
                  >
                    Version
                  </label>
                  <input
                    id="update-version"
                    type="text"
                    value={version}
                    onChange={(event) => {
                      setVersion(event.target.value);
                      resetError();
                    }}
                    placeholder="1.0.0"
                    aria-invalid={hasError}
                    className={inputClassName}
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
              </div>

              <motion.div animate={errorControls} className="relative flex flex-1 flex-col">
                <div className="flex items-center justify-between px-1 pb-2">
                  <label
                    htmlFor="update-description"
                    className="text-xs text-white/45"
                  >
                    Description (Markdown)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs text-white/50 transition hover:text-white/80"
                  >
                    {showPreview ? "Edit" : "Preview"}
                  </button>
                </div>
                {showPreview ? (
                  <div className="flex-1 overflow-y-auto rounded-xl border border-white/15 bg-black p-4 text-sm">
                    <MarkdownPreview content={description} />
                  </div>
                ) : (
                  <textarea
                    ref={textareaRef}
                    id="update-description"
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      resetError();
                    }}
                    placeholder="Write your changelog in Markdown..."
                    aria-invalid={hasError}
                    className={`${inputClassName} flex-1 resize-none font-mono text-sm`}
                  />
                )}
              </motion.div>

              <motion.div animate={errorControls}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-14 w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-black px-4 text-sm text-white/45 transition hover:border-white/35 hover:text-white/70"
                >
                  <Upload size={16} />
                  <span className="truncate">
                    {file ? file.name : "Upload file (.jar)"}
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
                  id="update-error"
                  className="-mt-1 text-xs leading-none text-red-400"
                  role="alert"
                >
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-14 w-full shrink-0 cursor-pointer rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/65"
              >
                {isSubmitting ? "Creating..." : "Create Update"}
              </button>
            </form>

            <div className="hidden flex-col lg:flex">
              <div className="mb-2 px-1 text-xs text-white/40">Live Preview</div>
              <div className="flex-1 overflow-y-auto rounded-xl border border-white/15 bg-black p-6">
                <h3 className="text-lg font-semibold text-white/90">{title || "Update Title"}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-xs text-white/60">
                    v{version || "0.0.0"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase text-white/50">
                    {type}
                  </span>
                </div>
                <div className="mt-4 border-t border-white/10 pt-4">
                  <MarkdownPreview content={description} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </SharedModal>
    </SharedModalRoot>
  );
}
