"use client";

import { useCallback, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
};

export function useConfirmDialog() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const close = useCallback(
    (value: boolean) => {
      resolver?.(value);
      setResolver(null);
      setOptions(null);
    },
    [resolver],
  );

  const confirm = useCallback((nextOptions: ConfirmOptions) => {
    setOptions(nextOptions);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const dialog = useMemo(() => {
    if (!options) {
      return null;
    }

    return (
      <ConfirmDialog
        open={Boolean(options)}
        title={options.title}
        description={options.description}
        confirmLabel={options.confirmLabel}
        cancelLabel={options.cancelLabel}
        variant={options.variant}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    );
  }, [close, options]);

  return { dialog, confirm };
}
