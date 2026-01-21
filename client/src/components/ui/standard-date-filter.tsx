
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, RotateCcw, Calendar } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface StandardDateFilterProps {
  onFilter: (from: string, to: string) => void;
  initialFromDate?: string;
  initialToDate?: string;
  className?: string;
  showPeriodSelect?: boolean;
  compact?: boolean;
}

export function StandardDateFilter({ 
  onFilter, 
  initialFromDate = "",
  initialToDate = "",
  className = "", 
  showPeriodSelect = true,
  compact = false 
}: StandardDateFilterProps) {
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [period, setPeriod] = useState("today");

  const today = new Date();
  const formatDate = (date: Date) => format(date, "yyyy-MM-dd");

  const handlePeriodChange = (selectedPeriod: string) => {
    setPeriod(selectedPeriod);
    let from = "";
    let to = "";

    switch (selectedPeriod) {
      case "today":
        from = to = formatDate(today);
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        from = to = formatDate(yesterday);
        break;
      case "last7days":
        from = formatDate(subDays(today, 7));
        to = formatDate(today);
        break;
      case "last30days":
        from = formatDate(subDays(today, 30));
        to = formatDate(today);
        break;
      case "thisMonth":
        from = formatDate(startOfMonth(today));
        to = formatDate(endOfMonth(today));
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        from = formatDate(startOfMonth(lastMonth));
        to = formatDate(endOfMonth(lastMonth));
        break;
      case "custom":
        // Keep current dates for custom
        break;
      default:
        from = to = formatDate(today);
    }

    if (selectedPeriod !== "custom") {
      setFromDate(from);
      setToDate(to);
      onFilter(from, to);
    }
  };

  const handleFilter = () => {
    onFilter(fromDate, toDate);
  };

  const handleReset = () => {
    const todayFormatted = formatDate(today);
    setFromDate(todayFormatted);
    setToDate(todayFormatted);
    setPeriod("today");
    onFilter(todayFormatted, todayFormatted);
  };

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {showPeriodSelect && (
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-36"
          placeholder="From date"
        />
        <Input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="w-36"
          placeholder="To date"
        />
        
        <Button onClick={handleFilter} variant="outline" size="sm">
          <Filter className="h-4 w-4" />
        </Button>
        <Button onClick={handleReset} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Date Filter
          </div>
          
          {showPeriodSelect && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">Quick Select</label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4 lg:pt-0">
            <Button onClick={handleFilter} variant="default" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
