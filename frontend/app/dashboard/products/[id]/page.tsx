"use client";

import { ArrowLeft, Box, Download, FileText, Pencil, Tag } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

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
  description: string;
  version: string;
  category: string;
  downloads: number;
  file_key: string;
  created_at: string;
  updated_at: string;
  updates: ProductUpdate[];
};

const CACHE_TTL_MS = 5 * 60 * 1000;

type CachedProduct = {
  data: Product;
  timestamp: number;
};

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleDownloadProduct = async () => {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3312")
      .replace(/^https:\/\/localhost(?=[:/]|$)/, "http://localhost")
      .replace(/\/$/, "");

    const token = localStorage.getItem("authToken");

    window.open(
      `${apiUrl}/products/${resolvedParams.id}/download?token=${token}`,
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

          {product.file_key && (
            <button
              onClick={handleDownloadProduct}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90"
            >
              <Download size={14} />
              Download
            </button>
          )}

          <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-black text-white/60 transition hover:border-white/25 hover:text-white">
            <Pencil size={16} strokeWidth={2} />
          </button>
        </div>
      </header>

      <nav className="mt-8 flex items-center gap-1 border-b border-white/10">
        <Link
          href={`/dashboard/products/${resolvedParams.id}`}
          className="relative px-4 py-3 text-sm font-medium text-white"
        >
          Inicio
          <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-white" />
        </Link>
        <Link
          href={`/dashboard/products/${resolvedParams.id}/updates`}
          className="relative px-4 py-3 text-sm font-medium text-white/40 transition hover:text-white/70"
        >
          Updates
        </Link>
      </nav>

      <div className="mt-6 flex-1 overflow-y-auto">
        <section className="max-w-3xl">
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

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        </section>
      </div>
    </div>
  );
}
