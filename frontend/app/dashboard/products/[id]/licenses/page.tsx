"use client";

import { useProduct } from "../layout";

export default function LicensesPage() {
  const { product } = useProduct();

  if (!product) return null;

  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-black p-12 text-center text-sm text-white/40">
      Licenses for {product.name} — coming soon
    </div>
  );
}