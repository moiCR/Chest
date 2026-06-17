"use client";

import { ArrowLeft, Box, Download, Pencil, Plus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { use, useEffect, useState, createContext, useContext } from "react";
import { AddUpdateModal } from "@/components/AddUpdateModal";

type ProductUpdate = {
  id: string;
  version: string;
  title: string;
  description: string;
  type: string;
  branch: string;
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

type ProductContextValue = {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

const ProductContext = createContext<ProductContextValue>({
  product: null,
  isLoading: true,
  error: null,
  refetch: () => {},
});

export function useProduct() {
  return useContext(ProductContext);
}

function getCachedProduct(id: string): Product | null {
  try {
    const cached = localStorage.getItem(`product_${id}`);
    if (!cached) return null;
    const parsed: CachedProduct = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(`product_${id}`);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function setCachedProduct(id: string, data: Product) {
  const cached: CachedProduct = { data, timestamp: Date.now() };
  localStorage.setItem(`product_${id}`, JSON.stringify(cached));
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours`;
  return `${Math.floor(diffInSeconds / 86400)} days`;
}

const tabs = [
  { href: "", label: "Inicio" },
  { href: "updates", label: "Updates" },
  { href: "licenses", label: "Licenses" },
];

export default function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddUpdateOpen, setIsAddUpdateOpen] = useState(false);
  const [addUpdateOriginEl, setAddUpdateOriginEl] =
    useState<HTMLElement | null>(null);

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
      const response = await fetch(
        `${apiUrl}/products/${resolvedParams.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error("Failed to fetch product");

      const data = await response.json();
      setProduct(data.product);
      setCachedProduct(resolvedParams.id, data.product);
    } catch {
      setError("Unable to load product");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [resolvedParams.id]);

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

  const basePath = `/dashboard/products/${resolvedParams.id}`;

  const handleDownloadProduct = () => {
    const apiUrl = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3312"
    )
      .replace(/^https:\/\/localhost(?=[:/]|$)/, "http://localhost")
      .replace(/\/$/, "");

    const token = localStorage.getItem("authToken");
    window.open(
      `${apiUrl}/products/${resolvedParams.id}/download?token=${token}`,
      "_blank"
    );
  };

  const handleAddUpdateClose = () => {
    setIsAddUpdateOpen(false);
    localStorage.removeItem(`product_${resolvedParams.id}`);
    fetchProduct();
  };

  return (
    <ProductContext.Provider
      value={{ product, isLoading: false, error: null, refetch: fetchProduct }}
    >
      <div className="flex h-full w-full flex-col p-4 sm:p-6">
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

        <ProductTabNav basePath={basePath} isAddUpdateOpen={isAddUpdateOpen} onAddUpdatePointerDown={setAddUpdateOriginEl} onAddUpdateClick={() => setIsAddUpdateOpen(true)} />

        <div className="mt-6 flex-1 overflow-y-auto px-2">{children}</div>
      </div>

      <AddUpdateModal
        originEl={addUpdateOriginEl}
        isOpen={isAddUpdateOpen}
        onClose={handleAddUpdateClose}
        productId={resolvedParams.id}
      />
    </ProductContext.Provider>
  );
}

function ProductTabNav({ basePath, isAddUpdateOpen, onAddUpdatePointerDown, onAddUpdateClick }: { basePath: string; isAddUpdateOpen: boolean; onAddUpdatePointerDown: (el: HTMLElement) => void; onAddUpdateClick: () => void }) {
  const pathname = usePathname();
  const segments = pathname.split("/");

  const currentTab = (() => {
    const last = segments[segments.length - 1];
    if (last === "updates") return "updates";
    if (last === "licenses") return "licenses";
    return "";
  })();

  return (
    <div className="mt-8 -mb-px">
      <div className="flex items-end justify-between">
        <nav className="flex items-center gap-1 border-b border-white/10">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href ? `${basePath}/${tab.href}` : basePath}
                className={`relative px-4 py-3 text-sm font-medium transition-colors duration-200 hover:text-white/70 ${
                  isActive ? "text-white" : "text-white/40"
                }`}
              >
                {tab.label}
                {isActive && (
                  <motion.span
                    layoutId="product-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-white"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <motion.button
          onClick={currentTab === "updates" ? onAddUpdateClick : undefined}
          onPointerDown={currentTab === "updates" ? (e) => onAddUpdatePointerDown(e.currentTarget) : undefined}
          className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-black transition-opacity duration-150"
          style={{
            borderRadius: 9999,
            opacity: isAddUpdateOpen ? 0 : (currentTab === "updates" ? 1 : 0),
            pointerEvents: isAddUpdateOpen ? "none" : (currentTab === "updates" ? "auto" : "none")
          }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          whileTap={{ scale: 0.94 }}
          type="button"
          layoutId="add-update-button"
        >
          <span className="flex items-center justify-center">
            <Plus size={16} strokeWidth={2.4} />
          </span>
        </motion.button>
      </div>
    </div>
  );
}