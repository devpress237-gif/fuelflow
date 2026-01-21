
import React from "react";
import { Button } from "@/components/ui/button";
import { StandardFilterBar } from "@/components/ui/standard-filter-bar";

interface StandardPageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  
  // Filter props
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  
  showDateFilter?: boolean;
  onDateFilter?: (from: string, to: string) => void;
  
  statusOptions?: Array<{ value: string; label: string }>;
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  statusLabel?: string;
  
  entityOptions?: Array<{ value: string; label: string }>;
  entityValue?: string;
  onEntityChange?: (value: string) => void;
  entityLabel?: string;
  
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
  onPrintReport?: () => void;
  
  showFilters?: boolean;
  compactFilters?: boolean;
  className?: string;
}

export function StandardPageHeader({
  title,
  subtitle,
  children,
  
  searchValue,
  onSearchChange,
  searchPlaceholder,
  
  showDateFilter = true,
  onDateFilter,
  
  statusOptions,
  statusValue,
  onStatusChange,
  statusLabel,
  
  entityOptions,
  entityValue,
  onEntityChange,
  entityLabel,
  
  onApplyFilters,
  onClearFilters,
  onPrintReport,
  
  showFilters = true,
  compactFilters = false,
  className = ""
}: StandardPageHeaderProps) {
  const hasFilters = showFilters && (
    onSearchChange || 
    (showDateFilter && onDateFilter) || 
    (statusOptions && statusOptions.length > 0) || 
    (entityOptions && entityOptions.length > 0)
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {children}
        </div>
      </div>

      {/* Filters */}
      {hasFilters && (
        <StandardFilterBar
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          
          showDateFilter={showDateFilter}
          onDateFilter={onDateFilter}
          
          statusOptions={statusOptions}
          statusValue={statusValue}
          onStatusChange={onStatusChange}
          statusLabel={statusLabel}
          
          entityOptions={entityOptions}
          entityValue={entityValue}
          onEntityChange={onEntityChange}
          entityLabel={entityLabel}
          
          onApplyFilters={onApplyFilters}
          onClearFilters={onClearFilters}
          onPrintReport={onPrintReport}
          
          compact={compactFilters}
        />
      )}
    </div>
  );
}
