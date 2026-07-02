"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchFilterBar({
  value,
  onChange,
  placeholder = "Search",
  filters,
  onReset,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filters?: ReactNode;
  onReset?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="pl-8"
        />
      </div>
      {filters ? (
        <div className="flex flex-wrap items-center gap-2">{filters}</div>
      ) : null}
      {onReset ? (
        <Button type="button" variant="outline" onClick={onReset}>
          <SlidersHorizontal className="size-4" />
          Reset
        </Button>
      ) : null}
    </div>
  );
}
