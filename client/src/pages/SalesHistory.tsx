import React, { useState, useEffect, useMemo } from "react";
import type { SalesTransaction, Customer, Product } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import {
  Eye,
  Trash2,
  Play,
  Download,
  Filter,
  Printer,
  Search,
  RotateCcw,
  Edit,
  Calendar,
} from "lucide-react";
import { useLocation } from "wouter";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import { StandardPageHeader } from "@/components/ui/standard-page-header";
import { StandardTableContainer } from "@/components/ui/standard-table-container";
import { StandardFilterBar } from "@/components/ui/standard-filter-bar";
import { format } from "date-fns";
import {
  globalPrintDocument,
  generatePrintTemplate,
  generateEnhancedPrintTemplate,
} from "@/lib/printUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PrintReportButton } from "@/components/ui/print-report-button";

interface DraftSale {
  id: string;
  selectedCustomerId: string;
  transactionItems: any[];
  paymentMethod: string;
  timestamp: number;
  totalAmount: number;
}

export default function SalesHistory() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: salesTransactions = [], isLoading: isLoadingSales } = useQuery<
    SalesTransaction[]
  >({
    queryKey: ["/api/sales", user?.stationId],
    enabled: !!user?.stationId,
  });
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filteredSales = useMemo(() => {
    return salesTransactions.filter((transaction) => {
      const matchesSearch =
        !searchTerm ||
        transaction.invoiceNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        customers
          .find((c) => c.id === transaction.customerId)
          ?.name.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesPayment =
        paymentFilter === "all" || transaction.paymentMethod === paymentFilter;

      let matchesDate = true;
      if (fromDate || toDate) {
        const transactionDate = transaction.transactionDate
          ? new Date(transaction.transactionDate).toISOString().split("T")[0]
          : "";
        if (fromDate && transactionDate < fromDate) matchesDate = false;
        if (toDate && transactionDate > toDate) matchesDate = false;
      }

      return matchesSearch && matchesPayment && matchesDate;
    });
  }, [
    salesTransactions,
    searchTerm,
    paymentFilter,
    fromDate,
    toDate,
    customers,
  ]);

  const [draftSales, setDraftSales] = useState<DraftSale[]>([]);
  const [showDrafts, setShowDrafts] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null,
  );
  const [draftDeleteConfirmOpen, setDraftDeleteConfirmOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);

  // Bulk entry mode states
  const [bulkEntryMode, setBulkEntryMode] = useState(false);
  const [bulkEntryDate, setBulkEntryDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );

  const queryClient = useQueryClient();

  // Actual data to display

  const handleViewTransaction = (transactionId: string) => {
    navigate(`/invoice/${transactionId}`);
  };

  const deleteSaleMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await apiRequest(
        "DELETE",
        `/api/sales/${transactionId}`,
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to delete transaction");
      }
      return response.json();
    },
    onSuccess: async () => {
      toast({
        title: "Transaction deleted",
        description: "Sales transaction has been deleted successfully",
      });
      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
      // Invalidate and refetch immediately
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/sales", user?.stationId],
      });
      // Force refetch to update UI immediately
      queryClient.refetchQueries({ queryKey: ["/api/sales", user?.stationId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete transaction",
        variant: "destructive",
      });
      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
    },
  });

  const handleEditTransaction = (transactionId: string) => {
    // Navigate to POS with the transaction ID to edit
    navigate(`/pos?edit=${transactionId}`);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTransaction = () => {
    if (transactionToDelete) {
      deleteSaleMutation.mutate(transactionToDelete);
      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleContinueDraft = (draftId: string) => {
    // Navigate to Point of Sale to continue the draft
    navigate(`/pos?draft=${draftId}`);
  };

  const handleDeleteDraft = (draftId: string) => {
    setDraftToDelete(draftId);
    setDraftDeleteConfirmOpen(true);
  };

  const confirmDeleteDraft = () => {
    if (draftToDelete) {
      const updatedDrafts = draftSales.filter(
        (draft) => draft.id !== draftToDelete,
      );
      setDraftSales(updatedDrafts);

      // Update localStorage
      if (updatedDrafts.length > 0) {
        localStorage.setItem("allPosDrafts", JSON.stringify(updatedDrafts));
      } else {
        localStorage.removeItem("allPosDrafts");
        localStorage.removeItem("posDraft"); // Also remove single draft
      }

      toast({
        title: "Draft deleted",
        description: "Draft sale has been removed",
      });

      setDraftDeleteConfirmOpen(false);
      setDraftToDelete(null);
    }
  };

  // Load drafts from localStorage
  useEffect(() => {
    const loadDrafts = () => {
      try {
        // Check for multiple drafts
        const allDrafts = localStorage.getItem("allPosDrafts");
        if (allDrafts) {
          const drafts = JSON.parse(allDrafts) as DraftSale[];
          setDraftSales(drafts);
          return;
        }

        // Check for single draft (legacy support)
        const singleDraft = localStorage.getItem("posDraft");
        if (singleDraft) {
          const draft = JSON.parse(singleDraft);
          const totalAmount =
            draft.transactionItems?.reduce((sum: number, item: any) => {
              return sum + (item.totalPrice || 0);
            }, 0) || 0;

          const draftSale: DraftSale = {
            id: `draft-${draft.timestamp || Date.now()}`,
            selectedCustomerId: draft.selectedCustomerId || "",
            transactionItems: draft.transactionItems || [],
            paymentMethod: draft.paymentMethod || "cash",
            timestamp: draft.timestamp || Date.now(),
            totalAmount: totalAmount,
          };

          setDraftSales([draftSale]);

          // Migrate to new format
          localStorage.setItem("allPosDrafts", JSON.stringify([draftSale]));
        }
      } catch (error) {
        console.error("Failed to load drafts:", error);
      }
    };

    loadDrafts();
  }, []);

  const exportToExcel = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Invoice,Customer,Amount,Payment Method,Date\n" +
      filteredData
        .map((t) => {
          // Use filteredData here
          const customer = customers.find((c) => c.id === t.customerId);
          const date = t.transactionDate
            ? new Date(t.transactionDate).toLocaleDateString()
            : "N/A";
          return `${t.invoiceNumber},${customer?.name || "Walk-in"},${t.totalAmount},${t.paymentMethod},${date}`;
        })
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sales-history-${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyFilter = () => {
    let filtered = salesTransactions.filter((sale) => {
      const matchesSearch =
        sale.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customers
          .find((c) => c.id === sale.customerId)
          ?.name.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        false;

      const matchesPaymentMethod =
        paymentFilter === "all" || sale.paymentMethod === paymentFilter;

      let matchesDateRange = true;
      if (fromDate || toDate) {
        const saleDate = sale.transactionDate
          ? new Date(sale.transactionDate)
          : null;
        if (saleDate) {
          if (fromDate && new Date(fromDate) > saleDate) {
            matchesDateRange = false;
          }
          if (toDate && new Date(toDate) < saleDate) {
            matchesDateRange = false;
          }
        } else {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesPaymentMethod && matchesDateRange;
    });
    setFilteredData(filtered);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setPaymentFilter("all");
    setFromDate("");
    setToDate("");
    setFilteredData([]);
  };

  const handlePrintReport = () => {
    const dataToUse =
      filteredData.length > 0 ? filteredData : salesTransactions;
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            @page { margin: 1in; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .amount { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sales Report</h1>
            <p>Generated on ${format(new Date(), "PPP")}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${dataToUse
                .map((sale) => {
                  const dateValue = sale.transactionDate || sale.createdAt;
                  const dateStr = dateValue
                    ? format(new Date(dateValue), "MMM dd, yyyy")
                    : "N/A";
                  return `
                <tr>
                  <td>${dateStr}</td>
                  <td>${sale.invoiceNumber || "N/A"}</td>
                  <td>${customers.find((c) => c.id === sale.customerId)?.name || "Walk-in"}</td>
                  <td>${sale.paymentMethod}</td>
                  <td class="amount">${formatCurrency(parseFloat(sale.totalAmount))}</td>
                  <td>Completed</td>
                </tr>
              `;
                })
                .join("")}
            </tbody>
          </table>
          <div style="margin-top: 30px;">
            <p><strong>Total Records: ${dataToUse.length}</strong></p>
            <p><strong>Total Amount: ${formatCurrency(dataToUse.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0))}</strong></p>
          </div>
        </body>
      </html>
    `;

    globalPrintDocument(
      printContent,
      `Sales_Report_${format(new Date(), "yyyy-MM-dd")}`,
    );
  };

  const displayedSales = useMemo(() => {
    return salesTransactions.filter((sale: SalesTransaction) => {
      const matchesSearch =
        !searchTerm ||
        sale.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customers
          .find((c: Customer) => c.id === sale.customerId)
          ?.name.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesPaymentMethod =
        paymentFilter === "all" || sale.paymentMethod === paymentFilter;

      let matchesDateRange = true;
      if (fromDate || toDate) {
        const saleDate = sale.transactionDate
          ? new Date(sale.transactionDate)
          : null;
        if (saleDate) {
          const isoDate = saleDate.toISOString().split("T")[0];
          if (fromDate && isoDate < fromDate) matchesDateRange = false;
          if (toDate && isoDate > toDate) matchesDateRange = false;
        } else {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesPaymentMethod && matchesDateRange;
    });
  }, [
    salesTransactions,
    searchTerm,
    paymentFilter,
    fromDate,
    toDate,
    customers,
  ]);

  const isLoading = isLoadingSales;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const todaysSales = displayedSales.length;
  const totalAmount = displayedSales.reduce(
    (sum: number, t: SalesTransaction) =>
      sum + parseFloat(t.totalAmount || "0"),
    0,
  );
  const cashSales = displayedSales.filter(
    (t: SalesTransaction) => t.paymentMethod === "cash",
  ).length;
  const creditSales = displayedSales.filter(
    (t: SalesTransaction) => t.paymentMethod === "credit",
  ).length;

  // Status options for payment method filter
  const paymentMethodOptions = [
    { value: "all", label: "All Payment Methods" },
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "credit", label: "Credit" },
  ];

  // Define actions for StandardPageHeader
  const pageActions = [
    <Button
      key="bulk-entry-mode"
      variant={bulkEntryMode ? "default" : "outline"}
      onClick={() => setBulkEntryMode(!bulkEntryMode)}
      data-testid="button-bulk-entry-mode"
    >
      <Calendar className="w-4 h-4 mr-2" />
      {bulkEntryMode ? "Exit Bulk Entry" : "Bulk Entry Mode"}
    </Button>,
    <Button
      key="export-excel"
      variant="outline"
      onClick={exportToExcel}
      data-testid="button-export-excel"
    >
      <Download className="w-4 h-4 mr-2" /> Export Excel
    </Button>,
    <PrintReportButton
      key="print-report"
      title="Sales History Report"
      data={displayedSales}
      columns={[
        { key: "invoiceNumber", label: "Invoice" },
        { key: "customer.name", label: "Customer" }, // Assuming customer name is accessible like this
        { key: "totalAmount", label: "Amount", format: "currency" },
        { key: "paymentMethod", label: "Payment Method" },
        { key: "transactionDate", label: "Date", format: "date" },
      ]}
      showSummary={true}
      summaryData={{
        "Total Transactions": `${displayedSales.length}`,
        "Total Sales Amount": `${formatCurrency(totalAmount)}`,
        "Cash Transactions": `${cashSales}`,
        "Credit Transactions": `${creditSales}`,
      }}
    />,
    <Button
      key="print-legacy"
      onClick={handlePrintReport}
      variant="outline"
      data-testid="button-print-report-legacy"
    >
      <Printer className="w-4 h-4 mr-2" /> Print Report (Legacy)
    </Button>,
  ];

  return (
    <div className="space-y-6 fade-in max-w-full">
      <StandardPageHeader
        title="Sales History"
        subtitle="Complete transaction history and sales analytics"
      >
        {pageActions.map((action, index) =>
          React.cloneElement(action as React.ReactElement, { key: index }),
        )}
      </StandardPageHeader>

      {/* Bulk Entry Mode Banner */}
      {bulkEntryMode && (
        <Card className="border-2 border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-semibold text-primary">
                      Bulk Entry Mode Active
                    </div>
                    <div className="text-sm text-muted-foreground">
                      All new entries will be recorded for the selected date
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-8">
                  <label className="text-sm font-medium">Entry Date:</label>
                  <Input
                    type="date"
                    value={bulkEntryDate}
                    onChange={(e) => setBulkEntryDate(e.target.value)}
                    className="w-40"
                    data-testid="input-bulk-entry-date"
                  />
                </div>
              </div>
              <Badge variant="default" className="text-base px-4 py-2">
                {format(new Date(bulkEntryDate), "MMM dd, yyyy")}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div
              className="text-2xl font-bold text-primary"
              data-testid="todays-transactions"
            >
              {todaysSales}
            </div>
            <div className="text-sm text-muted-foreground">
              Today's Transactions
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div
              className="text-2xl font-bold text-green-600"
              data-testid="total-sales-amount"
            >
              {formatCurrency(totalAmount)}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Sales Amount
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div
              className="text-2xl font-bold text-blue-600"
              data-testid="cash-transactions"
            >
              {cashSales}
            </div>
            <div className="text-sm text-muted-foreground">
              Cash Transactions
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div
              className="text-2xl font-bold text-orange-600"
              data-testid="credit-transactions"
            >
              {creditSales}
            </div>
            <div className="text-sm text-muted-foreground">
              Credit Transactions
            </div>
          </CardContent>
        </Card>
      </div>

      <StandardFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by invoice, customer..."
        showDateFilter={true}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        statusOptions={paymentMethodOptions}
        statusValue={paymentFilter}
        onStatusChange={setPaymentFilter}
        statusLabel="Payment Method"
        onPrintReport={handlePrintReport}
      />

      {/* Sales History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={showDrafts ? "default" : "outline"}
                onClick={() => setShowDrafts(!showDrafts)}
                data-testid="button-toggle-drafts"
              >
                {showDrafts ? "Hide Drafts" : "Show Drafts"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Invoice</th>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-right p-3 font-medium">Quantity</th>
                  <th className="text-right p-3 font-medium">Rate</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-center p-3 font-medium">Payment</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Draft Sales */}
                {showDrafts &&
                  draftSales.map((draft: DraftSale, index: number) => {
                    const customer = customers.find(
                      (c) => c.id === draft.selectedCustomerId,
                    );
                    const draftTime = new Date(
                      draft.timestamp,
                    ).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr
                        key={`draft-${draft.id}`}
                        className="border-b border-border hover:bg-muted/50 bg-yellow-50 dark:bg-yellow-900/20"
                      >
                        <td className="p-3 text-sm">
                          {format(new Date(draft.timestamp), "yyyy-MM-dd")}
                        </td>
                        <td className="p-3">
                          <span
                            className="font-medium text-yellow-600"
                            data-testid={`draft-invoice-${index}`}
                          >
                            DRAFT-{draft.id.split("-").pop()?.slice(-6)}
                          </span>
                        </td>
                        <td className="p-3">
                          {customer?.name || "Walk-in Customer"}
                        </td>
                        <td className="p-3">
                          {draft.transactionItems.length} items
                        </td>
                        <td className="p-3 text-right">
                          {draft.transactionItems
                            .reduce(
                              (sum, item) => sum + (item.quantity || 0),
                              0,
                            )
                            .toFixed(1)}
                          L
                        </td>
                        <td className="p-3 text-right">-</td>
                        <td
                          className="p-3 text-right font-semibold"
                          data-testid={`draft-amount-${index}`}
                        >
                          {formatCurrency(draft.totalAmount)}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant="outline"
                            className="bg-yellow-100 text-yellow-800"
                          >
                            DRAFT
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleContinueDraft(draft.id)}
                              className="text-green-600 hover:text-green-800 p-1"
                              data-testid={`button-continue-draft-${index}`}
                              title="Continue Draft"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDraft(draft.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              data-testid={`button-delete-draft-${index}`}
                              title="Delete Draft"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {/* Completed Sales */}
                {displayedSales.length > 0
                  ? displayedSales.map(
                      (
                        transaction: SalesTransaction & { items?: any[] },
                        index: number,
                      ) => {
                        const customer = customers.find(
                          (c) => c.id === transaction.customerId,
                        );
                        const transactionTime = transaction.transactionDate
                          ? new Date(
                              transaction.transactionDate,
                            ).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A";

                        return (
                          <tr
                            key={transaction.id}
                            className="border-b border-border hover:bg-muted/50"
                          >
                            <td className="p-3 text-sm">
                              {transaction.transactionDate
                                ? format(
                                    new Date(transaction.transactionDate),
                                    "yyyy-MM-dd",
                                  )
                                : "N/A"}
                            </td>
                            <td className="p-3">
                              <span
                                className="font-medium text-primary"
                                data-testid={`invoice-${index}`}
                              >
                                {transaction.invoiceNumber}
                              </span>
                            </td>
                            <td className="p-3">
                              {customer?.name || "Walk-in Customer"}
                            </td>
                            <td className="p-3">
                              {transaction.items && transaction.items.length > 0
                                ? transaction.items.length === 1
                                  ? transaction.items[0].product?.name
                                  : `${transaction.items.length} items`
                                : "No items"}
                            </td>
                            <td className="p-3 text-right">
                              {transaction.items && transaction.items.length > 0
                                ? transaction.items
                                    .reduce(
                                      (sum: number, item: any) =>
                                        sum + parseFloat(item.quantity || "0"),
                                      0,
                                    )
                                    .toFixed(1) + "L"
                                : "-"}
                            </td>
                            <td className="p-3 text-right">
                              {transaction.items &&
                              transaction.items.length === 1
                                ? formatCurrency(
                                    parseFloat(
                                      transaction.items[0].unitPrice || "0",
                                    ),
                                  )
                                : "-"}
                            </td>
                            <td
                              className="p-3 text-right font-semibold"
                              data-testid={`amount-${index}`}
                            >
                              {formatCurrency(
                                parseFloat(transaction.totalAmount || "0"),
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <Badge
                                variant={
                                  transaction.paymentMethod === "cash"
                                    ? "default"
                                    : transaction.paymentMethod === "credit"
                                      ? "destructive"
                                      : "secondary"
                                }
                                data-testid={`payment-method-${index}`}
                              >
                                {transaction.paymentMethod}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleViewTransaction(transaction.id)
                                  }
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  data-testid={`button-view-${index}`}
                                  title="View Invoice"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleEditTransaction(transaction.id)
                                  }
                                  className="text-green-600 hover:text-green-800 p-1"
                                  data-testid={`button-edit-${index}`}
                                  title="Edit Transaction"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteTransaction(transaction.id)
                                  }
                                  className="text-red-600 hover:text-red-800 p-1"
                                  data-testid={`button-delete-${index}`}
                                  title="Delete Transaction"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      },
                    )
                  : null}

                {/* Show message when no data */}
                {displayedSales.length === 0 &&
                  (!showDrafts || draftSales.length === 0) && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-8 text-center text-muted-foreground"
                      >
                        {showDrafts && draftSales.length === 0
                          ? "No transactions or drafts found"
                          : "No transactions found for the selected criteria"}
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Deletion Confirmation */}
      <DeleteConfirmation
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteTransaction}
        title="Delete Sales Transaction"
        description="Are you sure you want to delete this sales transaction? This action cannot be undone and will permanently remove all transaction data."
        itemName="sales transaction"
        isLoading={deleteSaleMutation.isPending}
      />

      {/* Draft Deletion Confirmation */}
      <DeleteConfirmation
        isOpen={draftDeleteConfirmOpen}
        onClose={() => setDraftDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteDraft}
        title="Delete Draft Sale"
        description="Are you sure you want to delete this draft sale? This action cannot be undone."
        itemName="draft sale"
      />
    </div>
  );
}
