"use client";

import { EditProfileModal } from "@/components/EditProfileModal";
import { LogOutIcon, UserRoundPenIcon, XIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Modal } from "./ui/Modal";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  layoutId?: string;
};

type StoredUser = {
  username?: string;
  email?: string;
};

export default function SettingsModal({
  isOpen,
  onClose,
  anchorEl,
  layoutId,
}: SettingsModalProps) {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    email: "",
    username: "",
  });
  const [editProfileOriginEl, setEditProfileOriginEl] =
    useState<HTMLElement | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    onClose();
    window.location.href = "/";
  };

  const handleOpenEditProfile = () => {
    const storedUser = localStorage.getItem("authUser");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as StoredUser;
        setProfileDraft({
          email: user.email ?? "",
          username: user.username ?? "",
        });
      } catch {
        setProfileDraft({ email: "", username: "" });
      }
    } else {
      setProfileDraft({ email: "", username: "" });
    }

    setIsEditProfileOpen(true);
  };

  return (
    <>
      <Modal
        anchorEl={anchorEl}
        className="rounded-4xl! border-none bg-black p-4 text-white shadow-[0_22px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]! dark:bg-black"
        isOpen={isOpen}
        layoutId={layoutId}
        onClose={onClose}
      >
        <div className="flex w-80 flex-col">
          <header className="flex items-center justify-between gap-3">
            <h2 className="px-2 text-lg font-semibold text-white">Options</h2>
            <button
              aria-label="Close settings"
              className="cursor-pointer rounded-full p-2 text-white/70 transition duration-300 hover:bg-white/10 hover:text-white"
              onClick={onClose}
              type="button"
            >
              <XIcon size={18} />
            </button>
          </header>

          <div className="mt-3 flex flex-col gap-2">
            <motion.button
              className="flex h-12 cursor-pointer items-center gap-3 rounded-xl bg-white/6 px-4 text-left text-sm font-medium text-white/78 transition-colors duration-300 hover:bg-white/10 hover:text-white"
              layoutId="edit-profile-modal"
              style={{
                borderRadius: 12,
                opacity: isEditProfileOpen ? 0 : 1,
                pointerEvents: isEditProfileOpen ? "none" : undefined,
              }}
              onClick={(event) => {
                setEditProfileOriginEl(event.currentTarget);
                handleOpenEditProfile();
              }}
              onPointerDown={(event) =>
                setEditProfileOriginEl(event.currentTarget)
              }
              transition={{ duration: 0.12, ease: "easeOut" }}
              type="button"
              whileTap={{ scale: 0.98 }}
            >
              <UserRoundPenIcon size={17} />
              Edit profile
            </motion.button>
            <button
              className="flex h-12 cursor-pointer items-center gap-3 rounded-xl bg-red-500 px-4 text-left text-sm font-medium text-white transition duration-300 hover:bg-red-400"
              onClick={handleLogout}
              type="button"
            >
              <LogOutIcon size={17} />
              Sign out
            </button>
          </div>
        </div>
      </Modal>

      <EditProfileModal
        initialEmail={profileDraft.email}
        initialUsername={profileDraft.username}
        isOpen={isEditProfileOpen}
        originEl={editProfileOriginEl}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </>
  );
}
