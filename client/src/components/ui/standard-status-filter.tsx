
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusOption {
  value: string;
  label: string;
}

interface StandardStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: StatusOption[];
  placeholder?: string;
  className?: string;
}

export function StandardStatusFilter({
  value,
  onChange,
  options,
  placeholder = "Select status",
  className = ""
}: StandardStatusFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`w-40 ${className}`}>
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
  );
}
