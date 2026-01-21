import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiRequest } from "@/lib/api";
import { Plus, Edit, History, TrendingUp, TrendingDown, DollarSign, Search, Filter, Calendar, Printer, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { StandardPageHeader } from "@/components/ui/standard-page-header";
import { StandardTableContainer } from "@/components/ui/standard-table-container";
import { StandardFilterBar } from "@/components/ui/standard-filter-bar";
import { PrintReportButton } from "@/components/ui/print-report-button";

interface PriceHistory {
  id: string;
  productId: string;
  oldPrice: string;
  newPrice: string;
  changeDate: string;
  reason: string;
  userId: string;
  userName?: string;
}

// Define schema for receivables and payables for deletion
const deleteSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

const priceUpdateSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  newPrice: z.string().min(1, "New price is required"),
  reason: z.string().min(1, "Reason is required"),
});

export default function PriceManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { formatCurrency, currencyConfig } = useCurrency();
  const { toast } = useToast(); // Import toast
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<PriceHistory[]>([]);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteType, setDeleteType] = useState<'product' | 'receivable' | 'payable' | null>(null);

  const productSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    category: z.string().min(1, "Category is required"),
    currentPrice: z.string().min(1, "Price is required"),
    unit: z.string().min(1, "Unit is required"),
  });

  const priceForm = useForm({
    resolver: zodResolver(priceUpdateSchema),
    defaultValues: {
      productId: "",
      newPrice: "",
      reason: "",
    },
  });

  const productForm = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      currentPrice: "",
      unit: "litre",
    },
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: priceHistory = [], isLoading: historyLoading } = useQuery<PriceHistory[]>({
    queryKey: ["/api/price-history"],
    queryFn: () =>
      apiRequest("GET", "/api/price-history")
        .then(res => res.json())
        .catch(() => []), // Return empty array if endpoint doesn't exist
  });

  // Mutation for deleting items
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!deleteType) throw new Error("Invalid delete type");
      let endpoint = "";
      switch (deleteType) {
        case 'product':
          endpoint = `/api/products/${itemId}`;
          break;
        case 'receivable':
          endpoint = `/api/receivables/${itemId}`;
          break;
        case 'payable':
          endpoint = `/api/payables/${itemId}`;
          break;
        default:
          throw new Error("Invalid delete type");
      }
      const response = await apiRequest("DELETE", endpoint);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to delete item" }));
        throw new Error(error.message || `Failed to delete ${deleteType}`);
      }
      return response.json().catch(() => ({ message: "Success" }));
    },
    onSuccess: (_, itemId) => {
      toast({
        title: `${deleteType?.charAt(0).toUpperCase() + deleteType?.slice(1)} deleted`,
        description: `The ${deleteType} has been deleted successfully`,
      });
      
      const queryKey = deleteType === 'product' ? ["/api/products"] : [`/api/${deleteType}s`];
      queryClient.invalidateQueries({ queryKey });
      
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      setDeleteType(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to delete ${deleteType}`,
        variant: "destructive",
      });
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/products", {
        ...data,
        isActive: true,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add product");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product added",
        description: "New product has been added successfully",
      });
      setAddProductDialogOpen(false);
      productForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.refetchQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: async (data: any) => {
      const product = products.find(p => p.id === data.productId);
      if (!product) {
        throw new Error("Product not found");
      }

      const priceData = {
        currentPrice: data.newPrice,
      };

      const response = await apiRequest("PUT", `/api/products/${data.productId}`, priceData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update price");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Price updated",
        description: "Product price has been updated successfully",
      });
      setPriceDialogOpen(false);
      priceForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/price-history"] });
      queryClient.refetchQueries({ queryKey: ["/api/products"] });
      queryClient.refetchQueries({ queryKey: ["/api/price-history"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update price",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/products/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete product");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product deleted",
        description: "Product has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      setDeleteType(null);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.refetchQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const onProductSubmit = (data: any) => {
    addProductMutation.mutate(data);
  };

  const onPriceSubmit = (data: any) => {
    updatePriceMutation.mutate(data);
  };

  const handleApplyFilters = () => {
    if (!searchTerm && productFilter === "all" && !fromDate && !toDate) {
      setFilteredProducts(products);
      setFilteredHistory(priceHistory);
      return;
    }

    let filteredProductData = products.filter((product: Product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProduct = productFilter === "all" || product.category === productFilter;

      let matchesDateRange = true;
      if (fromDate || toDate) {
        const effectiveDate = product.createdAt ? new Date(product.createdAt).toISOString().split('T')[0] : '';
        if (fromDate && effectiveDate < fromDate) {
          matchesDateRange = false;
        }
        if (toDate && effectiveDate > toDate) {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesProduct && matchesDateRange;
    });
    setFilteredProducts(filteredProductData);

    let filteredHistoryData = priceHistory.filter((history: PriceHistory) => {
      const matchesSearch = !searchTerm ||
        history.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        history.userName?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesDateRange = true;
      if (fromDate || toDate) {
        const changeDate = history.changeDate ? new Date(history.changeDate).toISOString().split('T')[0] : '';
        if (fromDate && changeDate < fromDate) {
          matchesDateRange = false;
        }
        if (toDate && changeDate > toDate) {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesDateRange;
    });
    setFilteredHistory(filteredHistoryData);
  };

  const handlePrintReport = () => {
    // Implementation for printing price management report
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setProductFilter("all");
    setFromDate("");
    setToDate("");
  };

  const handleEditPrice = (product: Product) => {
    setSelectedProduct(product);
    priceForm.reset({
      productId: product.id,
      newPrice: product.currentPrice || "",
      reason: "",
    });
    setPriceDialogOpen(true);
  };

  const handleViewHistory = (product: Product) => {
    setSelectedProduct(product);
    setHistoryDialogOpen(true);
  };

  // Function to handle delete confirmation
  const handleDeleteConfirmation = (item: { id: string; name: string }, type: 'product' | 'receivable' | 'payable') => {
    setItemToDelete(item);
    setDeleteType(type);
    setIsDeleteDialogOpen(true);
  };

  useEffect(() => {
    if (products && products.length > 0) {
      setFilteredProducts(products);
    }
  }, [products]);

  useEffect(() => {
    if (priceHistory && priceHistory.length >= 0) {
      setFilteredHistory(priceHistory);
    }
  }, [priceHistory]);


  if (productsLoading) {
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

  const fuelProducts = filteredProducts.filter(p => p.category === 'fuel').length;
  const serviceProducts = filteredProducts.filter(p => p.category === 'service').length;
  const recentChanges = filteredHistory.filter(h => {
    const changeDate = new Date(h.changeDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - changeDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;

  const averagePrice = filteredProducts.length > 0
    ? filteredProducts.reduce((sum, p) => sum + parseFloat(p.price || '0'), 0) / filteredProducts.length
    : 0;

  const productCategories = [...new Set(products.map(p => p.category))].filter(Boolean);

  return (
    <div className="space-y-6 fade-in">
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <DialogHeader>
            Are you sure you want to delete {itemToDelete?.name}? This action cannot be undone.
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => itemToDelete && deleteItemMutation.mutate(itemToDelete.id)}
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StandardPageHeader
        title="Price Management"
        subtitle="Manage product pricing and track price change history"
      >
        <Button onClick={() => setAddProductDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
        
        <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <Form {...productForm}>
              <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
                <FormField
                  control={productForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., fuel, lubricant" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="currentPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ({currencyConfig.symbol}) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., litre, kg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setAddProductDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addProductMutation.isPending}>
                    {addProductMutation.isPending ? "Adding..." : "Add Product"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Update Price - {selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            <Form {...priceForm}>
              <form onSubmit={priceForm.handleSubmit(onPriceSubmit)} className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Current Price:</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(parseFloat(selectedProduct?.currentPrice || '0'))}
                    </span>
                  </div>
                </div>
                <FormField
                  control={priceForm.control}
                  name="newPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Price ({currencyConfig.symbol}) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={priceForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Price Change *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter reason for price change" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setPriceDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updatePriceMutation.isPending}>
                    {updatePriceMutation.isPending ? "Updating..." : "Update Price"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Price History - {selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Price:</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(parseFloat(selectedProduct?.price || '0'))}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {filteredHistory
                  .filter(h => h.productId === selectedProduct?.id)
                  .map((history, index) => (
                    <div key={history.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {formatCurrency(parseFloat(history.oldPrice))} → {formatCurrency(parseFloat(history.newPrice))}
                            </span>
                            {parseFloat(history.newPrice) > parseFloat(history.oldPrice) ? (
                              <TrendingUp className="w-4 h-4 text-red-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {history.reason}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Changed by: {history.userName || 'Unknown'}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(history.changeDate), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                {filteredHistory.filter(h => h.productId === selectedProduct?.id).length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No price history found for this product
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </StandardPageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{filteredProducts.length}</div>
            <div className="text-sm text-muted-foreground">Total Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{fuelProducts}</div>
            <div className="text-sm text-muted-foreground">Fuel Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{serviceProducts}</div>
            <div className="text-sm text-muted-foreground">Service Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{recentChanges}</div>
            <div className="text-sm text-muted-foreground">Recent Changes</div>
          </CardContent>
        </Card>
      </div>

      <StandardFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search products..."
        statusOptions={[
          { value: "all", label: "All Categories" },
          ...productCategories.map(cat => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))
        ]}
        statusValue={productFilter}
        onStatusChange={setProductFilter}
        statusLabel="Product Category"
        showDateFilter={true}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        onPrintReport={handlePrintReport}
      />

      {/* Products Pricing Table */}
      <StandardTableContainer title="Product Pricing">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Date Added</th>
                <th className="text-left p-3 font-medium">Product Name</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-right p-3 font-medium">Current Price</th>
                <th className="text-center p-3 font-medium">Unit</th>
                <th className="text-center p-3 font-medium">Last Updated</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => {
                const lastChange = filteredHistory
                  .filter(h => h.productId === product.id)
                  .sort((a, b) => new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime())[0];

                return (
                  <tr key={product.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3">
                      {product.createdAt ? format(new Date(product.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="p-3 font-medium">{product.name}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize">
                        {product.category || 'Uncategorized'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-semibold text-green-600">
                      {formatCurrency(parseFloat(product.currentPrice || '0'))}
                    </td>
                    <td className="p-3 text-center">{product.unit || 'L'}</td>
                    <td className="p-3 text-center">
                      {lastChange ? format(new Date(lastChange.changeDate), 'MMM dd, yyyy') : 'Never'}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={product.isActive ? 'default' : 'secondary'}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPrice(product)}
                          className="p-2"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewHistory(product)}
                          className="p-2"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteConfirmation({ id: product.id, name: product.name }, 'product')}
                          className="p-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No products found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </StandardTableContainer>

      {/* Recent Price Changes */}
      <StandardTableContainer title="Recent Price Changes">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Product</th>
                <th className="text-right p-3 font-medium">Old Price</th>
                <th className="text-right p-3 font-medium">New Price</th>
                <th className="text-center p-3 font-medium">Change</th>
                <th className="text-left p-3 font-medium">Reason</th>
                <th className="text-left p-3 font-medium">Changed By</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.slice(0, 10).map((history, index) => {
                const product = products.find(p => p.id === history.productId);
                const oldPrice = parseFloat(history.oldPrice);
                const newPrice = parseFloat(history.newPrice);
                const isIncrease = newPrice > oldPrice;
                const changePercent = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice * 100).toFixed(1) : '0';

                return (
                  <tr key={history.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3">
                      {format(new Date(history.changeDate), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="p-3 font-medium">{product?.name || 'Unknown Product'}</td>
                    <td className="p-3 text-right">{formatCurrency(oldPrice)}</td>
                    <td className="p-3 text-right">{formatCurrency(newPrice)}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {isIncrease ? (
                          <TrendingUp className="w-4 h-4 text-red-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-green-600" />
                        )}
                        <span className={`text-sm font-medium ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                          {isIncrease ? '+' : ''}{changePercent}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3">{history.reason}</td>
                    <td className="p-3">{history.userName || 'Unknown'}</td>
                  </tr>
                );
              })}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No price change history found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </StandardTableContainer>
    </div>
  );
}