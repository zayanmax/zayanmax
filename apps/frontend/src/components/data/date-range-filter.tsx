"use client";

import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DateRangeQuery } from "@/types/api";

export function DateRangeFilter({
  value,
  onChange,
  onApply,
}: {
  value: DateRangeQuery;
  onChange: (value: DateRangeQuery) => void;
  onApply?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <CalendarDays className="size-4" />
        Date range
      </div>
      <Input
        type="date"
        value={value.fromDate ?? ""}
        onChange={(event) =>
          onChange({ ...value, fromDate: event.target.value || undefined })
        }
        className="sm:w-40"
      />
      <Input
        type="date"
        value={value.toDate ?? ""}
        onChange={(event) =>
          onChange({ ...value, toDate: event.target.value || undefined })
        }
        className="sm:w-40"
      />
      {onApply ? (
        <Button type="button" variant="outline" onClick={onApply}>
          Apply
        </Button>
      ) : null}
    </div>
  );
}
