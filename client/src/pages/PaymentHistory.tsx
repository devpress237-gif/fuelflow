import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useStation } from "@/contexts/StationContext";
import { apiRequest } from "@/lib/api";
import { ArrowLeft, Download, Printer, Search, Filter } from "lucide-react";
import { Link } from "wouter";
import { generatePrintTemplate, printDocument, downloadAsPDF, downloadAsPNG } from "@/lib/printUtils";
import type { Payment, Customer, Supplier } from "@shared/schema";
import { formatCompactNumber, toISODate, inISODateRange } from "@/lib/utils";
import { printReport } from "@/lib/printUtils";
import { StandardDateFilter } from "@/components/ui/standard-date-filter";
import { format as formatDate } from "date-fns";
import { StandardPageHeader } from "@/components/ui/standard-page-header";
import { StandardFilterBar } from "@/components/ui/standard-filter-bar";

interface PaymentWithDetails extends Payment {
  customer?: Customer;
  supplier?: Supplier;
}

export default function PaymentHistory() {
  const { id, type } = useParams<{ id: string; type: string }>();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { stationSettings } = useStation();

  const { data: payments = [], isLoading } = useQuery<PaymentWithDetails[]>({
    queryKey: ["/api/payments", user?.stationId, id, type],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/payments/${user?.stationId}`);
      const allPayments = await response.json();
      return allPayments.filter((payment: PaymentWithDetails) =>
        type === 'customer' ? payment.customerId === id : payment.supplierId === id
      );
    },
    enabled: !!user?.stationId && !!id && !!type,
  });

  const { data: customerData } = useQuery<Customer>({
    queryKey: ["/api/customers", id],
    queryFn: () => apiRequest("GET", `/api/customers/${id}`).then(res => res.json()),
    enabled: !!id && type === 'customer',
  });

  const { data: supplierData } = useQuery<Supplier>({
    queryKey: ["/api/suppliers", id],
    queryFn: () => apiRequest("GET", `/api/suppliers/${id}`).then(res => res.json()),
    enabled: !!id && type === 'supplier',
  });

  const entity = type === 'customer' ? customerData : supplierData;
  const totalPayments = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const [filteredPayments, setFilteredPayments] = useState<PaymentWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  useEffect(() => {
    if (!payments) {
      setFilteredPayments([]);
      return;
    }

    const filtered = payments.filter((payment: PaymentWithDetails) => {
      const matchesSearch = payment.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMethod = paymentMethodFilter === "all" || payment.paymentMethod === paymentMethodFilter;

      let matchesDateRange = true;
      if (fromDate || toDate) {
        const paymentDate = payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : '';
        if (fromDate && paymentDate < fromDate) {
          matchesDateRange = false;
        }
        if (toDate && paymentDate > toDate) {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesMethod && matchesDateRange;
    });

    setFilteredPayments(filtered);
  }, [payments, searchTerm, paymentMethodFilter, fromDate, toDate]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setPaymentMethodFilter("all");
    setFromDate("");
    setToDate("");
  };

  const handleApplyFilters = () => {
    // Filters are applied automatically via useEffect
  };

  const handlePrintReport = () => {
    const reportData = filteredPayments.map((payment: PaymentWithDetails) => ({
      'Reference': payment.referenceNumber,
      'Type': payment.type,
      'Party': payment.customer?.name || payment.supplier?.name || 'N/A',
      'Amount': formatCompactNumber(payment.amount),
      'Method': payment.paymentMethod,
      'Date': new Date(payment.paymentDate).toLocaleDateString(),
      'Notes': payment.notes || 'N/A'
    }));

    printReport({
      title: 'Payment History Report',
      subtitle: 'All Records',
      data: reportData,
      summary: [
        { label: 'Total Payments', value: filteredPayments.length.toString() },
        { label: 'Total Amount', value: formatCompactNumber(filteredPayments.reduce((sum: number, p: PaymentWithDetails) => sum + parseFloat(p.amount || '0'), 0)) }
      ]
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "receivable", label: "Receivable" },
    { value: "payable", label: "Payable" }
  ];

  const methodOptions = [
    { value: "all", label: "All Methods" },
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "bank", label: "Bank Transfer" },
    { value: "check", label: "Check" }
  ];

  return (
    <div className="min-h-screen bg-background space-y-6 fade-in">
      <div className="container mx-auto px-4 sm:px-6">
        <StandardPageHeader
          title={`Payment History - ${entity?.name}`}
          subtitle={`Total: ${formatCurrency(totalPayments)} | Outstanding: ${formatCurrency(parseFloat(entity?.outstandingAmount || '0'))}`}
        >
          <Link href={type === 'customer' ? '/accounts-receivable' : '/accounts-payable'}>
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </StandardPageHeader>

        <StandardFilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search payments..."
          showDateFilter={true}
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          statusOptions={typeOptions}
          statusValue={typeFilter}
          onStatusChange={setTypeFilter}
          statusLabel="Type"
          methodOptions={methodOptions}
          methodValue={paymentMethodFilter}
          onMethodChange={setPaymentMethodFilter}
          methodLabel="Method"
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          onPrintReport={handlePrintReport}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <Card className="print:shadow-none print:border-none">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border rounded-md gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-lg">{formatCurrency(parseFloat(payment.amount))}</div>
                    <div className="text-sm text-muted-foreground">
                      {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'} • {payment.paymentMethod}
                    </div>
                    {payment.referenceNumber && (
                      <div className="text-xs text-muted-foreground">Ref: {payment.referenceNumber}</div>
                    )}
                    {payment.notes && (
                      <div className="text-xs text-muted-foreground mt-1">{payment.notes}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline">{payment.type}</Badge>
                    <div className="text-xs text-muted-foreground">
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleTimeString() : 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredPayments.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No payment records found for this {type}.
              </div>
            )}

            {filteredPayments.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{filteredPayments.length}</div>
                    <div className="text-sm text-muted-foreground">Total Payments</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(filteredPayments.reduce((sum: number, p: PaymentWithDetails) => sum + parseFloat(p.amount || '0'), 0))}</div>
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{formatCurrency(parseFloat(entity?.outstandingAmount || '0'))}</div>
                    <div className="text-sm text-muted-foreground">Outstanding</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}