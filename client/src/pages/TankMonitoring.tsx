import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tank, Product, TankReading } from "@shared/schema";
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
import { Progress } from "@/components/ui/progress";
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
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import {
  Plus,
  Gauge,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Filter,
  Printer,
  Edit,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { StandardPageHeader } from "@/components/ui/standard-page-header";
import { StandardTableContainer } from "@/components/ui/standard-table-container";
import { PrintReportButton } from "@/components/ui/print-report-button";
import { StandardFilterBar } from "@/components/ui/standard-filter-bar";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const tankSchema = z.object({
  name: z.string().min(1, "Tank name is required"),
  productId: z.string().min(1, "Product is required"),
  capacity: z.string().min(1, "Capacity is required"),
  currentStock: z.string().min(1, "Current stock is required"),
  minimumLevel: z.string().min(1, "Minimum level is required"),
  location: z.string().optional(),
});

export default function TankMonitoring() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredTanks, setFilteredTanks] = useState<Tank[]>([]);
  const [tankDialogOpen, setTankDialogOpen] = useState(false);
  const [editingTank, setEditingTank] = useState<Tank | null>(null);
  const [tankToDelete, setTankToDelete] = useState<string | null>(null);

  // State for Tank Readings page filters
  const [readingSearchTerm, setReadingSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredReadings, setFilteredReadings] = useState<TankReading[]>([]);

  const tankForm = useForm({
    resolver: zodResolver(tankSchema),
    defaultValues: {
      name: "",
      productId: "",
      capacity: "",
      currentStock: "",
      minimumLevel: "",
      location: "",
    },
  });

  useEffect(() => {
    if (editingTank) {
      tankForm.reset({
        name: editingTank.name,
        productId: editingTank.productId,
        capacity: editingTank.capacity?.toString() || "",
        currentStock: editingTank.currentStock?.toString() || "",
        minimumLevel: editingTank.minimumLevel?.toString() || "",
        location: editingTank.location || "",
      });
    } else {
      tankForm.reset({
        name: "",
        productId: "",
        capacity: "",
        currentStock: "",
        minimumLevel: "",
        location: "",
      });
    }
  }, [editingTank]);

  const { data: tanks = [], isLoading: tanksLoading } = useQuery<Tank[]>({
    queryKey: ["/api/tanks", user?.stationId],
    enabled: !!user?.stationId,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: tankReadings = [], isLoading: tankReadingsLoading } = useQuery<
    TankReading[]
  >({
    queryKey: ["/api/tank-readings", user?.stationId],
    enabled: !!user?.stationId,
  });

  const tankMutation = useMutation({
    mutationFn: async (data: any) => {
      const tankData = {
        ...data,
        stationId: user?.stationId,
      };
      const method = editingTank ? "PUT" : "POST";
      const url = editingTank ? `/api/tanks/${editingTank.id}` : "/api/tanks";
      const response = await apiRequest(method, url, tankData);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          error || `Failed to ${editingTank ? "update" : "create"} tank`,
        );
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: `Tank ${editingTank ? "updated" : "created"}`,
        description: `Tank has been ${editingTank ? "updated" : "added"} successfully`,
      });
      setTankDialogOpen(false);
      setEditingTank(null);
      tankForm.reset();
      queryClient.invalidateQueries({
        queryKey: ["/api/tanks", user?.stationId],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTankMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/tanks/${id}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete tank");
      }

      // DELETE usually returns 204 / no body
      return id; // 👈 return deleted id
    },

    onSuccess: (deletedId) => {
      toast({
        title: "Tank deleted",
        description: "Tank has been removed successfully",
      });

      setTankToDelete(null);

      // ✅ SINGLE SOURCE OF TRUTH — update cache only
      queryClient.setQueryData<Tank[]>(
        ["/api/tanks", user?.stationId],
        (old) => {
          if (!old) return [];
          return old.filter((tank) => tank.id !== deletedId);
        }
      );
    },

    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  const onTankSubmit = (data: any) => {
    tankMutation.mutate(data);
  };

  const handleApplyFilters = () => {
    // Filtering is already handled by useEffect
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setProductFilter("all");
    setFromDate("");
    setToDate("");
  };

  const handlePrintReport = () => {
    // Implementation for printing tank monitoring report
  };

  useEffect(() => {
    setFilteredTanks(tanks);
  }, [tanks]);

  useEffect(() => {
    handleApplyFilters();
  }, [searchTerm, statusFilter, tanks]);

  // Effect for filtering tank readings
  useEffect(() => {
    if (!tankReadings) {
      setFilteredReadings([]);
      return;
    }

    let filtered = tankReadings.filter((reading: TankReading) => {
      const matchesSearch =
        reading.tank?.tankName
          ?.toLowerCase()
          .includes(readingSearchTerm.toLowerCase()) ||
        reading.product?.name
          ?.toLowerCase()
          .includes(readingSearchTerm.toLowerCase());
      const matchesProduct =
        productFilter === "all" || reading.tank?.productId === productFilter;

      let matchesDateRange = true;
      if (fromDate || toDate) {
        const readingDate = reading.readingDate
          ? new Date(reading.readingDate).toISOString().split("T")[0]
          : "";
        if (fromDate && readingDate < fromDate) {
          matchesDateRange = false;
        }
        if (toDate && readingDate > toDate) {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesProduct && matchesDateRange;
    });
    setFilteredReadings(filtered);
  }, [readingSearchTerm, productFilter, fromDate, toDate, tankReadings]);

  if (tanksLoading) {
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

  const getTankStatus = (
    currentStock: number,
    capacity: number,
    minimumLevel: number,
  ) => {
    const percentage = (currentStock / capacity) * 100;
    if (currentStock <= minimumLevel)
      return {
        status: "critical",
        color: "bg-red-600",
        textColor: "text-red-600",
      };
    if (percentage < 30)
      return {
        status: "low",
        color: "bg-orange-600",
        textColor: "text-orange-600",
      };
    return {
      status: "normal",
      color: "bg-green-600",
      textColor: "text-green-600",
    };
  };

  const criticalTanks = filteredTanks.filter((t) => {
    const currentStock = parseFloat(t.currentStock || "0");
    const minimumLevel = parseFloat(t.minimumLevel || "0");
    return currentStock <= minimumLevel;
  }).length;

  const lowTanks = filteredTanks.filter((t) => {
    const currentStock = parseFloat(t.currentStock || "0");
    const capacity = parseFloat(t.capacity || "1");
    const minimumLevel = parseFloat(t.minimumLevel || "0");
    const percentage = (currentStock / capacity) * 100;
    return percentage < 30 && currentStock > minimumLevel;
  }).length;

  const totalCapacity = filteredTanks.reduce(
    (sum, t) => sum + parseFloat(t.capacity || "0"),
    0,
  );
  const totalStock = filteredTanks.reduce(
    (sum, t) => sum + parseFloat(t.currentStock || "0"),
    0,
  );

  return (
    <div className="space-y-6 fade-in">
      <StandardPageHeader
        title="Tank Monitoring"
        subtitle="Real-time fuel tank monitoring and capacity management"
      >
        <Dialog open={tankDialogOpen} onOpenChange={setTankDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Tank
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTank ? "Edit Tank" : "Add New Tank"}
              </DialogTitle>
            </DialogHeader>
            <Form {...tankForm}>
              <form
                onSubmit={tankForm.handleSubmit(onTankSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={tankForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tank Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tank name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={tankForm.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={tankForm.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity (L) *</FormLabel>
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
                    control={tankForm.control}
                    name="currentStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Stock (L) *</FormLabel>
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
                </div>
                <FormField
                  control={tankForm.control}
                  name="minimumLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Level (L) *</FormLabel>
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
                  control={tankForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Tank location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setTankDialogOpen(false);
                      setEditingTank(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={tankMutation.isPending}>
                    {tankMutation.isPending
                      ? editingTank
                        ? "Updating..."
                        : "Creating..."
                      : editingTank
                        ? "Update Tank"
                        : "Create Tank"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </StandardPageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {filteredTanks.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Tanks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {criticalTanks}
            </div>
            <div className="text-sm text-muted-foreground">Critical Level</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{lowTanks}</div>
            <div className="text-sm text-muted-foreground">Low Stock</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((totalStock / totalCapacity) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Overall Fill Level
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tank Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTanks.map((tank: Tank, index: number) => {
          const currentStock = parseFloat(tank.currentStock || "0");
          const capacity = parseFloat(tank.capacity || "1");
          const minimumLevel = parseFloat(tank.minimumLevel || "0");
          const percentage = Math.round((currentStock / capacity) * 100);
          const available = capacity - currentStock;
          const { status, color, textColor } = getTankStatus(
            currentStock,
            capacity,
            minimumLevel,
          );
          const product = products.find((p) => p.id === tank.productId);

          return (
            <Card key={tank.id} className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-card-foreground">
                    {tank.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => {
                        setEditingTank(tank);
                        setTankDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setTankToDelete(tank.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Badge
                      variant={status === "normal" ? "default" : "destructive"}
                      className={
                        status === "normal"
                          ? "bg-green-100 text-green-800"
                          : status === "low"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }
                    >
                      {status === "critical"
                        ? "Critical"
                        : status === "low"
                          ? "Low"
                          : "Normal"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product:</span>
                    <span className="font-medium">
                      {product?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Current Stock:
                    </span>
                    <span className={`font-semibold ${textColor}`}>
                      {currentStock.toLocaleString()} L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span>{capacity.toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available:</span>
                    <span className="text-green-600 font-medium">
                      {available.toLocaleString()} L
                    </span>
                  </div>
                  {tank.location && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-sm">{tank.location}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Progress value={percentage} className="h-3" />
                    <div className="text-center text-sm text-muted-foreground">
                      {percentage}% filled
                    </div>
                  </div>

                  {status === "critical" && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-red-800">
                            Critical Level
                          </div>
                          <div className="text-xs text-red-600 mt-1">
                            Tank is at or below minimum level ({minimumLevel}L)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog
        open={!!tankToDelete}
        onOpenChange={(open) => !open && setTankToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              tank and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                tankToDelete && deleteTankMutation.mutate(tankToDelete)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tank Details Table */}
      <StandardTableContainer title="Tank Readings">
        <StandardFilterBar
          searchValue={readingSearchTerm}
          onSearchChange={setReadingSearchTerm}
          searchPlaceholder="Search tanks, products..."
          showStatusFilter={false}
          showDateFilter={true}
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          productOptions={products.map((p) => ({ value: p.id, label: p.name }))}
          productFilter={productFilter}
          onProductFilterChange={setProductFilter}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Reading Date</th>
                <th className="text-left p-3 font-medium">Tank Name</th>
                <th className="text-left p-3 font-medium">Product</th>
                <th className="text-right p-3 font-medium">Current Stock</th>
                <th className="text-right p-3 font-medium">Capacity</th>
                <th className="text-center p-3 font-medium">Fill Level</th>
                <th className="text-center p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {tankReadingsLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground"
                  >
                    Loading readings...
                  </td>
                </tr>
              )}
              {!tankReadingsLoading && filteredReadings.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No tank readings found for the selected criteria.
                  </td>
                </tr>
              )}
              {!tankReadingsLoading &&
                filteredReadings.map((reading: TankReading, index: number) => {
                  const currentStock = parseFloat(reading.currentStock || "0");
                  const capacity = parseFloat(reading.capacity || "1");
                  const minimumLevel = parseFloat(reading.minimumLevel || "0");
                  const percentage = Math.round(
                    (currentStock / capacity) * 100,
                  );
                  const { status, textColor } = getTankStatus(
                    currentStock,
                    capacity,
                    minimumLevel,
                  );
                  const product = products.find(
                    (p) => p.id === reading.productId,
                  );

                  return (
                    <tr
                      key={reading.id}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="p-3">
                        {reading.readingDate
                          ? format(
                              new Date(reading.readingDate),
                              "MMM dd, yyyy HH:mm",
                            )
                          : "N/A"}
                      </td>
                      <td className="p-3 font-medium">
                        {reading.tank?.tankName || "Unknown Tank"}
                      </td>
                      <td className="p-3">
                        {product?.name || "Unknown Product"}
                      </td>
                      <td className="p-3 text-right">
                        <span className={`font-semibold ${textColor}`}>
                          {currentStock.toLocaleString()} L
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {capacity.toLocaleString()} L
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                status === "critical"
                                  ? "bg-red-600"
                                  : status === "low"
                                    ? "bg-orange-600"
                                    : "bg-green-600"
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={
                            status === "normal" ? "default" : "destructive"
                          }
                        >
                          {status === "critical"
                            ? "Critical"
                            : status === "low"
                              ? "Low"
                              : "Normal"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </StandardTableContainer>
    </div>
  );
}
