"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    cancelRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel]);

  if (typeof document === "undefined" || !open) {
    return null;
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              ref={cancelRef}
              variant="outline"
              onClick={onCancel}
              className="border-[var(--border-color)] text-[var(--text-primary)]"
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={onConfirm}
              className={
                variant === "destructive"
                  ? "bg-[var(--accent-red)] text-white hover:opacity-90"
                  : "bg-[var(--accent-blue)] text-white hover:opacity-90"
              }
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
