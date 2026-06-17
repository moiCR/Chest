"use client";

import { Download, MoreHorizontal } from "lucide-react";
import { use, useState } from "react";
import { useProduct } from "../layout";
import { UpdateActionsModal } from "@/components/UpdateActionsModal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { EditUpdateModal } from "@/components/EditUpdateModal";

type ProductUpdate = {
  id: string;
  version: string;
  title: string;
  description: string;
  type: string;
  branch: string;
  downloads: number;
  created_at: string;
  file_key?: string;
};

const typeColors: Record<string, string> = {
  major: "bg-red-500/15 text-red-400 border-red-500/25",
  minor: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  patch: "bg-green-500/15 text-green-400 border-green-500/25",
  hotfix: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
};

const branchColors: Record<string, string> = {
  release: "border-emerald-500/30 bg-emerald-500/5",
  beta: "border-amber-500/30 bg-amber-500/5",
};

const branchLabels: Record<string, string> = {
  release: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  beta: "bg-amber-500/15 text-amber-400 border-amber-500/25",
};

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function ProductUpdatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { product, refetch } = useProduct();
  const [actionsAnchorEl, setActionsAnchorEl] = useState<HTMLElement | null>(null);
  const [actionsModalOpen, setActionsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<ProductUpdate | null>(null);

  if (!product) return null;

  const updates: ProductUpdate[] = product.updates ?? [];
  const releaseUpdates = updates.filter((u) => u.branch !== "beta");
  const betaUpdates = updates.filter((u) => u.branch === "beta");

  const handleDownload = (updateId: string) => {
    const apiUrl = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3312"
    )
      .replace(/^https:\/\/localhost(?=[:/]|$)/, "http://localhost")
      .replace(/\/$/, "");

    const token = localStorage.getItem("authToken");
    window.open(
      `${apiUrl}/products/updates/${updateId}/download?token=${token}`,
      "_blank"
    );
  };

  const openActions = (update: ProductUpdate, el: HTMLElement) => {
    setSelectedUpdate(update);
    setActionsAnchorEl(el);
    setActionsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUpdate) return;

    const apiUrl = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3312"
    )
      .replace(/^https:\/\/localhost(?=[:/]|$)/, "http://localhost")
      .replace(/\/$/, "");

    const token = localStorage.getItem("authToken");

    await fetch(
      `${apiUrl}/products/${resolvedParams.id}/updates/${selectedUpdate.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    localStorage.removeItem(`product_${resolvedParams.id}`);
    refetch();
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    localStorage.removeItem(`product_${resolvedParams.id}`);
    refetch();
  };

  const renderUpdate = (update: ProductUpdate) => (
    <article
      key={update.id}
      className={`group rounded-xl border p-4 transition hover:border-white/25 ${branchColors[update.branch] ?? "border-white/15 bg-black"}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-xs font-semibold text-white/70">
            v{update.version}
          </span>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              typeColors[update.type] ?? "border-white/10 bg-white/5 text-white/50"
            }`}
          >
            {update.type}
          </span>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              branchLabels[update.branch] ?? "border-white/10 bg-white/5 text-white/50"
            }`}
          >
            {update.branch === "beta" ? "Beta" : "Release"}
          </span>
          <h3 className="truncate text-sm font-semibold text-white/85">
            {update.title}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-white/35">
            {timeAgo(update.created_at)}
          </span>
          {update.file_key && (
            <button
              onClick={() => handleDownload(update.id)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-white/50 transition hover:border-white/25 hover:text-white"
            >
              <Download size={14} />
            </button>
          )}
          <button
            onClick={(e) => openActions(update, e.currentTarget)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-white/45 transition hover:border-white/25 hover:text-white"
          >
            <MoreHorizontal size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </article>
  );

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {updates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-black p-12 text-center text-sm text-white/40">
              No updates yet
            </div>
          ) : (
            <div className="space-y-6">
              {releaseUpdates.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                    Releases
                  </h3>
                  <div className="space-y-2">
                    {releaseUpdates.map(renderUpdate)}
                  </div>
                </div>
              )}
              {betaUpdates.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-400/60">
                    Beta
                  </h3>
                  <div className="space-y-2">
                    {betaUpdates.map(renderUpdate)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <UpdateActionsModal
        anchorEl={actionsAnchorEl}
        isOpen={actionsModalOpen}
        layoutId="update-actions"
        onClose={() => setActionsModalOpen(false)}
        onEdit={() => setEditModalOpen(true)}
        onDelete={() => setDeleteModalOpen(true)}
      />

      <ConfirmDeleteModal
        anchorEl={actionsAnchorEl}
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        updateTitle={selectedUpdate?.title}
      />

      <EditUpdateModal
        isOpen={editModalOpen}
        onClose={handleEditClose}
        productId={resolvedParams.id}
        update={
          selectedUpdate
            ? {
                id: selectedUpdate.id,
                title: selectedUpdate.title,
                version: selectedUpdate.version,
                description: selectedUpdate.description,
                type: selectedUpdate.type,
                branch: selectedUpdate.branch,
              }
            : null
        }
        originEl={actionsAnchorEl}
      />
    </>
  );
}