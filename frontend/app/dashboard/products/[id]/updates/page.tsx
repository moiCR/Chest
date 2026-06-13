"use client";

import {
  ArrowLeft,
  Box,
  Download,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AddUpdateModal } from "@/components/AddUpdateModal";

type ProductUpdate = {
  id: string;
  version: string;
  title: string;
  description: string;
  type: string;
  downloads: number;
  created_at: string;
};

type Product = {
  id: string;
  name: string;
  version: string;
  category: string;
  downloads: number;
  file_key: string;
  created_at: string;
  updates: ProductUpdate[];
};

const CACHE_TTL_MS = 5 * 60 * 1000;

type CachedProduct = {
  data: Product;
  timestamp: number;
};

const typeColors: Record<string, string> = {
  major: "bg-red-500/15 text-red-400 border-red-500/25",
  minor: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  patch: "bg-green-500/15 text-green-400 border-green-500/25",
  hotfix: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
};

export default function ProductUpdatesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddUpdateOpen, setIsAddUpdateOpen] = useState(false);
  const [addUpdateAnchorEl, setAddUpdateAnchorEl] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [resolvedParams.id]);

  const getCachedProduct = (id: string): Product | null => {
    try {
      const cached = localStorage.getItem(`product_${id}`);
      if (!cached) return null;

      const parsed: CachedProduct = JSON.parse(cached);
      const isExpired = Date.now() - parsed.timestamp > CACHE_TTL_MS;

      if (isExpired) {
        localStorage.removeItem(`product_${id}`);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  };

  const setCachedProduct = (id: string, data: Product) => {
    const cached: CachedProduct = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`product_${id}`, JSON.stringify(cached));
  };

  const fetchProduct = async () => {
    const cached = getCachedProduct(resolvedParams.id);
    if (cached) {
      setProduct(cached);
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = (
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3312"
      )
        .replace(/^https:\/\/localhost(?=[:/]|$)/, "http://localhost")
        .replace(/\/$/, "");

      const token = localStorage.getItem("authToken");

      const response = await fetch(`${apiUrl}/products/${resolvedParams.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }

      const data = await response.json();
      setProduct(data.product);
      setCachedProduct(resolvedParams.id, data.product);
    } catch {
      setError("Unable to load product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUpdateClose = () => {
    setIsAddUpdateOpen(false);
    localStorage.removeItem(`product_${resolvedParams.id}`);
    fetchProduct();
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours`;
    return `${Math.floor(diffInSeconds / 86400)} days`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDownload = async (updateId: string) => {
    const apiUrl = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3312"
    )
      .replace(/^https:\/\/localhost(?=[:/]|$)/, "http://localhost")
      .replace(/\/$/, "");

    const token = localStorage.getItem("authToken");

    window.open(
      `${apiUrl}/products/updates/${updateId}/download?token=${token}`,
      "_blank",
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="text-white/45">Loading product...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
        <div className="text-white/45">{error ?? "Product not found"}</div>
        <Link
          href="/dashboard/products"
          className="flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col p-8">
      <header className="flex w-full items-start gap-4">
        <Link
          href="/dashboard/products"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-black text-white/60 transition hover:border-white/25 hover:text-white"
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <Box size={24} className="text-white/70" />
            <h1 className="truncate text-xl font-semibold">{product.name}</h1>
            <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-white/55">
              {product.category}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/40">
            <span>v{product.version}</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>Created {timeAgo(product.created_at)} ago</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-black px-4 py-2.5 text-sm">
            <Download size={14} className="text-white/40" />
            <span className="font-medium text-white/70">
              {product.downloads}
            </span>
          </div>
        </div>
      </header>

      <nav className="mt-8 flex items-center justify-between gap-1 border-b border-white/10">
        <div className="flex items-center gap-1">
          <Link
            href={`/dashboard/products/${resolvedParams.id}`}
            className="relative px-4 py-3 text-sm font-medium text-white/40 transition hover:text-white/70"
          >
            Inicio
          </Link>
          <Link
            href={`/dashboard/products/${resolvedParams.id}/updates`}
            className="relative px-4 py-3 text-sm font-medium text-white"
          >
            Updates
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-white" />
          </Link>
        </div>

        <button
          ref={setAddUpdateAnchorEl}
          onClick={() => setIsAddUpdateOpen(true)}
          className="flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90"
        >
          <Plus size={16} />
          New Update
        </button>
      </nav>

      <AddUpdateModal
        anchorEl={addUpdateAnchorEl}
        isOpen={isAddUpdateOpen}
        layoutId="add-update"
        onClose={handleAddUpdateClose}
        productId={resolvedParams.id}
      />

      <div className="mt-6 flex-1 overflow-y-auto">
        {!product.updates || product.updates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-black p-12 text-center text-sm text-white/40">
            No updates yet
          </div>
        ) : (
          <div className="space-y-3">
            {product.updates.map((update) => (
              <article
                key={update.id}
                className="rounded-xl border border-white/15 bg-black p-5 transition hover:border-white/25"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs font-semibold text-white/70">
                      v{update.version}
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        typeColors[update.type] ??
                        "border-white/10 bg-white/5 text-white/50"
                      }`}
                    >
                      {update.type}
                    </span>
                    <h3 className="truncate text-base font-semibold text-white/85">
                      {update.title}
                    </h3>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-white/35">
                      {formatDate(update.created_at)}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <Download size={12} />
                      {update.downloads}
                    </div>
                    {update.file_key && (
                      <button
                        onClick={() => handleDownload(update.id)}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-white/50 transition hover:border-white/25 hover:text-white"
                      >
                        <Download size={14} />
                      </button>
                    )}
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 items-center justify-center text-white/45"
                    >
                      <MoreHorizontal size={18} strokeWidth={2.2} />
                    </span>
                  </div>
                </div>

                {update.description && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/55">
                    {update.description}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
