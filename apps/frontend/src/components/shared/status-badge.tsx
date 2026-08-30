import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Circle,
  CircleDot,
  Clock3,
  Flag,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type StatusPresentation = { className: string; icon: LucideIcon };

const statusPresentation: Record<string, StatusPresentation> = {
  ACTIVE: { className: "border-success/20 bg-success/10 text-success", icon: CheckCircle2 },
  APPROVED: { className: "border-success/20 bg-success/10 text-success", icon: CheckCircle2 },
  COMPLETED: { className: "border-success/20 bg-success/10 text-success", icon: CheckCircle2 },
  DONE: { className: "border-success/20 bg-success/10 text-success", icon: CheckCircle2 },
  PAID: { className: "border-success/20 bg-success/10 text-success", icon: CheckCircle2 },
  PRESENT: { className: "border-success/20 bg-success/10 text-success", icon: CheckCircle2 },
  TODO: { className: "border-border bg-muted/70 text-muted-foreground", icon: Circle },
  PENDING: { className: "border-warning/20 bg-warning/10 text-warning", icon: Clock3 },
  LATE: { className: "border-warning/20 bg-warning/10 text-warning", icon: Clock3 },
  HALF_DAY: { className: "border-warning/20 bg-warning/10 text-warning", icon: Clock3 },
  REVIEW: { className: "border-violet-200 bg-violet-50 text-violet-700", icon: CircleDot },
  IN_PROGRESS: { className: "border-info/20 bg-info/10 text-info", icon: LoaderCircle },
  OPEN: { className: "border-info/20 bg-info/10 text-info", icon: CircleDot },
  WORK_FROM_HOME: { className: "border-info/20 bg-info/10 text-info", icon: CircleDot },
  HOLIDAY: { className: "border-info/20 bg-info/10 text-info", icon: CircleDot },
  LEAVE: { className: "border-violet-200 bg-violet-50 text-violet-700", icon: CircleDot },
  BLOCKED: { className: "border-destructive/20 bg-destructive/10 text-destructive", icon: AlertTriangle },
  OVERDUE: { className: "border-destructive/20 bg-destructive/10 text-destructive", icon: AlertTriangle },
  REJECTED: { className: "border-destructive/20 bg-destructive/10 text-destructive", icon: Ban },
  ABSENT: { className: "border-destructive/20 bg-destructive/10 text-destructive", icon: Ban },
  URGENT: { className: "border-destructive/20 bg-destructive/10 text-destructive", icon: Flag },
  HIGH: { className: "border-orange-200 bg-orange-50 text-orange-700", icon: Flag },
  MEDIUM: { className: "border-amber-200 bg-amber-50 text-amber-700", icon: Flag },
  LOW: { className: "border-slate-200 bg-slate-50 text-slate-600", icon: Flag },
  CANCELLED: { className: "border-muted bg-muted text-muted-foreground", icon: Ban },
  INACTIVE: { className: "border-muted bg-muted text-muted-foreground", icon: Ban },
};

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const presentation = statusPresentation[normalized] ?? {
    className: "border-border bg-muted text-muted-foreground",
    icon: CircleDot,
  };
  const Icon = presentation.icon;
  return (
    <Badge
      variant="outline"
      className={presentation.className}
    >
      <Icon data-icon="inline-start" aria-hidden="true" />
      {normalized.replaceAll("_", " ")}
    </Badge>
  );
}
