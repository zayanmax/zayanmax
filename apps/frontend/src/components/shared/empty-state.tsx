import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title = "No data found",
  description,
  icon: Icon = Inbox,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center">
      <Icon className="size-8 text-muted-foreground" />
      <h3 className="mt-3 text-sm font-medium text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
