"use client";

import type { LucideIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SelectOption = {
  label: string;
  value: string;
};

export function SelectField({
  value,
  onValueChange,
  options,
  placeholder = "Select",
  disabled,
  className,
  icon: Icon,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  icon?: LucideIcon;
}) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue !== null) onValueChange(nextValue);
      }}
      disabled={disabled}
    >
      <SelectTrigger className={className ?? "w-full"}>
        {Icon ? <Icon className="size-4 text-muted-foreground" aria-hidden="true" /> : null}
        <SelectValue placeholder={placeholder}>
          {() => selectedOption?.label ?? placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
