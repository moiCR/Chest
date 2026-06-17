"use client";

import { XIcon, Upload } from "lucide-react";
import { motion, useAnimationControls } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { useCallback, useRef, useState, type FormEvent } from "react";

type AddUpdateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  originEl?: HTMLElement | null;
  layoutId?: string;
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

const typeColors: Record<string, string> = {
  major: "bg-red-500/15 text-red-400 border-red-500/25",
  minor: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  patch: "bg-green-500/15 text-green-400 border-green-500/25",
  hotfix: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
};

export function AddUpdateModal({
  isOpen,
  onClose,
  productId,
  originEl,
  layoutId,
}: AddUpdateModalProps) {
  const [title, setTitle] = useState<string>("");
  const [version, setVersion] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [type, setType] = useState<string>("minor");
  const [branch, setBranch] = useState<string>("release");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorControls = useAnimationControls();

  const resetForm = useCallback(() => {
    setTitle("");
    setVersion("");
    setDescription("");
    setType("minor");
    setBranch("release");
    setFile(null);
    setHasError(false);
    setErrorMessage("");
    setIsSubmitting(false);
    errorControls.set({ x: 0 });
  }, [errorControls]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
      formData.append("branch", branch);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      originEl={originEl}
      layoutId={layoutId}
      className="rounded-[42px]! bg-black text-white/80 border-none p-4 shadow-[0_22px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]! dark:bg-black"
    >
      <div className="flex min-h-200 w-[70rem] flex-col">
        <section className="flex shrink-0 flex-row items-center justify-end">
          <button
            className="cursor-pointer rounded-full p-2 hover:bg-white/10"
            onClick={handleClose}
          >
            <XIcon size={18} />
          </button>
        </section>

        <section className="flex min-h-0 flex-1 items-center justify-center">
          <div className="flex w-full gap-10">
            <div className="flex flex-1 flex-col items-start text-left">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold leading-none text-white/80">Create update</h1>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                  title={file ? file.name : "Upload file (.jar)"}
                >
                  <Upload size={18} />
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
              </div>
              {file && (
                <p className="mt-2 text-sm text-white/60">{file.name}</p>
              )}

              <form
                className="mt-8 flex w-full flex-col gap-4"
                onSubmit={handleSubmit}
              >
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
                    htmlFor="update-description"
                    className="absolute left-4 top-2 text-xs text-white/45"
                  >
                    Description (Markdown)
                  </label>
                  <textarea
                    id="update-description"
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      resetError();
                    }}
                    placeholder="Write your changelog in Markdown..."
                    rows={5}
                    aria-invalid={hasError}
                    className={[
                      "w-full rounded-xl border bg-black px-4 pb-3 pt-7 font-mono text-sm text-white/80 outline-none transition resize-none",
                      hasError
                        ? "border-red-500/80 focus:border-red-400"
                        : "border-white/15 focus:border-white/35",
                    ].join(" ")}
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
                  className="h-14 w-full cursor-pointer rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/65"
                >
                  {isSubmitting ? "Creating..." : "Create update"}
                </button>
              </form>
            </div>

            <div className="flex flex-1 flex-col">
              <div className="mb-3 flex items-center gap-2">
                {version && (
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs font-semibold text-white/70">
                    v{version}
                  </span>
                )}
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    typeColors[type as keyof typeof typeColors] ??
                    "border-white/10 bg-white/5 text-white/50"
                  }`}
                >
                  {type}
                </span>
              </div>

              <h2 className="mb-4 text-lg font-semibold text-white/85">
                {title || "Update title"}
              </h2>

              <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/15 bg-black/50 p-5 text-sm">
                {description ? (
                  <MarkdownPreview content={description} />
                ) : (
                  <p className="text-white/30">
                    Start typing a description to see the preview here...
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}