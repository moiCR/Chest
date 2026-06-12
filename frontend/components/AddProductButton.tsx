import { Plus } from "lucide-react";

export function AddProductButton() {
  return (
    <button
      className="group flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-black transition-transform duration-150 ease-out hover:scale-108 active:scale-96"
      type="button"
    >
      <span className="flex items-center justify-center transition-transform duration-150 ease-out">
        <Plus size={24} strokeWidth={2.4} />
      </span>
    </button>
  );
}
