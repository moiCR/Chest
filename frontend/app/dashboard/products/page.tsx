"use client";

import { AddProductButton } from "../../../components/AddProductButton";
import { AddProductModal } from "@/components/AddProductModal";
import { Select } from "@/components/ui/Select";
import { Box, MoreHorizontal, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  downloads: number;
  created_at: string;
};

const CACHE_KEY = "products_cache";
const CACHE_TTL_MS = 5 * 60 * 1000;

type CachedProducts = {
  data: Product[];
  timestamp: number;
};

export default function ProductsPage() {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [addProductAnchorEl, setAddProductAnchorEl] =
    useState<HTMLButtonElement | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const getCachedProducts = (): Product[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsed: CachedProducts = JSON.parse(cached);
      const isExpired = Date.now() - parsed.timestamp > CACHE_TTL_MS;

      if (isExpired) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  };

  const setCachedProducts = (data: Product[]) => {
    const cached: CachedProducts = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  };

  const fetchProducts = async () => {
    const cached = getCachedProducts();
    if (cached) {
      setProducts(cached);
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

      const response = await fetch(`${apiUrl}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      const productsList = data.products || [];
      setProducts(productsList);
      setCachedProducts(productsList);
    } catch (error) {
      console.error("Error fetching products:", error);
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

  return (
    <div className="flex h-full w-full flex-col p-8">
      <header className="flex w-full items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <Box size={28} />
            <span className="text-left text-2xl font-semibold">Products</span>
          </div>
          <p className="text-sm text-white/45">
            Create and manage your products
          </p>
        </div>

        <AddProductButton
          ref={setAddProductAnchorEl}
          isOpen={isAddProductOpen}
          layoutId="add-product"
          onClick={() => setIsAddProductOpen(true)}
          onPointerDown={setAddProductAnchorEl}
        />
      </header>

      <AddProductModal
        anchorEl={addProductAnchorEl}
        isOpen={isAddProductOpen}
        layoutId="add-product"
        onClose={() => {
          setIsAddProductOpen(false);
          localStorage.removeItem(CACHE_KEY);
          fetchProducts();
        }}
      />

      <div className="mt-8 grid w-full gap-3 lg:grid-cols-[minmax(0,1fr)_176px_208px]">
        <label className="relative flex min-w-0 flex-col">
          <span className="pointer-events-none absolute left-4 top-2 z-10 text-xs text-white/45">
            Filter products
          </span>
          <span className="relative">
            <Search
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35"
              size={18}
              strokeWidth={2.2}
            />
            <input
              className="h-16 w-full rounded-xl border border-white/15 bg-black px-4 pb-3 pt-7 text-sm text-white/80 outline-none transition placeholder:text-white/35 focus:border-white/35"
              placeholder="Search by name"
              type="search"
            />
          </span>
        </label>

        <Select
          defaultValue="all"
          label="Tags"
          options={[
            { label: "All", value: "all" },
            { label: "Plugins", value: "plugins" },
            { label: "Mods", value: "mods" },
          ]}
        />

        <Select
          defaultValue="newer"
          label="Priority"
          options={[
            { label: "Name (A-Z)", value: "name-az" },
            { label: "Name (Z-A)", value: "name-za" },
            { label: "Newer First", value: "newer" },
            { label: "Older First", value: "older" },
          ]}
        />
      </div>

      <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full text-center text-white/45 py-12">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full text-center text-white/45 py-12">
            No products yet. Create your first product!
          </div>
        ) : (
          products.map((product) => (
            <Link href={`/dashboard/products/${product.id}`} key={product.id}>
              <article className="min-h-36 cursor-pointer rounded-xl border border-white/15 bg-black p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-white/25">
                <div className="flex h-full min-h-26 flex-col justify-between pt-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <Box
                        className="shrink-0 text-white/75"
                        size={22}
                        strokeWidth={1.8}
                      />
                      <h3 className="truncate text-base font-semibold text-white/85">
                        {product.name}
                      </h3>
                    </div>

                    <div className="-mt-1 flex shrink-0 items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-xs font-medium text-white/55">
                        {product.category}
                      </span>
                      <span
                        aria-hidden="true"
                        className="flex h-7 w-7 items-center justify-center text-white/45"
                      >
                        <MoreHorizontal size={20} strokeWidth={2.2} />
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-white/42">
                      Created {timeAgo(product.created_at)} ago
                    </span>
                    <span className="whitespace-nowrap font-medium text-white/75">
                      {product.downloads} Downloads
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
