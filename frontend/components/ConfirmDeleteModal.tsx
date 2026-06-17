"use client";

import { Trash2, XIcon } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

type ConfirmDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  updateTitle?: string;
  anchorEl?: HTMLElement | null;
};

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  updateTitle,
  anchorEl,
}: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <Modal
      anchorEl={anchorEl}
      className="rounded-[32px]! border-none bg-black p-4 text-white shadow-[0_22px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]! dark:bg-black"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="flex w-80 flex-col">
        <header className="flex items-center justify-between gap-3">
          <h2 className="px-2 text-lg font-semibold text-white">Delete update</h2>
          <button
            aria-label="Close"
            className="cursor-pointer rounded-full p-2 text-white/70 transition duration-300 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <XIcon size={18} />
          </button>
        </header>

        <div className="mt-4 px-2 text-sm text-white/60">
          Are you sure you want to delete
          {updateTitle ? (
            <span className="font-medium text-white"> &ldquo;{updateTitle}&rdquo;</span>
          ) : null}
          {"?"} This action cannot be undone.
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-medium text-white transition duration-300 hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-red-500/50"
            disabled={isDeleting}
            onClick={handleDelete}
            type="button"
          >
            <Trash2 size={16} />
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
          <button
            className="flex h-12 cursor-pointer items-center justify-center rounded-xl bg-white/6 text-sm font-medium text-white/70 transition duration-300 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}