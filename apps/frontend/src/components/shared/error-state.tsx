import { AlertTriangle } from "lucide-react";

export function ErrorState({
  title = "Something went wrong",
  message,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 text-destructive" />
        <div>
          <p className="font-medium text-destructive">{title}</p>
          {message ? <p className="mt-1 text-muted-foreground">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
