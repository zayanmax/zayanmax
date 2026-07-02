import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function FormFieldWrapper({
  label,
  htmlFor,
  error,
  description,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
