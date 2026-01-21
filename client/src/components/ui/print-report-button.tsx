import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { printReport, generateEnhancedPrintTemplate, globalPrintDocument } from "@/lib/printUtils";

interface ColumnDefinition {
  key: string;
  label: string;
  format?: 'currency' | 'date' | 'number' | 'string';
}

interface PrintReportButtonProps {
  data: any[];
  reportType?: 'invoice' | 'receipt' | 'statement' | 'expense' | 'purchaseOrder' | 'pumpReading' | 'sales' | 'accounts' | 'general';
  title?: string;
  columns?: ColumnDefinition[];
  showSummary?: boolean;
  summaryData?: Record<string, string>;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
}

export function PrintReportButton({ 
  data, 
  reportType = 'general',
  title = "Print Report",
  columns,
  showSummary = false,
  summaryData = {},
  variant = "outline",
  size = "sm",
  className = "",
  disabled = false
}: PrintReportButtonProps) {
  
  const handlePrint = () => {
    if (!data || data.length === 0) {
      alert("No data available to print");
      return;
    }

    // If columns are provided, use the enhanced global print functionality
    if (columns && columns.length > 0) {
      const printContent = generateEnhancedPrintTemplate({
        title,
        data,
        columns,
        showSummary,
        summaryData,
        showDate: true,
        showPageNumbers: true
      });
      
      globalPrintDocument(printContent, title.toLowerCase().replace(/\s+/g, '-'));
      return;
    }

    // Fallback to legacy print functionality
    const reportData = {
      title: title,
      items: data,
      generatedAt: new Date().toISOString(),
      totalRecords: data.length,
      // For financial reports, calculate totals
      ...(reportType === 'expense' && {
        totalAmount: data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2)
      }),
      ...(reportType === 'invoice' && {
        totalAmount: data.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0).toFixed(2),
        outstandingAmount: data.reduce((sum, item) => sum + (parseFloat(item.outstandingAmount) || 0), 0).toFixed(2)
      })
    };

    printReport(reportData, reportType);
  };

  return (
    <Button
      onClick={handlePrint}
      variant={variant}
      size={size}
      className={`flex items-center gap-2 ${className}`}
      disabled={disabled || !data || data.length === 0}
      data-testid="button-printreport"
    >
      <Printer className="h-4 w-4" />
      {title}
    </Button>
  );
}