import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Customer } from "@shared/schema";
import { insertCustomerSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { Eye, Edit, CreditCard, Trash2, Plus } from "lucide-react";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import { StandardPageHeader } from "@/components/ui/standard-page-header";
import { StandardFilterBar } from "@/components/ui/standard-filter-bar";
import { StandardTableContainer } from "@/components/ui/standard-table-container";
import {
  generateEnhancedPrintTemplate,
  globalPrintDocument,
} from "@/lib/printUtils";
import { format } from "date-fns";

export default function CustomerManagement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currencyConfig, formatCurrency } = useCurrency() || {
    currencyConfig: { symbol: "₹" },
    formatCurrency: (amount: number) => `₹${amount}`,
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  const editForm = useForm({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      type: "walk-in",
      contactPhone: "",
      contactEmail: "",
      address: "",
      gstNumber: "",
      creditLimit: "0",
      outstandingAmount: "0",
    },
  });

  const paymentForm = useForm({
    resolver: zodResolver(
      z.object({
        amount: z.string().min(1, "Amount is required"),
        paymentMethod: z.enum(["cash", "card"]),
        referenceNumber: z.string().optional(),
        notes: z.string().optional(),
      }),
    ),
    defaultValues: {
      amount: "",
      paymentMethod: "cash" as const,
      referenceNumber: "",
      notes: "",
    },
  });

  const form = useForm({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      type: "walk-in" as const,
      contactPhone: "",
      contactEmail: "",
      address: "",
      gstNumber: "",
      creditLimit: "0",
      outstandingAmount: "0",
    },
  });

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { toast } = useToast();

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Customer created",
        description: "New customer has been added successfully",
      });
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/customers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Customer updated",
        description: "Customer information has been updated successfully",
      });
      setEditDialogOpen(false);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest("POST", "/api/payments", paymentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment recorded",
        description: "Payment has been recorded successfully",
      });
      setPaymentDialogOpen(false);
      paymentForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createCustomerMutation.mutate(data);
  };

  const onEditSubmit = (data: any) => {
    if (!selectedCustomer) return;
    updateCustomerMutation.mutate({ id: selectedCustomer.id, data });
  };

  const onPaymentSubmit = (data: any) => {
    if (!selectedCustomer || !user) return;

    if (!user.id) {
      toast({
        title: "Error",
        description: "User authentication required to record payment",
        variant: "destructive",
      });
      return;
    }

    const paymentData = {
      customerId: selectedCustomer.id,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      type: "receivable",
      stationId: user.stationId || "default-station",
      userId: user.id,
      currencyCode: "PKR",
    };
    recordPaymentMutation.mutate(paymentData);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setViewDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    editForm.reset({
      name: customer.name,
      type: customer.type,
      contactPhone: customer.contactPhone || "",
      contactEmail: customer.contactEmail || "",
      address: customer.address || "",
      gstNumber: customer.gstNumber || "",
      creditLimit: customer.creditLimit || "0",
      outstandingAmount: customer.outstandingAmount || "0",
    });
    setEditDialogOpen(true);
  };

  const handlePaymentCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    paymentForm.reset({
      amount: "",
      paymentMethod: "cash" as const,
      referenceNumber: "",
      notes: "",
    });
    setPaymentDialogOpen(true);
  };

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/customers/${id}`);
      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Failed to delete customer" }));
        throw new Error(error.message || "Failed to delete customer");
      }
      return response.json().catch(() => ({ message: "Success" }));
    },
    onSuccess: () => {
      toast({
        title: "Customer deleted",
        description: "Customer has been deleted successfully",
      });
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
    },
  });

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteCustomerMutation.mutate(customerToDelete);
    }
  };

  const handleApplyFilters = () => {
    let filtered = customers.filter((customer: Customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.gstNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contactPhone
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        customer.contactEmail
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        customer.address?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || customer.type === filterType;
      return matchesSearch && matchesType;
    });
    setFilteredCustomers(filtered);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFromDate("");
    setToDate("");
  };

  const handlePrintReport = () => {
    const printContent = generateEnhancedPrintTemplate({
      title: "Customer Management Report",
      data: filteredCustomers,
      columns: [
        { key: "createdAt", label: "Date Added", format: "date" },
        { key: "name", label: "Customer Name" },
        { key: "type", label: "Type" },
        { key: "contactPhone", label: "Phone" },
        { key: "creditLimit", label: "Credit Limit", format: "currency" },
        { key: "outstandingAmount", label: "Outstanding", format: "currency" },
      ],
      showSummary: true,
      summaryData: {
        "Total Customers": `${filteredCustomers.length}`,
        "Credit Customers": `${filteredCustomers.filter((c) => c.type === "credit").length}`,
        "Total Outstanding": `${formatCurrency(filteredCustomers.reduce((sum, c) => sum + parseFloat(c.outstandingAmount || "0"), 0))}`,
      },
      showDate: true,
      showPageNumbers: true,
    });

    globalPrintDocument(
      printContent,
      `Customer_Report_${format(new Date(), "yyyy-MM-dd")}`,
    );
  };

  useEffect(() => {
    let filtered = customers.filter((customer: Customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.gstNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contactPhone?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || customer.type === filterType;

      let matchesDateRange = true;
      if (fromDate || toDate) {
        const createdAtDate = customer.createdAt ? new Date(customer.createdAt).toISOString().split('T')[0] : '';
        if (fromDate && createdAtDate < fromDate) matchesDateRange = false;
        if (toDate && createdAtDate > toDate) matchesDateRange = false;
      }

      return matchesSearch && matchesType && matchesDateRange;
    });
    setFilteredCustomers(filtered);
  }, [searchTerm, filterType, fromDate, toDate, customers]);

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
    <div className="space-y-6 fade-in">
      <StandardPageHeader
        title="Customer Management"
        subtitle="Manage customer profiles, credit accounts, and payment history"
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-customer">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="walk-in">Walk-in</SelectItem>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Customer address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="creditLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Credit Limit ({currencyConfig.symbol})
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gstNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Number</FormLabel>
                        <FormControl>
                          <Input placeholder="GST number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Customer</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </StandardPageHeader>

      <StandardFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search customers by name, phone, email..."
        statusOptions={[
          { value: "all", label: "All Types" },
          { value: "walk-in", label: "Walk-in" },
          { value: "regular", label: "Regular" },
          { value: "credit", label: "Credit" },
        ]}
        statusValue={filterType}
        onStatusChange={setFilterType}
        statusLabel="Customer Type"
        showDateFilter={true}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onPrintReport={handlePrintReport}
      />

      <StandardTableContainer title="Customer Directory">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Date Added</th>
                <th className="text-left p-3 font-medium">Customer Name</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Contact</th>
                <th className="text-right p-3 font-medium">Credit Limit</th>
                <th className="text-right p-3 font-medium">Outstanding</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-border hover:bg-muted/50"
                >
                  <td className="p-3">
                    <div className="font-medium text-sm">
                      {customer.createdAt
                        ? format(new Date(customer.createdAt), "yyyy-MM-dd")
                        : "N/A"}
                    </div>
                  </td>
                  <td className="p-3 font-medium">{customer.name}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {customer.type}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">
                      <div>{customer.contactPhone || "N/A"}</div>
                      <div className="text-muted-foreground">
                        {customer.contactEmail || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(parseFloat(customer.creditLimit || "0"))}
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className={
                        parseFloat(customer.outstandingAmount || "0") > 0
                          ? "text-red-600 font-semibold"
                          : ""
                      }
                    >
                      {formatCurrency(
                        parseFloat(customer.outstandingAmount || "0"),
                      )}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {parseFloat(customer.outstandingAmount || "0") > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePaymentCustomer(customer)}
                        >
                          <CreditCard className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCustomerMutation}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </StandardTableContainer>

      {/* Customer Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedCustomer.type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.contactPhone || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.contactEmail || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.address || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">GST Number</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.gstNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Credit Limit</label>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(
                      parseFloat(selectedCustomer.creditLimit || "0"),
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Outstanding Amount
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(
                      parseFloat(selectedCustomer.outstandingAmount || "0"),
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="walk-in">Walk-in</SelectItem>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Customer address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="creditLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Credit Limit ({currencyConfig.symbol})
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="gstNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Number</FormLabel>
                      <FormControl>
                        <Input placeholder="GST number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Customer</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <Form {...paymentForm}>
            <form
              onSubmit={paymentForm.handleSubmit(onPaymentSubmit)}
              className="space-y-4"
            >
              <FormField
                control={paymentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ({currencyConfig.symbol}) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Transaction reference" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Payment notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Record Payment</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmation
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
        itemName="this customer"
      />
    </div>
  );
}
