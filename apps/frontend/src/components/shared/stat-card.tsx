import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "primary",
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
  }[tone];

  return (
    <Card className="rounded-lg border border-border shadow-none ring-0">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-1 text-2xl">{value}</CardTitle>
        </div>
        {Icon ? (
          <div className={`flex size-9 items-center justify-center rounded-lg ${toneClass}`}>
            <Icon className="size-4" />
          </div>
        ) : null}
      </CardHeader>
      {description ? (
        <CardContent className="text-xs text-muted-foreground">
          {description}
        </CardContent>
      ) : null}
    </Card>
  );
}
