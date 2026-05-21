"use client";

/* eslint-disable @next/next/no-img-element */

import { Check, ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
} from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  label: string | number;
  value: string;
  icon?: string;
  iconAlt?: string;
  iconComponent?: ComponentType<{ className?: string }>;
}

type SelectProps = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  iconOnly?: boolean;
  variant?: "light" | "dark";
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  labelClassName?: string;
  onValueChange?: (value: string) => void;
};

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export function Select({
  options,
  value,
  defaultValue,
  label,
  placeholder = "Select an option",
  disabled = false,
  iconOnly = false,
  variant = "dark",
  className,
  triggerClassName,
  dropdownClassName,
  labelClassName,
  onValueChange,
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRenderDropdown, setShouldRenderDropdown] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const selectedValue = value ?? internalValue;
  const isDark = variant === "dark";

  const selectedOption = useMemo(
    () =>
      options.find((option) => String(option.value) === String(selectedValue)),
    [options, selectedValue],
  );

  const displayLabel = selectedOption
    ? String(selectedOption.label)
    : placeholder;
  const canShowSelectedIcon =
    !!selectedOption?.icon || !!selectedOption?.iconComponent;

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const minWidth = iconOnly ? 180 : rect.width;
    const width = Math.max(minWidth, rect.width);
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      window.innerWidth - width - viewportPadding,
    );
    const maxHeight = Math.max(
      180,
      window.innerHeight - rect.top - viewportPadding,
    );

    setDropdownStyle({
      left,
      maxHeight,
      position: "fixed",
      top: rect.top,
      width,
    });
  }, [iconOnly]);

  const close = useCallback(() => setIsOpen(false), []);

  const handleToggle = () => {
    if (disabled) return;

    if (!isOpen) {
      updatePosition();
      setShouldRenderDropdown(true);
      setIsOpen(true);
      return;
    }

    close();
  };

  const selectOption = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
    close();
  };

  useEffect(() => {
    if (!shouldRenderDropdown) return;

    updatePosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        rootRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }

      close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, shouldRenderDropdown, updatePosition]);

  return (
    <div className={cn("relative flex w-full flex-col", className)} ref={rootRef}>
      {label ? (
        <label
          className={cn(
            "pointer-events-none absolute left-4 top-2 z-10 text-xs",
            isDark ? "text-white/45" : "text-black/45",
            labelClassName,
          )}
        >
          {label}
        </label>
      ) : null}

      <button
        aria-expanded={isOpen}
        className={cn(
          "flex h-16 w-full items-center justify-between gap-3 rounded-xl border px-4 pb-3 pt-7 text-sm font-medium outline-none transition",
          isDark
            ? "border-white/15 bg-black text-white/80 focus:border-white/35"
            : "border-black/15 bg-white text-black/80 focus:border-black/35",
          disabled
            ? "cursor-not-allowed opacity-50"
            : isDark
              ? "cursor-pointer hover:border-white/25"
              : "cursor-pointer hover:border-black/25",
          iconOnly ? "justify-center px-0" : "",
          isOpen && !disabled ? "opacity-0" : "",
          triggerClassName,
        )}
        disabled={disabled}
        onClick={handleToggle}
        ref={triggerRef}
        title={displayLabel}
        type="button"
      >
        <span
          className={cn(
            "flex min-w-0 items-center gap-2",
            iconOnly ? "justify-center" : "",
          )}
        >
          {canShowSelectedIcon ? (
            <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden [&>svg]:block [&>svg]:size-5">
              {selectedOption?.icon ? (
                <img
                  alt={
                    selectedOption.iconAlt ||
                    `${String(selectedOption.label)} logo`
                  }
                  className="max-h-5 max-w-5"
                  src={selectedOption.icon}
                />
              ) : selectedOption?.iconComponent ? (
                <selectedOption.iconComponent className="size-5" />
              ) : null}
            </span>
          ) : null}

          <span
            className={cn(
              "truncate",
              !selectedOption ? "text-white/35" : "",
              iconOnly && canShowSelectedIcon ? "sr-only" : "",
            )}
          >
            {displayLabel}
          </span>
        </span>

        {!iconOnly ? (
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-white/45 transition-transform duration-150",
              isOpen ? "rotate-180" : "",
            )}
          />
        ) : null}
      </button>

      {typeof document !== "undefined" && shouldRenderDropdown
        ? createPortal(
            <div
              className={cn(
                "select-popover z-[100] overflow-hidden rounded-xl border border-white/15 bg-black text-white shadow-[0_22px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]",
                isOpen ? "select-popover-open" : "select-popover-closed",
                dropdownClassName,
              )}
              onAnimationEnd={() => {
                if (!isOpen) {
                  setShouldRenderDropdown(false);
                }
              }}
              ref={dropdownRef}
              style={dropdownStyle}
            >
              <div className="overflow-y-auto p-1.5">
                {options.length === 0 ? (
                  <div className="p-2.5 text-center text-sm font-medium text-white/40">
                    Loading...
                  </div>
                ) : null}

                {options.map((option) => {
                  const OptionIcon = option.iconComponent;
                  const isSelected = selectedValue === option.value;

                  return (
                    <button
                      className={cn(
                        "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                        isSelected
                          ? "bg-white text-black"
                          : "text-white/80 hover:bg-white/6 hover:text-white",
                      )}
                      key={option.value}
                      onClick={() => selectOption(option.value)}
                      type="button"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        {option.icon || OptionIcon ? (
                          <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden [&>svg]:block [&>svg]:size-5">
                            {option.icon ? (
                              <img
                                alt={
                                  option.iconAlt ||
                                  `${String(option.label)} logo`
                                }
                                className="max-h-6 max-w-6"
                                src={option.icon}
                              />
                            ) : OptionIcon ? (
                              <OptionIcon className="size-5" />
                            ) : null}
                          </span>
                        ) : null}

                        <span className="truncate">{option.label}</span>
                      </span>

                      {isSelected ? <Check className="size-4 shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
