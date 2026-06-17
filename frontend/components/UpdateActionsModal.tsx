"use client";

import { Pencil, Trash2, XIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

type UpdateActionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  anchorEl?: HTMLElement | null;
  layoutId?: string;
};

export function UpdateActionsModal({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  anchorEl,
  layoutId,
}: UpdateActionsModalProps) {
  return (
    <Modal
      anchorEl={anchorEl}
      className="rounded-[32px]! border-none bg-black p-4 text-white shadow-[0_22px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]! dark:bg-black"
      isOpen={isOpen}
      layoutId={layoutId}
      onClose={onClose}
    >
      <div className="flex w-72 flex-col">
        <header className="flex items-center justify-between gap-3">
          <h2 className="px-2 text-lg font-semibold text-white">Actions</h2>
          <button
            aria-label="Close"
            className="cursor-pointer rounded-full p-2 text-white/70 transition duration-300 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <XIcon size={18} />
          </button>
        </header>

        <div className="mt-3 flex flex-col gap-2">
          <button
            className="flex h-12 cursor-pointer items-center gap-3 rounded-xl bg-white/6 px-4 text-left text-sm font-medium text-white/78 transition-colors duration-300 hover:bg-white/10 hover:text-white"
            onClick={() => {
              onClose();
              onEdit();
            }}
            type="button"
          >
            <Pencil size={17} />
            Edit update
          </button>
          <button
            className="flex h-12 cursor-pointer items-center gap-3 rounded-xl bg-red-500 px-4 text-left text-sm font-medium text-white transition duration-300 hover:bg-red-400"
            onClick={() => {
              onClose();
              onDelete();
            }}
            type="button"
          >
            <Trash2 size={17} />
            Delete update
          </button>
        </div>
      </div>
    </Modal>
  );
}