"use client";

import { Download, FileText, GitCommit } from "lucide-react";
import { useProduct } from "./layout";
import { MarkdownPreview } from "@/components/MarkdownPreview";

const typeColors: Record<string, string> = {
  major: "bg-red-500/15 text-red-400 border-red-500/25",
  minor: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  patch: "bg-green-500/15 text-green-400 border-green-500/25",
  hotfix: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
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

export default function ProductPage() {
  const { product } = useProduct();

  if (!product) return null;

  const latestUpdate = product.updates?.[0];

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {product.description ? (
            <div className="rounded-xl border border-white/15 bg-black p-6">
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                <FileText size={14} />
                Description
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                {product.description}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 bg-black p-12 text-center text-sm text-white/40">
              No description yet
            </div>
          )}

          {latestUpdate && (
            <div className="rounded-xl border border-white/15 bg-black p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                  <GitCommit size={14} />
                  Latest Update
                </h2>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span>{timeAgo(latestUpdate.created_at)}</span>
                  <div className="flex items-center gap-1">
                    <Download size={12} />
                    <span>{latestUpdate.downloads}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs font-semibold text-white/70">
                  v{latestUpdate.version}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    typeColors[latestUpdate.type] ??
                    "border-white/10 bg-white/5 text-white/50"
                  }`}
                >
                  {latestUpdate.type}
                </span>
                <h3 className="ml-2 truncate text-base font-semibold text-white/85">
                  {latestUpdate.title}
                </h3>
              </div>

              {latestUpdate.description ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <MarkdownPreview content={latestUpdate.description} />
                </div>
              ) : (
                <p className="text-sm text-white/30">No description for this update.</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-white/15 bg-black p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
              Version
            </p>
            <p className="mt-1 text-lg font-semibold text-white/85">
              v{product.version}
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-black p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
              Downloads
            </p>
            <p className="mt-1 text-lg font-semibold text-white/85">
              {product.downloads}
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-black p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
              Category
            </p>
            <p className="mt-1 text-lg font-semibold capitalize text-white/85">
              {product.category}
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-black p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
              Updates
            </p>
            <p className="mt-1 text-lg font-semibold text-white/85">
              {product.updates?.length ?? 0}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}