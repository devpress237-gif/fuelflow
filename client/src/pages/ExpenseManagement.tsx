import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiRequest } from "@/lib/api";
import { Plus, Download, Edit, Trash2, Eye, Filter } from "lucide-react";
import { generateEnhancedPrintTemplate, globalPrintDocument } from "@/lib/printUtils";
import { Combobox } from "@/components/ui/combobox";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EyeIcon } from "lucide-react";
import { toISODate, inISODateRange } from "@/lib/utils";
import { StandardPageHeader } from "@/components/ui/standard-page-header";
import { StandardFilterBar } from "@/components/ui/standard-filter-bar";

// Placeholder for Customer Activity Page (to be implemented or fixed)
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface CustomerActivity {
  id: string;
  customerId: string;
  activityType: string;
  details: string;
  activityDate: string;
  createdAt: string;
  customer?: {
    name: string;
  };
}

interface Expense {
  id: string;
  description: string;
  amount: string;
  accountId?: string;
  paymentMethod: string;
  expenseDate: string;
  receiptNumber?: string;
  vendorName?: string;
  notes?: string;
  stationId: string;
  userId: string;
  createdAt: string;
  account?: {
    id: string;
    code: string;
    name: string;
    type: string;
    parentAccountId?: string;
    parentAccount?: {
      name: string;
      code: string;
    };
  };
  category?: string;
  date?: string; // Added for potential date filtering
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  parentAccountId?: string;
  parentAccount?: {
    name: string;
    code: string;
  };
  childAccounts?: Account[];
}

// Placeholder Schema for Customer Activity (to be defined based on actual fields)
const customerActivitySchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  activityType: z.string().min(1, "Activity type is required"),
  details: z.string().min(1, "Details are required"),
  activityDate: z.date(),
});

const expenseSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  paymentMethod: z.enum(['cash', 'card', 'credit', 'fleet']),
  notes: z.string().optional(),
  expenseDate: z.string().min(1, "Expense date is required"),
  receiptNumber: z.string().optional(),
});

// Placeholder for Customer Activity Page Component
function CustomerActivityPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<CustomerActivity | null>(null);
  const [filters, setFilters] = useState({
    customerId: "",
    activityType: "",
    fromDate: null,
    toDate: null,
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers", user?.stationId],
    queryFn: () => apiRequest("GET", `/api/customers?stationId=${user?.stationId}`).then(res => res.json()),
    enabled: !!user?.stationId,
  });

  const { data: activities = [], isLoading } = useQuery<CustomerActivity[]>({
    queryKey: ["/api/customer-activities", user?.stationId, filters],
    queryFn: () => {
      let url = `/api/customer-activities?stationId=${user?.stationId}`;
      if (filters.customerId) url += `&customerId=${filters.customerId}`;
      if (filters.activityType) url += `&activityType=${filters.activityType}`;
      if (filters.fromDate) url += `&fromDate=${toISODate(filters.fromDate)}`;
      if (filters.toDate) url += `&toDate=${toISODate(filters.toDate)}`;
      return apiRequest("GET", url).then(res => res.json());
    },
    enabled: !!user?.stationId,
  });

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
    queryClient.invalidateQueries({ queryKey: ["/api/customer-activities", user?.stationId, filters] });
  };

  const handleViewDetails = (activity: CustomerActivity) => {
    setSelectedActivity(activity);
    setDetailsOpen(true);
  };

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

  return (
    <div className="space-y-6 fade-in max-w-full">
      <StandardPageHeader
        title="Customer Activity"
        subtitle="View and manage customer interactions and activities"
      >
        <Button data-testid="button-add-activity">
          <Plus className="w-4 h-4 mr-2" />
          Add Activity
        </Button>
      </StandardPageHeader>

      <StandardFilterBar
        showDateFilter={true}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
        filterOptions={{
          customers: customers.map(c => ({ value: c.id, label: c.name })),
          activityTypes: [
            { value: "purchase", label: "Purchase" },
            { value: "inquiry", label: "Inquiry" },
            { value: "support", label: "Support" },
          ],
        }}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Activity Type</th>
                  <th className="text-left p-3 font-medium">Details</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.length > 0 ? activities.map((activity) => (
                  <tr key={activity.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3">
                      {activity.activityDate ? format(new Date(activity.activityDate), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="p-3">
                      {activity.customer?.name || 'Unknown Customer'}
                    </td>
                    <td className="p-3">
                      {activity.activityType}
                    </td>
                    <td className="p-3">
                      <div className="truncate max-w-xs">{activity.details}</div>
                    </td>
                    <td className="p-3 text-center">
                      <Button variant="outline" size="sm" className="p-2" onClick={() => handleViewDetails(activity)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No customer activities found for the selected criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>
          {selectedActivity ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold">Customer:</div>
                  <div>{selectedActivity.customer?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-semibold">Activity Type:</div>
                  <div>{selectedActivity.activityType}</div>
                </div>
              </div>
              <div>
                <div className="font-semibold">Activity Date:</div>
                <div>{format(new Date(selectedActivity.activityDate), 'MMM dd, yyyy HH:mm')}</div>
              </div>
              <div>
                <div className="font-semibold">Details:</div>
                <div>{selectedActivity.details}</div>
              </div>
              <div>
                <div className="font-semibold">Recorded At:</div>
                <div>{format(new Date(selectedActivity.createdAt), 'MMM dd, yyyy HH:mm')}</div>
              </div>
            </div>
          ) : (
            <p>Loading activity details...</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


// Accounts Receivable Page (Placeholder - Add Date Picker and Add Button)
function AccountsReceivablePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    customerId: "",
    fromDate: null,
    toDate: null,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers", user?.stationId],
    queryFn: () => apiRequest("GET", `/api/customers?stationId=${user?.stationId}`).then(res => res.json()),
    enabled: !!user?.stationId,
  });

  const { data: receivables = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/receivables", user?.stationId, filters],
    queryFn: () => {
      let url = `/api/receivables?stationId=${user?.stationId}`;
      if (filters.customerId) url += `&customerId=${filters.customerId}`;
      if (filters.fromDate) url += `&fromDate=${toISODate(filters.fromDate)}`;
      if (filters.toDate) url += `&toDate=${toISODate(filters.toDate)}`;
      return apiRequest("GET", url).then(res => res.json());
    },
    enabled: !!user?.stationId,
  });

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
    queryClient.invalidateQueries({ queryKey: ["/api/receivables", user?.stationId, filters] });
  };

  const handleNewReceivable = () => {
    // Logic to open a dialog or navigate to a new page for adding receivable
    alert("Navigate to Add Receivable Page or open modal");
  };

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

  return (
    <div className="space-y-6 fade-in max-w-full">
      <StandardPageHeader
        title="Accounts Receivable"
        subtitle="Manage outstanding invoices and customer payments"
        onCreate={handleNewReceivable}
        createButtonText="Add Receivable"
      >
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </StandardPageHeader>

      <StandardFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search receivables..."
        showDateFilter={true}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
        filterOptions={{
          customers: customers.map(c => ({ value: c.id, label: c.name })),
        }}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Invoice #</th>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Due Date</th>
                  <th className="text-right p-3 font-medium">Amount Due</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {receivables.length > 0 ? receivables.map((receivable) => (
                  <tr key={receivable.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3">{receivable.invoiceNumber || 'N/A'}</td>
                    <td className="p-3">{receivable.customerName || 'Unknown'}</td>
                    <td className="p-3">{receivable.dueDate ? format(new Date(receivable.dueDate), 'MMM dd, yyyy') : 'N/A'}</td>
                    <td className="p-3 text-right font-semibold text-red-600">{receivable.amountDue}</td>
                    <td className="p-3 text-center"><Badge variant="outline">{receivable.status}</Badge></td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button variant="outline" size="sm" className="p-2"><Edit className="w-4 h-4" /></Button>
                        <Button variant="outline" size="sm" className="p-2 text-red-600"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No accounts receivable found for the selected criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// Accounts Payable Page (Placeholder - Add Date Picker and Add Button)
function AccountsPayablePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    vendorId: "",
    fromDate: null,
    toDate: null,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const { data: vendors = [] } = useQuery<any[]>({
    queryKey: ["/api/vendors", user?.stationId],
    queryFn: () => apiRequest("GET", `/api/vendors?stationId=${user?.stationId}`).then(res => res.json()),
    enabled: !!user?.stationId,
  });

  const { data: payables = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/payables", user?.stationId, filters],
    queryFn: () => {
      let url = `/api/payables?stationId=${user?.stationId}`;
      if (filters.vendorId) url += `&vendorId=${filters.vendorId}`;
      if (filters.fromDate) url += `&fromDate=${toISODate(filters.fromDate)}`;
      if (filters.toDate) url += `&toDate=${toISODate(filters.toDate)}`;
      return apiRequest("GET", url).then(res => res.json());
    },
    enabled: !!user?.stationId,
  });

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
    queryClient.invalidateQueries({ queryKey: ["/api/payables", user?.stationId, filters] });
  };

  const handleNewPayable = () => {
    // Logic to open a dialog or navigate to a new page for adding payable
    alert("Navigate to Add Payable Page or open modal");
  };

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

  return (
    <div className="space-y-6 fade-in max-w-full">
      <StandardPageHeader
        title="Accounts Payable"
        subtitle="Manage bills and payments to vendors"
        onCreate={handleNewPayable}
        createButtonText="Add Payable"
      >
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </StandardPageHeader>

      <StandardFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search payables..."
        showDateFilter={true}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
        filterOptions={{
          vendors: vendors.map(v => ({ value: v.id, label: v.name })),
        }}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Invoice #</th>
                  <th className="text-left p-3 font-medium">Vendor</th>
                  <th className="text-left p-3 font-medium">Due Date</th>
                  <th className="text-right p-3 font-medium">Amount Due</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payables.length > 0 ? payables.map((payable) => (
                  <tr key={payable.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3">{payable.invoiceNumber || 'N/A'}</td>
                    <td className="p-3">{payable.vendorName || 'Unknown'}</td>
                    <td className="p-3">{payable.dueDate ? format(new Date(payable.dueDate), 'MMM dd, yyyy') : 'N/A'}</td>
                    <td className="p-3 text-right font-semibold text-red-600">{payable.amountDue}</td>
                    <td className="p-3 text-center"><Badge variant="outline">{payable.status}</Badge></td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button variant="outline" size="sm" className="p-2"><Edit className="w-4 h-4" /></Button>
                        <Button variant="outline" size="sm" className="p-2 text-red-600"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No accounts payable found for the selected criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// Purchase Orders Page (Placeholder - Add Date Picker, Add Button, Filters)
function PurchaseOrdersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    supplierId: "",
    fromDate: null,
    toDate: null,
    status: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers", user?.stationId],
    queryFn: () => apiRequest("GET", `/api/suppliers?stationId=${user?.stationId}`).then(res => res.json()),
    enabled: !!user?.stationId,
  });

  const { data: purchaseOrders = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/purchase-orders", user?.stationId, filters],
    queryFn: () => {
      let url = `/api/purchase-orders?stationId=${user?.stationId}`;
      if (filters.supplierId) url += `&supplierId=${filters.supplierId}`;
      if (filters.status !== "all") url += `&status=${filters.status}`;
      if (filters.fromDate) url += `&fromDate=${toISODate(filters.fromDate)}`;
      if (filters.toDate) url += `&toDate=${toISODate(filters.toDate)}`;
      return apiRequest("GET", url).then(res => res.json());
    },
    enabled: !!user?.stationId,
  });

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
    queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders", user?.stationId, filters] });
  };

  const handleNewPurchaseOrder = () => {
    // Logic to open a dialog or navigate to a new page for adding purchase order
    alert("Navigate to Add Purchase Order Page or open modal");
  };

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

  return (
    <div className="space-y-6 fade-in max-w-full">
      <StandardPageHeader
        title="Purchase Orders"
        subtitle="Manage your company's purchase orders"
        onCreate={handleNewPurchaseOrder}
        createButtonText="Create PO"
      >
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </StandardPageHeader>

      <StandardFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search purchase orders..."
        showDateFilter={true}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
        filterOptions={{
          suppliers: suppliers.map(s => ({ value: s.id, label: s.name })),
          statuses: [
            { value: "all", label: "All Statuses" },
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "received", label: "Received" },
            { value: "cancelled", label: "Cancelled" },
          ],
        }}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">PO #</th>
                  <th className="text-left p-3 font-medium">Supplier</th>
                  <th className="text-left p-3 font-medium">Order Date</th>
                  <th className="text-right p-3 font-medium">Total Amount</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length > 0 ? purchaseOrders.map((po) => (
                  <tr key={po.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3">{po.orderNumber || 'N/A'}</td>
                    <td className="p-3">{po.supplierName || 'Unknown'}</td>
                    <td className="p-3">{po.orderDate ? format(new Date(po.orderDate), 'MMM dd, yyyy') : 'N/A'}</td>
                    <td className="p-3 text-right font-semibold">{po.totalAmount}</td>
                    <td className="p-3 text-center"><Badge variant="outline">{po.status}</Badge></td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button variant="outline" size="sm" className="p-2"><Eye className="w-4 h-4" /></Button>
                        <Button variant="outline" size="sm" className="p-2"><Edit className="w-4 h-4" /></Button>
                        <Button variant="outline" size="sm" className="p-2 text-red-600"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No purchase orders found for the selected criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function ExpenseManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { formatCurrency, currencyConfig } = useCurrency();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [open, setOpen] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);

  // Filter states for ExpenseManagement page
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");


  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      accountId: "",
      amount: "",
      description: "",
      category: "",
      paymentMethod: "cash" as const,
      notes: "",
      expenseDate: new Date().toISOString().split('T')[0],
      receiptNumber: "",
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const expenseData = {
        ...data,
        stationId: user?.stationId,
        userId: user?.id,
        currencyCode: currencyConfig.code,
      };
      const response = await apiRequest("POST", "/api/expenses", expenseData);
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Expense recorded",
        description: "Expense has been recorded successfully",
      });
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", user?.stationId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record expense",
        variant: "destructive",
      });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const expenseData = {
        description: data.description,
        amount: parseFloat(data.amount).toString(),
        accountId: data.accountId,
        expenseDate: data.expenseDate,
        receiptNumber: data.receiptNumber || "",
        notes: data.notes || "",
        currencyCode: currencyConfig.code,
      };

      const response = await apiRequest("PUT", `/api/expenses/${id}`, expenseData);
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Expense updated",
        description: "Expense has been updated successfully",
      });
      setEditExpenseId(null);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", user?.stationId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update expense",
        variant: "destructive",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/expenses/${id}`);
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Expense deleted",
        description: "Expense has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", user?.stationId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editExpenseId) {
      updateExpenseMutation.mutate({ id: editExpenseId, data });
    } else {
      createExpenseMutation.mutate(data);
    }
  };

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", user?.stationId],
    queryFn: () => apiRequest("GET", `/api/expenses?stationId=${user?.stationId}`).then(res => res.json()),
    enabled: !!user?.stationId,
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts", user?.stationId],
    queryFn: () => apiRequest("GET", `/api/accounts?stationId=${user?.stationId}&type=expense`).then(res => res.json()),
    enabled: !!user?.stationId,
  });

  const handleApplyFilters = () => {
    // Filtering is handled by useEffect
  };

  const handlePrintReport = () => {
    const dataToUse = filteredExpenses.length > 0 ? filteredExpenses : expenses;
    const printContent = generateEnhancedPrintTemplate({
      title: "Expense Management Report",
      data: dataToUse,
      columns: [
        { key: 'expenseDate', label: 'Date', format: 'date' },
        { key: 'description', label: 'Description' },
        { key: 'amount', label: 'Amount', format: 'currency' },
        { key: 'account.name', label: 'Account' },
        { key: 'receiptNumber', label: 'Receipt #' }
      ],
      showSummary: true,
      summaryData: {
        'Total Expenses': `${dataToUse.length}`,
        'Total Amount': `${formatCurrency(dataToUse.reduce((sum, exp) => sum + parseFloat(exp.amount || '0'), 0))}`,
        'Date Range': 'All Time' // This should be dynamic based on filters
      },
      showDate: true,
      showPageNumbers: true
    });

    globalPrintDocument(printContent, `Expense_Report_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  useEffect(() => {
    if (!expenses) {
      setFilteredExpenses([]);
      return;
    }

    const filtered = expenses.filter((expense: Expense) => {
      const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;

      let matchesDateRange = true;
      if (fromDate || toDate) {
        const expenseDate = expense.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : '';
        if (fromDate && toDate) {
          // Both dates provided - check if expense date is within range
          matchesDateRange = expenseDate >= fromDate && expenseDate <= toDate;
        } else if (fromDate) {
          // Only from date - check if expense date is on or after
          matchesDateRange = expenseDate >= fromDate;
        } else if (toDate) {
          // Only to date - check if expense date is on or before
          matchesDateRange = expenseDate <= toDate;
        }
      }

      return matchesSearch && matchesCategory && matchesDateRange;
    });

    if (JSON.stringify(filtered) !== JSON.stringify(filteredExpenses)) {
      setFilteredExpenses(filtered);
    }
  }, [searchTerm, categoryFilter, fromDate, toDate, expenses, filteredExpenses]);

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

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || '0'), 0);
  const thisMonthExpenses = filteredExpenses.filter(exp => {
    const expenseDate = new Date(exp.expenseDate || exp.createdAt);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  }).length;

  const handleEditExpense = (expense: Expense) => {
    setEditExpenseId(expense.id);
    form.reset({
      description: expense.description,
      amount: expense.amount,
      accountId: expense.accountId || "",
      expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      receiptNumber: expense.receiptNumber || "",
      notes: expense.notes || "",
    });
    setOpen(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    if (window.confirm(`Are you sure you want to delete expense: "${expense.description}"?`)) {
      deleteExpenseMutation.mutate(expense.id);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setFromDate("");
    setToDate("");
  };

  const handleNewExpense = () => {
    setEditExpenseId(null);
    form.reset({
      accountId: "",
      amount: "",
      description: "",
      category: "",
      paymentMethod: "cash" as const,
      notes: "",
      expenseDate: new Date().toISOString().split('T')[0],
      receiptNumber: "",
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6 fade-in max-w-full">
      <StandardPageHeader
        title="Expense Management"
        subtitle="Track and manage business expenses and operational costs"
      >
        <Button onClick={handleNewExpense} data-testid="button-create-expense">
          <Plus className="w-4 h-4 mr-2" />
          Record Expense
        </Button>
        <Button variant="outline" onClick={handlePrintReport} data-testid="button-export-report">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </StandardPageHeader>

      <StandardFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search expenses..."
        showDateFilter={true}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onApplyFilters={handleApplyFilters}
        initialFilters={{ categoryFilter, fromDate, toDate }}
        filterOptions={{
          categories: [
            { value: "all", label: "All Categories" },
            { value: "utilities", label: "Utilities" },
            { value: "maintenance", label: "Maintenance" },
            { value: "supplies", label: "Supplies" },
            { value: "other", label: "Other" },
          ],
        }}
        onClearFilters={handleClearFilters}
      />

      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setEditExpenseId(null);
          form.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editExpenseId ? "Edit Expense" : "Record New Expense"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expenseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expense Date *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount ({currencyConfig.symbol}) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account *</FormLabel>
                      <FormControl>
                        <Combobox
                          options={accounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select account"
                          emptyMessage="No expense accounts found"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Input placeholder="Expense description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="utilities">Utilities</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="supplies">Supplies</SelectItem>
                            <SelectItem value="fuel_purchase">Fuel Purchase</SelectItem>
                            <SelectItem value="salaries">Salaries</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                            <SelectItem value="fleet">Fleet</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="receiptNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Receipt/Invoice number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}>
                    {editExpenseId ? "Update Expense" : "Record Expense"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{filteredExpenses.length}</div>
            <div className="text-sm text-muted-foreground">Total Expenses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <div className="text-sm text-muted-foreground">Total Amount</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{thisMonthExpenses}</div>
            <div className="text-sm text-muted-foreground">This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalExpenses / (filteredExpenses.length || 1))}
            </div>
            <div className="text-sm text-muted-foreground">Average Expense</div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-left p-3 font-medium">Account</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-center p-3 font-medium">Receipt #</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3">
                      {expense.expenseDate ? format(new Date(expense.expenseDate), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{expense.description}</div>
                      {expense.notes && (
                        <div className="text-sm text-muted-foreground">{expense.notes}</div>
                      )}
                    </td>
                    <td className="p-3">
                      {accounts.find(a => a.id === expense.accountId)?.name || 'Unknown Account'}
                    </td>
                    <td className="p-3 text-right font-semibold text-red-600">
                      {formatCurrency(parseFloat(expense.amount || '0'))}
                    </td>
                    <td className="p-3 text-center">
                      {expense.receiptNumber || '-'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button variant="outline" size="sm" className="p-2" onClick={() => handleEditExpense(expense)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="p-2 text-red-600" onClick={() => handleDeleteExpense(expense)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No expenses found for the selected criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}