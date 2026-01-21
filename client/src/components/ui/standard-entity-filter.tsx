
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EntityOption {
  value: string;
  label: string;
}

interface StandardEntityFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: EntityOption[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export function StandardEntityFilter({
  value,
  onChange,
  options,
  placeholder = "Select entity",
  label,
  className = ""
}: StandardEntityFilterProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
