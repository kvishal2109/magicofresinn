"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const variantStyles = {
    danger: {
      icon: "text-red-600",
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    },
    warning: {
      icon: "text-amber-600",
      button: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
    },
    info: {
      icon: "text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    },
  };

  const styles = variantStyles[variant];

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={loading ? undefined : onClose}
      />
      <div className="flex min-h-full items-end sm:items-center justify-center p-3 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-md max-h-[min(92dvh,calc(100dvh-1.5rem))] flex flex-col rounded-lg bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 p-4 sm:p-6 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`shrink-0 ${styles.icon}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              disabled={loading}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-gray-200 bg-gray-50 p-4 sm:p-6 rounded-b-lg shrink-0">
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`w-full sm:w-auto px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${styles.button}`}
            >
              {loading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
