import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { Tank, SalesTransaction, Customer, Product } from "@shared/schema";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLocation } from "wouter";
import { Download, FileText, ShoppingCart, Users, BarChart3, AlertCircle, DollarSign, TrendingUp, Fuel, Clock, AlertTriangle, Check, CreditCard, ShoppingBag, Droplets, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCompactNumber } from "@/lib/utils";
import { apiRequest } from "@/lib/api";

export default function Dashboard() {
  const { user } = useAuth();
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const [, setLocation] = useLocation();

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard", user?.stationId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/dashboard?stationId=${user?.stationId}`);
      if (!response.ok) throw new Error("Failed to fetch dashboard stats");
      return response.json();
    },
    enabled: !!user?.stationId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: tanks = [], isLoading: tanksLoading } = useQuery<Tank[]>({
    queryKey: ["/api/tanks", user?.stationId],
    enabled: !!user?.stationId,
    refetchInterval: 10000,
  });

  const { data: recentSales = [], isLoading: salesLoading } = useQuery<SalesTransaction[]>({
    queryKey: ["/api/sales", user?.stationId, "recent"],
    enabled: !!user?.stationId,
    refetchInterval: 10000,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: pumps = [] } = useQuery<any[]>({
    queryKey: ["/api/pumps", user?.stationId],
    enabled: !!user?.stationId,
    refetchInterval: 10000,
  });

  // Calculate chart data from dashboard stats (last 7 days)
  const generateChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    const chartData = [];

    if (!dashboardStats || typeof dashboardStats !== 'object' || !('weeklySales' in dashboardStats)) {
      // Return 0 values if no data
      for (let i = 6; i >= 0; i--) {
        const dayIndex = (today - i + 7) % 7;
        chartData.push({
          day: days[dayIndex],
          sales: 0
        });
      }
      return chartData;
    }

    for (let i = 6; i >= 0; i--) {
      const dayIndex = (today - i + 7) % 7;
      const dayData = (dashboardStats as any).weeklySales?.find((d: any) => d.dayOfWeek === dayIndex);
      chartData.push({
        day: days[dayIndex],
        sales: dayData ? parseFloat(dayData.totalAmount || '0') : 0
      });
    }
    return chartData;
  };

  // Get Today's Product Sales - ensure we always have data to show if API returns empty
  const productSales = (dashboardStats as any)?.productSales?.length > 0 
    ? (dashboardStats as any).productSales 
    : products.map(p => ({
        productId: p.id,
        productName: p.name,
        totalAmount: "0",
        totalQuantity: "0"
      })).slice(0, 4);

  // Calculate stock value from tanks
  const calculateStockValue = () => {
    if (!tanks.length || !products.length) return 0;

    return tanks.reduce((total, tank) => {
      const product = products.find(p => p.id === tank.productId);
      if (product) {
        const stockValue = parseFloat(tank.currentStock || '0') * parseFloat(product.currentPrice || '0');
        return total + stockValue;
      }
      return total;
    }, 0);
  };

  // Get overdue customers count
  const getOverdueCustomersCount = () => {
    return customers.filter((customer: Customer) => 
      parseFloat(customer.outstandingAmount || '0') > 0
    ).length;
  };

  // Quick action handlers
  const handleNewSale = () => {
    setLocation('/pos');
  };

  const handleViewReports = () => {
    setLocation('/financial-reports');
  };

  const handleStockStatus = () => {
    setLocation('/stock');
  };

  const handleCustomerPayments = () => {
    setLocation('/accounts-receivable');
  };

  const handleTankMonitoring = () => {
    setLocation('/tanks');
  };

  const handleDailyReports = () => {
    setLocation('/daily-reports');
  };


  const isLoading = statsLoading || tanksLoading || salesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* Operational Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Customers</p>
              <p className="text-lg font-bold">{(dashboardStats as any)?.counts?.customers || 0}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/10">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Active Suppliers</p>
              <p className="text-lg font-bold">{(dashboardStats as any)?.counts?.suppliers || 0}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/10">
          <div className="flex items-center gap-3">
            <Droplets className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Tanks</p>
              <p className="text-lg font-bold">{tanks?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-orange-500/5 rounded-lg border border-orange-500/10">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Active Pumps</p>
              <p className="text-lg font-bold">{pumps?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm font-medium">Today's Sales</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold truncate text-green-600" data-testid="todays-sales">
                  {formatCurrencyCompact(parseFloat((dashboardStats as any)?.todaysSales?.totalAmount || '0'))}
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm">{(dashboardStats as any)?.todaysSales?.count || 0} transactions</p>
              </div>
              <div className="text-green-600 flex-shrink-0"><DollarSign className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm font-medium">Receivables</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold truncate text-blue-600" data-testid="outstanding-amount">
                  {formatCurrencyCompact((dashboardStats as any)?.outstanding?.totalOutstanding ? parseFloat((dashboardStats as any).outstanding.totalOutstanding) : 0)}
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm">Credit customers</p>
              </div>
              <div className="text-blue-600 flex-shrink-0"><Users className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm font-medium">Payables</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold truncate text-red-600" data-testid="payables-amount">
                  {formatCurrencyCompact(parseFloat((dashboardStats as any)?.payables?.totalPayable || '0'))}
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm">Pending supplier POs</p>
              </div>
              <div className="text-red-600 flex-shrink-0"><CreditCard className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm font-medium">Stock Value</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold truncate text-purple-600" data-testid="stock-value">
                  {formatCurrencyCompact(calculateStockValue())}
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm">All tanks combined</p>
              </div>
              <div className="text-purple-600 flex-shrink-0"><Fuel className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-20"
              onClick={handleNewSale}
              data-testid="button-new-sale"
            >
              <ShoppingCart className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium">New Sale</span>
            </Button>

            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-20"
              onClick={handleViewReports}
              data-testid="button-view-reports"
            >
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium">View Reports</span>
            </Button>

            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-20"
              onClick={handleStockStatus}
              data-testid="button-stock-status"
            >
              <FileText className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-medium">Stock Status</span>
            </Button>

            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-20"
              onClick={handleCustomerPayments}
              data-testid="button-customer-payments"
            >
              <Users className="w-6 h-6 text-orange-600" />
              <span className="text-sm font-medium">Customer Payments</span>
            </Button>

            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-20"
              onClick={handleTankMonitoring}
              data-testid="button-tank-monitoring"
            >
              <AlertCircle className="w-6 h-6 text-red-600" />
              <span className="text-sm font-medium">Tank Monitoring</span>
            </Button>

            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-20"
              onClick={handleDailyReports}
              data-testid="button-daily-reports"
            >
              <Download className="w-6 h-6 text-indigo-600" />
              <span className="text-sm font-medium">Daily Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Analytics - Masonry-like Layout */}
      <div className="columns-1 lg:columns-2 gap-6 space-y-6">
        <div className="break-inside-avoid">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateChartData()} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                    <XAxis 
                      dataKey="day" 
                      stroke="#666666" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#666666" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => formatCurrencyCompact(value)}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#ffffff", 
                        borderColor: "#e2e8f0",
                        color: "#1a1a1a",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                      }}
                      itemStyle={{ color: "#1a1a1a" }}
                      formatter={(value: number) => [formatCurrency(value), "Sales"]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#2563eb" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: "#2563eb", strokeWidth: 2, stroke: "#ffffff" }} 
                      activeDot={{ r: 8, strokeWidth: 0 }}
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="break-inside-avoid">
          <Card>
            <CardHeader>
              <CardTitle>Today's Product Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productSales?.length > 0 ? productSales.map((product: any, index: number) => {
                  const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500'];
                  return (
                    <div key={product.productId} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 ${colors[index % colors.length]} rounded mr-3`}></div>
                        <span className="font-medium">{product.productName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold" data-testid={`${product.productName.toLowerCase()}-sales`}>
                          {formatCurrency(parseFloat(product.totalAmount || '0'))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {parseFloat(product.totalQuantity || '0').toLocaleString()} L
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center text-muted-foreground py-4">
                    No product sales data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="break-inside-avoid">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <button 
                  className="text-primary hover:text-primary/80 text-sm font-medium transition-colors" 
                  onClick={() => setLocation('/sales-history')}
                  data-testid="button-view-all"
                >
                  View All
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSales.length > 0 ? recentSales.slice(0, 3).map((transaction: SalesTransaction, index: number) => {
                  const timeAgo = transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleString() : 'N/A';
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                      <div>
                        <div className="font-medium text-card-foreground" data-testid={`transaction-id-${index}`}>
                          {transaction.invoiceNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.paymentMethod === 'cash' ? 'Cash Sale' : transaction.paymentMethod === 'credit' ? 'Credit Sale' : 'Card Sale'}
                        </div>
                        <div className="text-xs text-muted-foreground">{timeAgo}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transaction.paymentMethod === 'cash' ? 'text-green-600' : 
                          transaction.paymentMethod === 'credit' ? 'text-blue-600' : 'text-purple-600'
                        }`}>
                          {formatCurrency(parseFloat(transaction.totalAmount || '0'))}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center text-muted-foreground py-4">
                    No recent transactions
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="break-inside-avoid">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Purchase Orders</CardTitle>
                <button 
                  className="text-primary hover:text-primary/80 text-sm font-medium transition-colors" 
                  onClick={() => setLocation('/payables')}
                  data-testid="button-view-all-po"
                >
                  View All
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(dashboardStats as any)?.recentPOs?.length > 0 ? (dashboardStats as any).recentPOs.slice(0, 3).map((po: any) => {
                  return (
                    <div key={po.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                      <div>
                        <div className="font-medium text-card-foreground">
                          {po.orderNumber}
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          Status: {po.status}
                        </div>
                        <div className="text-xs text-muted-foreground">{new Date(po.orderDate).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-orange-600">
                          {formatCurrency(parseFloat(po.totalAmount || '0'))}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center text-muted-foreground py-4">
                    No recent purchase orders
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="break-inside-avoid">
          <Card>
            <CardHeader>
              <CardTitle>Tank Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tanks.map((tank) => {
                  const product = products.find(p => p.id === tank.productId);
                  const stock = parseFloat(tank.currentStock || '0');
                  const capacity = parseFloat(tank.capacity || '1');
                  const percentage = Math.round((stock / capacity) * 100);
                  
                  return (
                    <div key={tank.id} className="space-y-1">
                      <div className="flex justify-between text-sm font-medium">
                        <span>{tank.name} ({product?.name})</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${percentage < 20 ? 'bg-red-500' : percentage < 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{stock.toLocaleString()} L</span>
                        <span>{capacity.toLocaleString()} L Capacity</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="break-inside-avoid">
          <Card>
            <CardHeader>
              <CardTitle>Pump Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {pumps.map((pump) => {
                  const tank = tanks.find(t => t.id === pump.tankId);
                  const product = tank ? products.find(p => p.id === tank.productId) : null;
                  return (
                    <div key={pump.id} className="p-3 border rounded-md flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{pump.name}</p>
                          <p className="text-xs text-muted-foreground">{product?.name || 'No Product'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          pump.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {pump.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="break-inside-avoid">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Low Stock Alerts */}
                {tanks.filter(tank => {
                  const currentStock = parseFloat(tank.currentStock || '0');
                  const minimumLevel = parseFloat(tank.minimumLevel || '500');
                  return currentStock <= minimumLevel;
                }).slice(0, 2).map(tank => {
                  const product = products.find(p => p.id === tank.productId);
                  return (
                    <div key={tank.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-yellow-800">Low Stock Alert</div>
                          <div className="text-xs text-yellow-600">
                            {tank.name} ({product?.name}) - Only {parseFloat(tank.currentStock || '0').toLocaleString()}L remaining
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Overdue Customers */}
                {customers.filter(customer => parseFloat(customer.outstandingAmount || '0') > 50000).slice(0, 1).map(customer => (
                  <div key={customer.id} className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start">
                      <DollarSign className="w-5 h-5 text-red-500 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-red-800">Payment Overdue</div>
                        <div className="text-xs text-red-600">
                          {customer.name} - {formatCurrencyCompact(parseFloat(customer.outstandingAmount || '0'))} outstanding
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show message if no alerts */}
                {tanks.filter(tank => parseFloat(tank.currentStock || '0') <= parseFloat(tank.minimumLevel || '500')).length === 0 && 
                 customers.filter(customer => parseFloat(customer.outstandingAmount || '0') > 50000).length === 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-green-800">All Systems Normal</div>
                        <div className="text-xs text-green-600">No critical alerts at this time</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}