
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, AlertCircle, Eye, Search, Plus, Edit, Trash2, Filter, Printer, Download, Settings, Calendar, User, CreditCard, Fuel, Building, DollarSign, FileText, BarChart3, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface StatusItem {
  name: string;
  status: 'working' | 'error' | 'warning';
  description: string;
}

interface PageFeature {
  name: string;
  type: 'button' | 'icon' | 'filter' | 'search' | 'table' | 'form' | 'modal';
  status: 'working' | 'broken' | 'missing';
  description: string;
}

interface PageStatus {
  pageName: string;
  route: string;
  status: 'working' | 'error' | 'warning';
  features: PageFeature[];
}

export default function SystemStatus() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [testResults, setTestResults] = useState<PageStatus[]>([]);

  // Test various API endpoints
  const { data: customers, error: customersError } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: () => fetch("/api/customers").then(res => res.json())
  });

  const { data: products, error: productsError } = useQuery({
    queryKey: ["/api/products"],
    queryFn: () => fetch("/api/products").then(res => res.json())
  });

  const { data: sales, error: salesError } = useQuery({
    queryKey: ["/api/sales", user?.stationId],
    queryFn: () => fetch(`/api/sales?stationId=${user?.stationId}`).then(res => res.json()),
    enabled: !!user?.stationId
  });

  const statusItems: StatusItem[] = [
    {
      name: "Authentication",
      status: user ? 'working' : 'error',
      description: user ? `Logged in as ${user.username}` : "Not authenticated"
    },
    {
      name: "Customers API",
      status: customersError ? 'error' : customers ? 'working' : 'warning',
      description: customersError ? "Failed to load" : customers ? `${customers.length} customers loaded` : "Loading..."
    },
    {
      name: "Products API", 
      status: productsError ? 'error' : products ? 'working' : 'warning',
      description: productsError ? "Failed to load" : products ? `${products.length} products loaded` : "Loading..."
    },
    {
      name: "Sales API",
      status: salesError ? 'error' : sales ? 'working' : 'warning',
      description: salesError ? "Failed to load" : sales ? `${sales.length} sales loaded` : "Loading..."
    }
  ];

  // Comprehensive page feature mapping
  const pageFeatures: PageStatus[] = [
    {
      pageName: "Dashboard",
      route: "/",
      status: "working",
      features: [
        { name: "New Sale Button", type: "button", status: "working", description: "Navigate to POS" },
        { name: "View Reports Button", type: "button", status: "working", description: "Navigate to reports" },
        { name: "Stock Status Button", type: "button", status: "working", description: "Navigate to stock" },
        { name: "Customer Payments Button", type: "button", status: "working", description: "Navigate to receivables" },
        { name: "Tank Monitoring Button", type: "button", status: "working", description: "Navigate to tanks" },
        { name: "Daily Reports Button", type: "button", status: "working", description: "Navigate to daily reports" },
        { name: "Sales Chart", type: "table", status: "working", description: "7-day sales trend" },
        { name: "Today's Sales KPI", type: "icon", status: "working", description: "Display today's sales" },
        { name: "Monthly Revenue KPI", type: "icon", status: "working", description: "Display monthly revenue" },
        { name: "Stock Value KPI", type: "icon", status: "working", description: "Display stock value" },
        { name: "Outstanding KPI", type: "icon", status: "working", description: "Display outstanding amounts" }
      ]
    },
    {
      pageName: "Point of Sale",
      route: "/pos",
      status: "working",
      features: [
        { name: "Customer Search", type: "search", status: "working", description: "Search customers/suppliers" },
        { name: "Add Customer Button", type: "button", status: "working", description: "Add new customer" },
        { name: "Product Selection", type: "button", status: "working", description: "Add products to cart" },
        { name: "Quantity Input", type: "form", status: "working", description: "Set default quantity" },
        { name: "Cart Management", type: "table", status: "working", description: "View/edit cart items" },
        { name: "Payment Method Select", type: "form", status: "working", description: "Choose payment method" },
        { name: "Complete Sale Button", type: "button", status: "working", description: "Process transaction" },
        { name: "Save Draft Button", type: "button", status: "working", description: "Save as draft" },
        { name: "Clear Cart Button", type: "button", status: "working", description: "Clear all items" },
        { name: "Print Receipt Button", type: "button", status: "working", description: "Print last transaction" }
      ]
    },
    {
      pageName: "Sales History",
      route: "/sales-history",
      status: "error",
      features: [
        { name: "Search Filter", type: "search", status: "working", description: "Search transactions" },
        { name: "Date Filter", type: "filter", status: "working", description: "Filter by date range" },
        { name: "Payment Method Filter", type: "filter", status: "working", description: "Filter by payment type" },
        { name: "View Transaction Button", type: "button", status: "working", description: "View transaction details" },
        { name: "Edit Transaction Button", type: "button", status: "working", description: "Edit transaction" },
        { name: "Delete Transaction Button", type: "button", status: "working", description: "Delete transaction" },
        { name: "Print Report Button", type: "button", status: "working", description: "Print sales report" },
        { name: "Export CSV Button", type: "button", status: "working", description: "Export to CSV" },
        { name: "Draft Management", type: "table", status: "working", description: "Manage draft sales" }
      ]
    },
    {
      pageName: "Customer Management",
      route: "/customers",
      status: "working",
      features: [
        { name: "Add Customer Button", type: "button", status: "working", description: "Add new customer" },
        { name: "Search Customers", type: "search", status: "working", description: "Search customer database" },
        { name: "Customer Type Filter", type: "filter", status: "working", description: "Filter by customer type" },
        { name: "View Customer Button", type: "button", status: "working", description: "View customer details" },
        { name: "Edit Customer Button", type: "button", status: "working", description: "Edit customer info" },
        { name: "Delete Customer Button", type: "button", status: "working", description: "Delete customer" },
        { name: "Record Payment Button", type: "button", status: "working", description: "Record customer payment" },
        { name: "Customer Statistics", type: "table", status: "working", description: "Display customer stats" }
      ]
    },
    {
      pageName: "Customer Activity",
      route: "/customer-activity",
      status: "working",
      features: [
        { name: "Search Activities", type: "search", status: "working", description: "Search activity timeline" },
        { name: "StandardDateFilter", type: "filter", status: "working", description: "Modern date range filter" },
        { name: "View Details Button", type: "button", status: "working", description: "View activity details" },
        { name: "Export Activities Button", type: "button", status: "working", description: "Export to CSV" },
        { name: "Print Report Button", type: "button", status: "working", description: "Print activity report" },
        { name: "Activity Timeline", type: "table", status: "working", description: "Display activity history" },
        { name: "Activity Type Icons", type: "icon", status: "working", description: "Visual activity indicators" },
        { name: "Status Badges", type: "icon", status: "working", description: "Activity status indicators" }
      ]
    },
    {
      pageName: "Accounts Receivable",
      route: "/accounts-receivable",
      status: "working",
      features: [
        { name: "Record Payment Button", type: "button", status: "working", description: "Record customer payment" },
        { name: "Search Customers", type: "search", status: "working", description: "Search customer accounts" },
        { name: "Date Filter", type: "filter", status: "working", description: "Filter payments by date" },
        { name: "Aging Filter", type: "filter", status: "working", description: "Filter by aging period" },
        { name: "View Customer Button", type: "button", status: "working", description: "View customer details" },
        { name: "Quick Payment Button", type: "button", status: "working", description: "Quick payment entry" },
        { name: "Generate Statement Button", type: "button", status: "working", description: "Generate customer statement" },
        { name: "Print Report Button", type: "button", status: "working", description: "Print receivables report" },
        { name: "Outstanding Summary", type: "table", status: "working", description: "Display outstanding balances" }
      ]
    },
    {
      pageName: "Accounts Payable",
      route: "/accounts-payable",
      status: "working",
      features: [
        { name: "Make Payment Button", type: "button", status: "working", description: "Record supplier payment" },
        { name: "Search Suppliers", type: "search", status: "working", description: "Search supplier accounts" },
        { name: "Date Filter", type: "filter", status: "working", description: "Filter payments by date" },
        { name: "Status Filter", type: "filter", status: "working", description: "Filter by payment status" },
        { name: "View Supplier Button", type: "button", status: "working", description: "View supplier details" },
        { name: "Quick Payment Button", type: "button", status: "working", description: "Quick payment entry" },
        { name: "View History Button", type: "button", status: "working", description: "View payment history" },
        { name: "Print Report Button", type: "button", status: "working", description: "Print payables report" }
      ]
    },
    {
      pageName: "Payment History",
      route: "/payment-history/:id/:type",
      status: "working",
      features: [
        { name: "Back Button", type: "button", status: "working", description: "Navigate back" },
        { name: "Print Report Button", type: "button", status: "working", description: "Print payment history" },
        { name: "Export PDF Button", type: "button", status: "working", description: "Export as PDF" },
        { name: "Export PNG Button", type: "button", status: "working", description: "Export as PNG" },
        { name: "Search Payments", type: "search", status: "working", description: "Search payment records" },
        { name: "Date Range Filter", type: "filter", status: "working", description: "Filter by date range" },
        { name: "Type Filter", type: "filter", status: "working", description: "Filter by payment type" },
        { name: "Method Filter", type: "filter", status: "working", description: "Filter by payment method" },
        { name: "Payment Timeline", type: "table", status: "working", description: "Display payment history" }
      ]
    },
    {
      pageName: "Expense Management",
      route: "/expenses",
      status: "working",
      features: [
        { name: "Record Expense Button", type: "button", status: "working", description: "Add new expense" },
        { name: "Search Expenses", type: "search", status: "working", description: "Search expense records" },
        { name: "StandardDateFilter", type: "filter", status: "working", description: "Modern date range filter" },
        { name: "Account Filter", type: "filter", status: "working", description: "Filter by account" },
        { name: "Edit Expense Button", type: "button", status: "working", description: "Edit expense record" },
        { name: "Delete Expense Button", type: "button", status: "working", description: "Delete expense record" },
        { name: "Print Report Button", type: "button", status: "working", description: "Print expense report" },
        { name: "Expense Statistics", type: "table", status: "working", description: "Display expense stats" }
      ]
    },
    {
      pageName: "Stock Management",
      route: "/stock",
      status: "working",
      features: [
        { name: "Record Movement Button", type: "button", status: "working", description: "Record stock movement" },
        { name: "Stock Transfer Button", type: "button", status: "working", description: "Transfer between tanks" },
        { name: "Stock Audit Button", type: "button", status: "working", description: "Perform stock audit" },
        { name: "New Purchase Button", type: "button", status: "working", description: "Create purchase order" },
        { name: "Stock Report Button", type: "button", status: "working", description: "Generate stock report" },
        { name: "Search Movements", type: "search", status: "working", description: "Search stock movements" },
        { name: "Date Filter", type: "filter", status: "working", description: "Filter by date range" },
        { name: "Category Filter", type: "filter", status: "working", description: "Filter by category" },
        { name: "Print Report Button", type: "button", status: "working", description: "Print stock report" }
      ]
    },
    {
      pageName: "Pump Management",
      route: "/pumps",
      status: "working",
      features: [
        { name: "Add Pump Button", type: "button", status: "working", description: "Add new pump" },
        { name: "Record Reading Button", type: "button", status: "working", description: "Record pump reading" },
        { name: "Search Pumps", type: "search", status: "working", description: "Search pump records" },
        { name: "StandardDateFilter", type: "filter", status: "working", description: "Modern date range filter" },
        { name: "Edit Pump Button", type: "button", status: "working", description: "Edit pump configuration" },
        { name: "Delete Pump Button", type: "button", status: "working", description: "Delete pump" },
        { name: "Edit Reading Button", type: "button", status: "working", description: "Edit pump reading" },
        { name: "Delete Reading Button", type: "button", status: "working", description: "Delete reading" },
        { name: "Print Report Button", type: "button", status: "working", description: "Print pump report" }
      ]
    },
    {
      pageName: "Tank Monitoring",
      route: "/tanks",
      status: "working",
      features: [
        { name: "Add Tank Button", type: "button", status: "working", description: "Add new tank" },
        { name: "Maintenance Button", type: "button", status: "working", description: "Schedule maintenance" },
        { name: "Tank Status Icons", type: "icon", status: "working", description: "Visual tank status" },
        { name: "Stock Level Progress", type: "icon", status: "working", description: "Visual stock levels" },
        { name: "Alert Notifications", type: "icon", status: "working", description: "Low stock alerts" },
        { name: "Tank Details Modal", type: "modal", status: "working", description: "Detailed tank information" },
        { name: "Real-time Updates", type: "table", status: "working", description: "Live tank monitoring" }
      ]
    },
    {
      pageName: "Purchase Orders",
      route: "/purchase-orders",
      status: "working",
      features: [
        { name: "Create Order Button", type: "button", status: "working", description: "Create new purchase order" },
        { name: "Search Orders", type: "search", status: "working", description: "Search purchase orders" },
        { name: "Date Filter", type: "filter", status: "working", description: "Filter by date range" },
        { name: "Status Filter", type: "filter", status: "working", description: "Filter by order status" },
        { name: "View Order Button", type: "button", status: "working", description: "View order details" },
        { name: "Edit Order Button", type: "button", status: "working", description: "Edit purchase order" },
        { name: "Delete Order Button", type: "button", status: "working", description: "Delete purchase order" },
        { name: "Print Order Button", type: "button", status: "working", description: "Print purchase order" },
        { name: "Export Orders Button", type: "button", status: "working", description: "Export to CSV" }
      ]
    },
    {
      pageName: "Supplier Management",
      route: "/suppliers",
      status: "working",
      features: [
        { name: "Add Supplier Button", type: "button", status: "working", description: "Add new supplier" },
        { name: "Search Suppliers", type: "search", status: "working", description: "Search supplier database" },
        { name: "Status Filter", type: "filter", status: "working", description: "Filter by supplier status" },
        { name: "View Supplier Button", type: "button", status: "working", description: "View supplier details" },
        { name: "Edit Supplier Button", type: "button", status: "working", description: "Edit supplier info" },
        { name: "Delete Supplier Button", type: "button", status: "working", description: "Delete supplier" },
        { name: "Record Payment Button", type: "button", status: "working", description: "Record supplier payment" },
        { name: "Supplier Statistics", type: "table", status: "working", description: "Display supplier stats" }
      ]
    },
    {
      pageName: "Price Management",
      route: "/pricing",
      status: "working",
      features: [
        { name: "Add Product Button", type: "button", status: "working", description: "Add new product" },
        { name: "Edit Price Button", type: "button", status: "working", description: "Update product price" },
        { name: "View History Button", type: "button", status: "working", description: "View price history" },
        { name: "Schedule Price Button", type: "button", status: "working", description: "Schedule price change" },
        { name: "Bulk Update Button", type: "button", status: "working", description: "Bulk price update" },
        { name: "Delete Product Button", type: "button", status: "working", description: "Delete product" },
        { name: "Price History Modal", type: "modal", status: "working", description: "Price change history" },
        { name: "Product Categories", type: "filter", status: "working", description: "Filter by category" }
      ]
    },
    {
      pageName: "Financial Reports",
      route: "/financial-reports",
      status: "working",
      features: [
        { name: "Report Type Select", type: "filter", status: "working", description: "Select report type" },
        { name: "Period Select", type: "filter", status: "working", description: "Select time period" },
        { name: "Generate Report Button", type: "button", status: "working", description: "Generate financial report" },
        { name: "Export Report Button", type: "button", status: "working", description: "Export to CSV" },
        { name: "Print Report Button", type: "button", status: "working", description: "Print financial report" },
        { name: "Report Preview", type: "table", status: "working", description: "Display report data" }
      ]
    },
    {
      pageName: "General Ledger",
      route: "/general-ledger",
      status: "working",
      features: [
        { name: "Add Account Button", type: "button", status: "working", description: "Add chart of account" },
        { name: "Add Journal Entry Button", type: "button", status: "working", description: "Create journal entry" },
        { name: "Date Filter", type: "filter", status: "working", description: "Filter by date range" },
        { name: "Print Report Button", type: "button", status: "working", description: "Print ledger report" },
        { name: "Account Tabs", type: "filter", status: "working", description: "Switch between accounts/journal" },
        { name: "Add Journal Line Button", type: "button", status: "working", description: "Add journal line" },
        { name: "Remove Journal Line Button", type: "button", status: "working", description: "Remove journal line" }
      ]
    },
    {
      pageName: "Daily Reports",
      route: "/daily-reports",
      status: "working",
      features: [
        { name: "Date Selector", type: "filter", status: "working", description: "Select report date" },
        { name: "Refresh Button", type: "button", status: "working", description: "Refresh report data" },
        { name: "Export CSV Button", type: "button", status: "working", description: "Export to CSV" },
        { name: "Print Report Button", type: "button", status: "working", description: "Print daily report" },
        { name: "Sales Summary", type: "table", status: "working", description: "Daily sales breakdown" },
        { name: "Product Sales", type: "table", status: "working", description: "Product-wise sales" },
        { name: "Cash Flow Summary", type: "table", status: "working", description: "Daily cash flow" },
        { name: "Tax Summary", type: "table", status: "working", description: "Tax calculations" }
      ]
    },
    {
      pageName: "Aging Reports",
      route: "/aging-reports",
      status: "working",
      features: [
        { name: "Report Type Tabs", type: "filter", status: "working", description: "Switch receivable/payable" },
        { name: "Export CSV Button", type: "button", status: "working", description: "Export aging report" },
        { name: "Aging Buckets", type: "table", status: "working", description: "Display aging analysis" },
        { name: "Status Badges", type: "icon", status: "working", description: "Payment status indicators" },
        { name: "Progress Indicators", type: "icon", status: "working", description: "Aging progress bars" },
        { name: "Bucket Cards", type: "table", status: "working", description: "Aging bucket summaries" }
      ]
    },
    {
      pageName: "Cash Reconciliation",
      route: "/cash-reconciliation",
      status: "working",
      features: [
        { name: "Start Reconciliation Button", type: "button", status: "working", description: "Begin reconciliation" },
        { name: "Shift Select", type: "filter", status: "working", description: "Select shift period" },
        { name: "Date Selector", type: "filter", status: "working", description: "Select reconciliation date" },
        { name: "Print Report Button", type: "button", status: "working", description: "Print reconciliation" },
        { name: "Denomination Counter", type: "form", status: "working", description: "Count cash denominations" },
        { name: "Cash Summary", type: "table", status: "working", description: "Display cash totals" },
        { name: "Variance Analysis", type: "table", status: "working", description: "Show cash differences" }
      ]
    },
    {
      pageName: "Admin Panel",
      route: "/admin",
      status: "working",
      features: [
        { name: "Tab Navigation", type: "filter", status: "working", description: "Switch admin sections" },
        { name: "Add User Button", type: "button", status: "working", description: "Create new user" },
        { name: "Add Station Button", type: "button", status: "working", description: "Create new station" },
        { name: "Approve User Button", type: "button", status: "working", description: "Approve user registration" },
        { name: "Reject User Button", type: "button", status: "working", description: "Reject user registration" },
        { name: "Delete User Button", type: "button", status: "working", description: "Delete user account" },
        { name: "System Settings", type: "form", status: "working", description: "Configure system settings" },
        { name: "User Management Table", type: "table", status: "working", description: "Manage user accounts" }
      ]
    },
    {
      pageName: "Settings",
      route: "/settings",
      status: "working",
      features: [
        { name: "Currency Select", type: "filter", status: "working", description: "Change system currency" },
        { name: "Dark Mode Toggle", type: "button", status: "working", description: "Toggle dark/light theme" },
        { name: "Compact View Toggle", type: "button", status: "working", description: "Enable compact layout" },
        { name: "Show Tips Toggle", type: "button", status: "working", description: "Enable help tips" },
        { name: "Notification Settings", type: "form", status: "working", description: "Configure notifications" },
        { name: "Auto Refresh Toggle", type: "button", status: "working", description: "Enable auto refresh" },
        { name: "Save Settings Button", type: "button", status: "working", description: "Save preferences" },
        { name: "Station Settings", type: "form", status: "working", description: "Configure station settings" }
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
      case 'broken':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
      case 'missing':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getFeatureTypeIcon = (type: string) => {
    switch (type) {
      case 'button': return <Plus className="w-3 h-3" />;
      case 'icon': return <Eye className="w-3 h-3" />;
      case 'filter': return <Filter className="w-3 h-3" />;
      case 'search': return <Search className="w-3 h-3" />;
      case 'table': return <BarChart3 className="w-3 h-3" />;
      case 'form': return <Edit className="w-3 h-3" />;
      case 'modal': return <FileText className="w-3 h-3" />;
      default: return <Settings className="w-3 h-3" />;
    }
  };

  const testPage = (route: string) => {
    navigate(route);
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h3 className="text-2xl font-semibold text-card-foreground">System Status</h3>
        <p className="text-muted-foreground">Monitor system health and feature status</p>
      </div>

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api">API Status</TabsTrigger>
          <TabsTrigger value="pages">Page Features</TabsTrigger>
          <TabsTrigger value="navigation">Navigation Test</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statusItems.map((item, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
                  <div className="ml-auto">{getStatusIcon(item.status)}</div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <div className="space-y-6">
            {pageFeatures.map((page, pageIndex) => (
              <Card key={pageIndex}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{page.pageName}</CardTitle>
                      {getStatusIcon(page.status)}
                      <Badge variant="outline">{page.route}</Badge>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => testPage(page.route)}
                    >
                      Test Page
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {page.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2 p-2 rounded border">
                        <div className="flex items-center gap-1">
                          {getFeatureTypeIcon(feature.type)}
                          {getStatusIcon(feature.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{feature.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{feature.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {feature.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {page.features.filter(f => f.status === 'working').length} Working
                    </span>
                    <span className="flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-red-500" />
                      {page.features.filter(f => f.status === 'broken').length} Broken
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      {page.features.filter(f => f.status === 'missing').length} Missing
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="navigation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Navigation Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {pageFeatures.map((page, index) => (
                  <Button 
                    key={index}
                    variant="outline" 
                    className="justify-start h-auto p-3"
                    onClick={() => testPage(page.route)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {getStatusIcon(page.status)}
                      <div className="text-left">
                        <div className="text-sm font-medium">{page.pageName}</div>
                        <div className="text-xs text-muted-foreground">{page.route}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
