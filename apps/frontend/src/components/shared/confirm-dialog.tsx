"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  destructive,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/20" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-5 shadow-lg">
          <AlertDialog.Title className="text-base font-semibold text-foreground">
            {title}
          </AlertDialog.Title>
          {description ? (
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              {description}
            </AlertDialog.Description>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant={destructive ? "destructive" : "default"}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
