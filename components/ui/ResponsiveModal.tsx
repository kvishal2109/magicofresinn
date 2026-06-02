"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ResponsiveModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  showCloseButton?: boolean;
  panelClassName?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export default function ResponsiveModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  showCloseButton = true,
  panelClassName = "",
}: ResponsiveModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="flex min-h-full items-end sm:items-center justify-center p-3 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "responsive-modal-title" : undefined}
          className={`relative w-full ${sizeClasses[size]} max-h-[min(92dvh,calc(100dvh-1.5rem))] flex flex-col rounded-xl bg-white shadow-xl ${panelClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-6 shrink-0">
              <div className="min-w-0 pr-2">
                {title ? (
                  <h2
                    id="responsive-modal-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p className="text-sm text-gray-500 mt-0.5">{description}</p>
                ) : null}
              </div>
              {showCloseButton ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : null}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>

          {footer ? (
            <div className="shrink-0 border-t border-gray-100 px-4 py-3 sm:px-6 sm:py-4 bg-gray-50/80 rounded-b-xl">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
