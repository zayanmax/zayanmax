import { Badge } from "@/components/ui/badge";

const toneByStatus: Record<string, string> = {
  ACTIVE: "border-success/20 bg-success/10 text-success",
  APPROVED: "border-success/20 bg-success/10 text-success",
  COMPLETED: "border-success/20 bg-success/10 text-success",
  PAID: "border-success/20 bg-success/10 text-success",
  PENDING: "border-warning/20 bg-warning/10 text-warning",
  IN_PROGRESS: "border-info/20 bg-info/10 text-info",
  OPEN: "border-info/20 bg-info/10 text-info",
  OVERDUE: "border-destructive/20 bg-destructive/10 text-destructive",
  REJECTED: "border-destructive/20 bg-destructive/10 text-destructive",
  CANCELLED: "border-muted bg-muted text-muted-foreground",
  INACTIVE: "border-muted bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  return (
    <Badge
      variant="outline"
      className={toneByStatus[normalized] ?? "border-border bg-muted text-muted-foreground"}
    >
      {normalized.replaceAll("_", " ")}
    </Badge>
  );
}
