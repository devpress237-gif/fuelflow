
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StandardSearchFilter } from "@/components/ui/standard-search-filter";
import { StandardStatusFilter } from "@/components/ui/standard-status-filter";
import { StandardEntityFilter } from "@/components/ui/standard-entity-filter";
import { DatePicker } from "@/components/ui/date-picker";
import { Filter, RotateCcw, Printer } from "lucide-react";
import { format } from "date-fns";

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  
  showDateFilter?: boolean;
  fromDate?: string;
  toDate?: string;
  onFromDateChange?: (value: string) => void;
  onToDateChange?: (value: string) => void;
  
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
  
  className?: string;
  compact?: boolean;
}

export function StandardFilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  
  showDateFilter = true,
  fromDate = "",
  toDate = "",
  onFromDateChange,
  onToDateChange,
  
  statusOptions = [],
  statusValue = "all",
  onStatusChange,
  statusLabel = "Status",
  
  entityOptions = [],
  entityValue = "all",
  onEntityChange,
  entityLabel = "Filter by",
  
  onApplyFilters,
  onClearFilters,
  onPrintReport,
  
  className = "",
  compact = false
}: FilterBarProps) {
  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg ${className}`}>
        {onSearchChange && (
          <StandardSearchFilter
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="flex-1 min-w-48"
          />
        )}
        
        {showDateFilter && onFromDateChange && onToDateChange && (
          <>
            <DatePicker
              date={fromDate ? new Date(fromDate) : undefined}
              onDateChange={(date) => onFromDateChange(date ? format(date, "yyyy-MM-dd") : "")}
              placeholder="From date"
              className="w-40"
            />
            <DatePicker
              date={toDate ? new Date(toDate) : undefined}
              onDateChange={(date) => onToDateChange(date ? format(date, "yyyy-MM-dd") : "")}
              placeholder="To date"
              className="w-40"
            />
          </>
        )}
        
        {statusOptions.length > 0 && onStatusChange && (
          <StandardStatusFilter
            value={statusValue}
            onChange={onStatusChange}
            options={statusOptions}
            placeholder={statusLabel}
          />
        )}
        
        {entityOptions.length > 0 && onEntityChange && (
          <StandardEntityFilter
            value={entityValue}
            onChange={onEntityChange}
            options={entityOptions}
            placeholder={entityLabel}
          />
        )}
        
        <div className="flex gap-2">
          {onPrintReport && (
            <Button onClick={onPrintReport} size="sm" variant="outline">
              <Printer className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {onSearchChange && (
              <StandardSearchFilter
                value={searchValue}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
                className="flex-1 lg:max-w-md"
              />
            )}
            
            {showDateFilter && onFromDateChange && onToDateChange && (
              <div className="flex flex-col sm:flex-row gap-2">
                <DatePicker
                  date={fromDate ? new Date(fromDate) : undefined}
                  onDateChange={(date) => onFromDateChange(date ? format(date, "yyyy-MM-dd") : "")}
                  placeholder="From date"
                  className="w-full sm:w-40"
                />
                <DatePicker
                  date={toDate ? new Date(toDate) : undefined}
                  onDateChange={(date) => onToDateChange(date ? format(date, "yyyy-MM-dd") : "")}
                  placeholder="To date"
                  className="w-full sm:w-40"
                />
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
            {statusOptions.length > 0 && onStatusChange && (
              <StandardStatusFilter
                value={statusValue}
                onChange={onStatusChange}
                options={statusOptions}
                placeholder={statusLabel}
              />
            )}
            
            {entityOptions.length > 0 && onEntityChange && (
              <StandardEntityFilter
                value={entityValue}
                onChange={onEntityChange}
                options={entityOptions}
                label={entityLabel}
              />
            )}
            
            <div className="flex gap-2">
              {onPrintReport && (
                <Button onClick={onPrintReport} variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
