import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Pump, Tank, Product, PumpReading } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Plus, Activity, AlertTriangle, Gauge, Search, Filter, Calendar, Printer } from "lucide-react";
import { format } from "date-fns";
import { StandardPageHeader } from "@/components/ui/standard-page-header";
import { StandardTableContainer } from "@/components/ui/standard-table-container";
import { StandardDateFilter } from "@/components/ui/standard-date-filter";
import { PrintReportButton } from "@/components/ui/print-report-button";
import { StandardFilterBar } from "@/components/ui/standard-filter-bar";

const pumpSchema = z.object({
  name: z.string().min(1, "Pump name is required"),
  pumpNumber: z.string().min(1, "Pump number is required"),
  productId: z.string().min(1, "Product is required"),
  tankId: z.string().min(1, "Tank is required"),
  isActive: z.boolean().default(true),
});

const readingSchema = z.object({
  pumpId: z.string().min(1, "Pump is required"),
  productId: z.string().min(1, "Product is required"),
  openingReading: z.string().min(1, "Opening reading is required"),
  closingReading: z.string().min(1, "Closing reading is required"),
  shiftNumber: z.string().min(1, "Shift is required"),
  operatorName: z.string().min(1, "Operator name is required"),
  readingDate: z.string().min(1, "Reading date is required"),
});

export default function PumpManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredPumps, setFilteredPumps] = useState<Pump[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<PumpReading[]>([]);
  const [pumpDialogOpen, setPumpDialogOpen] = useState(false);
  const [readingDialogOpen, setReadingDialogOpen] = useState(false);
  // Removed productFilter as it was not used in the original code and not mentioned in the prompt.
  // const [productFilter, setProductFilter] = useState("all"); 

  const pumpForm = useForm({
    resolver: zodResolver(pumpSchema),
    defaultValues: {
      name: "",
      pumpNumber: "",
      productId: "",
      tankId: "",
      isActive: true,
    },
  });

  const readingForm = useForm({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      pumpId: "",
      productId: "",
      openingReading: "",
      closingReading: "",
      shiftNumber: "",
      operatorName: "",
      readingDate: new Date().toISOString().split('T')[0],
    },
  });

  const { data: pumps = [], isLoading: pumpsLoading } = useQuery<Pump[]>({
    queryKey: ["/api/pumps", user?.stationId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/pumps?stationId=${user?.stationId}`);
      if (!response.ok) throw new Error('Failed to fetch pumps');
      return response.json();
    },
    enabled: !!user?.stationId,
  });

  const { data: tanks = [] } = useQuery<Tank[]>({
    queryKey: ["/api/tanks", user?.stationId],
    enabled: !!user?.stationId,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: readings = [], isLoading: readingsLoading } = useQuery<PumpReading[]>({
    queryKey: ["/api/pump-readings", user?.stationId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/pump-readings?stationId=${user?.stationId}`);
      if (!response.ok) throw new Error('Failed to fetch pump readings');
      return response.json();
    },
    enabled: !!user?.stationId,
  });

  const { toast } = useToast();

  const createPumpMutation = useMutation({
    mutationFn: async (data: any) => {
      const pumpData = {
        ...data,
        stationId: user?.stationId,
      };
      const response = await apiRequest("POST", "/api/pumps", pumpData);
      return response.json();
    },
    onSuccess: async () => {
      toast({
        title: "Pump created",
        description: "New pump has been added successfully",
      });
      setPumpDialogOpen(false);
      pumpForm.reset();
      await queryClient.invalidateQueries({ queryKey: ["/api/pumps", user?.stationId] });
      await queryClient.refetchQueries({ queryKey: ["/api/pumps", user?.stationId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create pump",
        variant: "destructive",
      });
    },
  });

  const createReadingMutation = useMutation({
    mutationFn: async (data: any) => {
      // Auto-calculate total sale
      const totalSale = (parseFloat(data.closingReading) - parseFloat(data.openingReading)).toFixed(3);
      
      const readingData = {
        ...data,
        totalSale: totalSale,
        stationId: user?.stationId,
        userId: user?.id,
      };
      const response = await apiRequest("POST", "/api/pump-readings", readingData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reading recorded",
        description: "Pump reading has been recorded successfully",
      });
      setReadingDialogOpen(false);
      readingForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/pump-readings"] });
      queryClient.refetchQueries({ queryKey: ["/api/pump-readings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record reading",
        variant: "destructive",
      });
    },
  });

  const onPumpSubmit = (data: any) => {
    createPumpMutation.mutate(data);
  };

  const onReadingSubmit = (data: any) => {
    createReadingMutation.mutate(data);
  };

  const handleApplyFilters = () => {
    // Filtering is already handled by useEffect hooks
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    // Removed productFilter reset as it was not used.
    // setProductFilter("all");
  };

  const handlePrintReport = () => {
    // Implementation for printing pump management report
  };

  useEffect(() => {
    if (!pumps || pumps.length === 0) {
      setFilteredPumps([]);
      return;
    }

    const filtered = pumps.filter((pump: Pump) => {
      const matchesSearch = pump.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pump.pumpNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && pump.isActive) || 
        (statusFilter === "inactive" && !pump.isActive);
      return matchesSearch && matchesStatus;
    });

    setFilteredPumps(filtered);
  }, [pumps, searchTerm, statusFilter]);

  useEffect(() => {
    if (!readings || readings.length === 0 || !pumps || pumps.length === 0) {
      setFilteredReadings([]);
      return;
    }

    const filtered = readings.filter((reading: PumpReading) => {
      const matchesSearch = !searchTerm ||
        reading.operatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reading.shiftNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "active" && pumps.find(p => p.id === reading.pumpId)?.isActive) ||
        (statusFilter === "inactive" && !pumps.find(p => p.id === reading.pumpId)?.isActive);

      let matchesDateRange = true;
      if (fromDate || toDate) {
        const readingDate = reading.readingDate ? new Date(reading.readingDate).toISOString().split('T')[0] : '';
        if (fromDate && readingDate < fromDate) {
          matchesDateRange = false;
        }
        if (toDate && readingDate > toDate) {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesStatus && matchesDateRange;
    });

    setFilteredReadings(filtered);
  }, [searchTerm, statusFilter, fromDate, toDate, readings, pumps]);


  if (pumpsLoading || readingsLoading) {
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

  const activePumps = filteredPumps.filter(p => p.isActive).length;
  const totalReadings = filteredReadings.length;
  const todaysReadings = filteredReadings.filter(r => {
    const readingDate = r.readingDate ? new Date(r.readingDate).toDateString() : '';
    const today = new Date().toDateString();
    return readingDate === today;
  }).length;

  return (
    <div className="space-y-6 fade-in">
      <StandardPageHeader
        title="Pump Management"
        subtitle="Monitor and manage fuel pumps and readings"
      >
        <Dialog open={pumpDialogOpen} onOpenChange={setPumpDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Pump
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Pump</DialogTitle>
            </DialogHeader>
            <Form {...pumpForm}>
              <form onSubmit={pumpForm.handleSubmit(onPumpSubmit)} className="space-y-4">
                <FormField
                  control={pumpForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pump Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter pump name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={pumpForm.control}
                  name="pumpNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pump Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter pump number (e.g., P001)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={pumpForm.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormField
                  control={pumpForm.control}
                  name="tankId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tank *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tank" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tanks.map((tank) => (
                            <SelectItem key={tank.id} value={tank.id}>
                              {tank.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setPumpDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPumpMutation.isPending}>
                    {createPumpMutation.isPending ? "Creating..." : "Create Pump"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={readingDialogOpen} onOpenChange={setReadingDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Gauge className="w-4 h-4 mr-2" />
              Record Reading
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Pump Reading</DialogTitle>
            </DialogHeader>
            <Form {...readingForm}>
              <form onSubmit={readingForm.handleSubmit(onReadingSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={readingForm.control}
                    name="pumpId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pump *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pump" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredPumps.filter(p => p.isActive).map((pump) => (
                              <SelectItem key={pump.id} value={pump.id}>
                                {pump.name} ({pump.pumpNumber})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={readingForm.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={readingForm.control}
                    name="openingReading"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opening Reading *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" placeholder="0.000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={readingForm.control}
                    name="closingReading"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Closing Reading *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" placeholder="0.000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={readingForm.control}
                    name="shiftNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shift *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select shift" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="day">Day Shift</SelectItem>
                            <SelectItem value="night">Night Shift</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={readingForm.control}
                    name="operatorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operator Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter operator name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={readingForm.control}
                  name="readingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reading Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setReadingDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createReadingMutation.isPending}>
                    {createReadingMutation.isPending ? "Recording..." : "Record Reading"}
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
            <div className="text-2xl font-bold text-primary">{filteredPumps.length}</div>
            <div className="text-sm text-muted-foreground">Total Pumps</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{activePumps}</div>
            <div className="text-sm text-muted-foreground">Active Pumps</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{todaysReadings}</div>
            <div className="text-sm text-muted-foreground">Today's Readings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{totalReadings}</div>
            <div className="text-sm text-muted-foreground">Total Readings</div>
          </CardContent>
        </Card>
      </div>

      <StandardFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search pumps, operators..."
        statusOptions={[
          { value: "all", label: "All Status" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" }
        ]}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusLabel="Pump Status"
        showDateFilter={true}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        onPrintReport={handlePrintReport}
      />

      {/* Pumps Table */}
      <StandardTableContainer title="Pump Status">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Date Added</th>
                <th className="text-left p-3 font-medium">Pump Number</th>
                <th className="text-left p-3 font-medium">Tank</th>
                <th className="text-left p-3 font-medium">Product</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-center p-3 font-medium">Last Reading</th>
              </tr>
            </thead>
            <tbody>
              {filteredPumps.map((pump, index) => {
                const tank = tanks.find((t: any) => t.id === pump.tankId);
                const product = products.find((p: any) => p.id === pump.productId);
                const pumpReadings = readings.filter((r: any) => r.pumpId === pump.id);
                const lastReading = pumpReadings.length > 0 ? pumpReadings[pumpReadings.length - 1] : null;

                return (
                  <tr key={pump.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3">
                      {pump.createdAt ? format(new Date(pump.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="p-3 font-medium">Pump {pump.pumpNumber}</td>
                    <td className="p-3">{tank?.name || 'Unknown'}</td>
                    <td className="p-3">{product?.name || 'Unknown'}</td>
                    <td className="p-3 text-center">
                      <Badge variant={pump.isActive ? 'default' : 'secondary'}>
                        {pump.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <div className="font-medium">{lastReading ? `${parseFloat(lastReading.closingReading || '0').toFixed(2)} L` : 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{lastReading && lastReading.readingDate ? format(new Date(lastReading.readingDate), 'MMM dd, yyyy') : ''}</div>
                    </td>
                  </tr>
                );
              })}
              {filteredPumps.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No pumps found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </StandardTableContainer>

      {/* Readings Table */}
      <StandardTableContainer title="Recent Pump Readings">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Pump</th>
                <th className="text-left p-3 font-medium">Product</th>
                <th className="text-right p-3 font-medium">Opening</th>
                <th className="text-right p-3 font-medium">Closing</th>
                <th className="text-right p-3 font-medium">Total Sale</th>
                <th className="text-center p-3 font-medium">Shift</th>
                <th className="text-left p-3 font-medium">Operator</th>
              </tr>
            </thead>
            <tbody>
              {filteredReadings.slice(0, 10).map((reading, index) => {
                const pump = filteredPumps.find(p => p.id === reading.pumpId);
                const product = products.find(p => p.id === reading.productId);

                return (
                  <tr key={reading.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3">
                      {reading.readingDate ? format(new Date(reading.readingDate), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="p-3">Pump {pump?.pumpNumber || 'Unknown'}</td>
                    <td className="p-3">{product?.name || 'Unknown'}</td>
                    <td className="p-3 text-right">{parseFloat(reading.openingReading || '0').toFixed(3)}</td>
                    <td className="p-3 text-right">{parseFloat(reading.closingReading || '0').toFixed(3)}</td>
                    <td className="p-3 text-right font-semibold">{parseFloat(reading.totalSale || '0').toFixed(3)}</td>
                    <td className="p-3 text-center">{reading.shiftNumber}</td>
                    <td className="p-3">{reading.operatorName}</td>
                  </tr>
                );
              })}
              {filteredReadings.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No pump readings found for the selected criteria.
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