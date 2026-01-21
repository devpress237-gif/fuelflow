import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format } from "date-fns";
import { Eye, Download, TrendingUp, TrendingDown, Activity, Search, Filter, Printer, CreditCard, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StandardPageHeader } from "@/components/ui/standard-page-header";
import { StandardTableContainer } from "@/components/ui/standard-table-container";
import { ResponsiveContainer } from "@/components/ui/responsive-container";
import { globalPrintDocument, generateEnhancedPrintTemplate } from "@/lib/printUtils";
import { formatDateShort } from "@/lib/utils";
import { StandardFilterBar } from "@/components/ui/standard-filter-bar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

interface CustomerActivity {
  id: string;
  customerId: string;
  customerName: string;
  type: 'sale' | 'payment' | 'credit' | 'adjustment';
  description: string;
  amount: number;
  balance: number;
  date: string;
  referenceNumber: string;
  paymentMethod?: string;
  status: 'completed' | 'pending' | 'cancelled';
  activityDate?: string; // Assuming this is the correct field for date filtering
}

export default function CustomerActivity() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<CustomerActivity | null>(null);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: activities = [], isLoading } = useQuery<CustomerActivity[]>({
    queryKey: ["/api/customer-activities", user?.stationId],
    enabled: !!user?.stationId,
  });

  const typeOptions = [
    { label: "All", value: "all" },
    { label: "Sale", value: "sale" },
    { label: "Payment", value: "payment" },
    { label: "Credit", value: "credit" },
    { label: "Adjustment", value: "adjustment" },
  ];

  const filteredActivities = useMemo(() => {
    if (!activities) return [];

    return activities.filter((activity: CustomerActivity) => {
      const matchesSearch = !searchTerm || 
        (activity.customerName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (activity.referenceNumber?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (activity.description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === "all" || activity.type === typeFilter;

      let matchesDateRange = true;
      if (fromDate || toDate) {
        const activityDate = activity.date ? activity.date.split('T')[0] : '';
        if (fromDate && activityDate < fromDate) {
          matchesDateRange = false;
        }
        if (toDate && activityDate > toDate) {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesType && matchesDateRange;
    });
  }, [searchTerm, typeFilter, fromDate, toDate, activities]);

  const handleApplyFilters = () => {
    // Filtering is handled by useEffect
  };

  const handlePrintReport = () => {
    const printContent = generateEnhancedPrintTemplate({
      title: "Customer Activity Report",
      data: filteredActivities,
      columns: [
        { key: 'date', label: 'Date', format: 'date' },
        { key: 'customerName', label: 'Customer' },
        { key: 'type', label: 'Activity' },
        { key: 'description', label: 'Description' },
        { key: 'amount', label: 'Amount', format: 'currency' },
        { key: 'balance', label: 'Balance', format: 'currency' },
        { key: 'status', label: 'Status' }
      ],
      showSummary: true,
      summaryData: {
        'Total Activities': `${filteredActivities.length}`,
      },
      showDate: true,
      showPageNumbers: true
    });

    globalPrintDocument(printContent, `Customer_Activity_Report_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const handleViewDetails = (activity: CustomerActivity) => {
    setSelectedActivity(activity);
    setDetailsOpen(true);
  };

  const handleExportActivities = () => {
    const csvContent = [
      ['Date', 'Customer', 'Type', 'Description', 'Amount', 'Balance', 'Reference', 'Status'],
      ...filteredActivities.map(activity => [
        format(new Date(activity.date), 'yyyy-MM-dd'),
        activity.customerName,
        activity.type,
        activity.description,
        activity.amount.toString(),
        activity.balance.toString(),
        activity.referenceNumber,
        activity.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customer-activities-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale': return '🛒';
      case 'payment': return '💰';
      case 'credit': return '💳';
      case 'adjustment': return '⚙️';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  // Calculate statistics
  const totalSales = filteredActivities.filter(a => a.type === 'sale').reduce((sum, a) => sum + a.amount, 0);
  const totalPayments = filteredActivities.filter(a => a.type === 'payment').reduce((sum, a) => sum + a.amount, 0);
  const completedActivities = filteredActivities.filter(a => a.status === 'completed').length;
  const pendingActivities = filteredActivities.filter(a => a.status === 'pending').length;

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setFromDate("");
    setToDate("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer>
      <div className="w-full max-w-none space-y-6 fade-in">
        <StandardPageHeader
          title="Customer Activity Timeline"
          subtitle="Track all customer interactions and transaction history"
          showDateFilter={false}
        >
          <Button onClick={handlePrintReport} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
          <Button onClick={handleExportActivities} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </StandardPageHeader>

        <StandardFilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search customers..."
          showDateFilter={true}
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          statusOptions={typeOptions}
          statusValue={typeFilter}
          onStatusChange={setTypeFilter}
          statusLabel="Activity Type"
          onPrintReport={handlePrintReport}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                  <h3 className="text-2xl font-bold mt-2">{filteredActivities.length}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                  <h3 className="text-2xl font-bold mt-2 text-red-600">{formatCurrency(totalSales)}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
                  <h3 className="text-2xl font-bold mt-2 text-green-600">{formatCurrency(totalPayments)}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-2">
                    <p className="text-sm"><span className="font-semibold text-green-600">{completedActivities}</span> Completed</p>
                    <p className="text-sm"><span className="font-semibold text-orange-600">{pendingActivities}</span> Pending</p>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline Table */}
        <StandardTableContainer title="Activity Timeline">
          <div className="compact-mobile">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Activity</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Description</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-right p-3 font-medium hidden lg:table-cell">Balance</th>
                  <th className="text-center p-3 font-medium hidden sm:table-cell">Status</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <div className="font-medium text-sm">
                        {activity.date ? format(new Date(activity.date), 'yyyy-MM-dd') : 'N/A'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{activity.customerName}</div>
                      <div className="text-sm text-muted-foreground">ID: {activity.customerId.slice(-6)}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getActivityIcon(activity.type)}</span>
                        <span className="capitalize font-medium">{activity.type}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Ref: {activity.referenceNumber}
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <div className="max-w-xs truncate text-sm">{activity.description}</div>
                      {activity.paymentMethod && (
                        <div className="text-xs text-muted-foreground">
                          via {activity.paymentMethod}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-semibold ${
                        activity.type === 'payment' ? 'text-green-600' :
                        activity.type === 'sale' ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {activity.type === 'payment' ? '+' : activity.type === 'sale' ? '-' : ''}
                        {formatCurrency(Math.abs(activity.amount))}
                      </span>
                    </td>
                    <td className="p-3 text-right hidden lg:table-cell">
                      <span className={`font-semibold text-sm ${
                        activity.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(activity.balance)}
                      </span>
                    </td>
                    <td className="p-3 text-center hidden sm:table-cell">
                      <Badge variant={getStatusColor(activity.status)} className="text-xs">
                        {activity.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(activity)}
                        className="p-2"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredActivities.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No activities found for the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </StandardTableContainer>

        {/* Activity Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Activity Details</DialogTitle>
            </DialogHeader>
            {selectedActivity && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Customer</label>
                    <p className="text-sm text-muted-foreground">{selectedActivity.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Activity Type</label>
                    <p className="text-sm text-muted-foreground capitalize">{selectedActivity.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date & Time</label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedActivity.date), 'MMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reference Number</label>
                    <p className="text-sm text-muted-foreground">{selectedActivity.referenceNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Amount</label>
                    <p className="text-sm text-muted-foreground">{formatCurrency(selectedActivity.amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Running Balance</label>
                    <p className="text-sm text-muted-foreground">{formatCurrency(selectedActivity.balance)}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <p className="text-sm text-muted-foreground">{selectedActivity.description}</p>
                  </div>
                  {selectedActivity.paymentMethod && (
                    <div>
                      <label className="text-sm font-medium">Payment Method</label>
                      <p className="text-sm text-muted-foreground">{selectedActivity.paymentMethod}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Badge variant={getStatusColor(selectedActivity.status)}>
                      {selectedActivity.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ResponsiveContainer>
  );
}