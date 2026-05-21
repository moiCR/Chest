import { AddProductButton } from "../../../components/AddProductButton";
import { Select } from "@/components/ui/Select";
import { Box, MoreHorizontal, Search } from "lucide-react";

const products = [
  { createdAgo: "2 hours", licenses: 24, name: "Chest Core", type: "Plugin" },
  { createdAgo: "1 day", licenses: 12, name: "Vault Sync", type: "Plugin" },
  { createdAgo: "5 days", licenses: 38, name: "Mod Loader", type: "Mod" },
];

export default function ProductsPage() {
  return (
    <div className="flex h-full w-full flex-col p-8">
      <header className="flex w-full items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <Box size={28} />
            <span className="text-left text-2xl font-semibold">Products</span>
          </div>
          <p className="text-sm text-white/45">Create and manage your products</p>
        </div>

        <AddProductButton />
      </header>

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
        {products.map((product) => (
          <article
            className="min-h-36 cursor-pointer rounded-xl border border-white/15 bg-black p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-white/25"
            key={product.name}
          >
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
                    {product.type}
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
                  Created {product.createdAgo} ago
                </span>
                <span className="whitespace-nowrap font-medium text-white/75">
                  {product.licenses} Licenses
                </span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
