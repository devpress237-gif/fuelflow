import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, RotateCcw } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface DateRangeFilterProps {
  onFilter: (fromDate: string, toDate: string, period?: string) => void;
  className?: string;
  showPeriodSelect?: boolean;
}

export function DateRangeFilter({ onFilter, className = "", showPeriodSelect = true }: DateRangeFilterProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
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
      onFilter(from, to, selectedPeriod);
    }
  };

  const handleFilter = () => {
    onFilter(fromDate, toDate, period);
  };

  const handleReset = () => {
    const todayFormatted = formatDate(today);
    setFromDate(todayFormatted);
    setToDate(todayFormatted);
    setPeriod("today");
    onFilter(todayFormatted, todayFormatted, "today");
  };

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {showPeriodSelect && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Quick Select</label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-full sm:w-40">
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

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full sm:w-40"
                data-testid="input-fromdate"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full sm:w-40"
                data-testid="input-todate"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-6">
            <Button 
              onClick={handleFilter} 
              variant="default" 
              size="sm"
              className="flex items-center gap-2"
              data-testid="button-filter"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button 
              onClick={handleReset} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              data-testid="button-reset"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}