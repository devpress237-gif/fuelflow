
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, FileText, CheckCircle, AlertCircle, Info } from "lucide-react";
import { StandardPageHeader } from "@/components/ui/standard-page-header";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function BulkDataImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sales");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const downloadTemplate = (type: string) => {
    const templates = {
      sales: "Date,Customer Name,Product Name,Quantity,Unit Price,Payment Method,Invoice Number\n2022-01-15,John Doe,Diesel,100.5,150.00,cash,INV001",
      expenses: "Date,Description,Amount,Account Code,Receipt Number,Payment Method,Notes\n2022-01-15,Office Supplies,5000,5001,RCP001,cash,Monthly supplies",
      payments: "Date,Customer/Supplier Name,Amount,Payment Method,Type,Reference Number,Notes\n2022-01-15,ABC Company,50000,bank,receivable,PAY001,Payment received",
      purchases: "Date,Supplier Name,Product Name,Quantity,Unit Price,Order Number,Status\n2022-01-15,XYZ Suppliers,Diesel,5000,145.00,PO001,delivered"
    };

    const template = templates[type as keyof typeof templates];
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_import_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('type', activeTab);
    formData.append('stationId', user?.stationId || '');

    try {
      const response = await fetch('/api/bulk-import', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();
      
      setImportResult(result);
      
      if (result.success > 0) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${result.success} records${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
        });
      } else {
        toast({
          title: "Import failed",
          description: "No records were imported successfully",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Import error",
        description: "Failed to process import file",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <StandardPageHeader
        title="Bulk Data Import"
        subtitle="Import historical records from CSV files"
      >
        <Button variant="outline" onClick={() => window.history.back()}>
          Back
        </Button>
      </StandardPageHeader>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Use this page to import historical data (2-3 years) efficiently. Download the template for your data type, fill it with your records, and upload it here.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales Transactions</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="purchases">Purchase Orders</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Download Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download the CSV template for {activeTab} and fill it with your historical data.
              </p>
              <Button onClick={() => downloadTemplate(activeTab)} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Upload Filled Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="max-w-md"
                  disabled={importing}
                />
                <Button 
                  onClick={handleImport} 
                  disabled={!importFile || importing}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {importing ? "Importing..." : "Import Data"}
                </Button>
              </div>
              
              {importFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  Selected: {importFile.name}
                </div>
              )}
            </CardContent>
          </Card>

          {importResult && (
            <Card className={importResult.failed === 0 ? "border-green-500" : "border-yellow-500"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.failed === 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Badge variant="default" className="bg-green-500">
                      {importResult.success} Successful
                    </Badge>
                  </div>
                  <div>
                    <Badge variant="destructive">
                      {importResult.failed} Failed
                    </Badge>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Errors:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Import Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Ensure dates are in YYYY-MM-DD format (e.g., 2022-01-15)</li>
                <li>Customer/Supplier names must match existing records or will create new ones</li>
                <li>Product names must exist in your product catalog</li>
                <li>Payment methods: cash, card, credit, bank</li>
                <li>All numeric values should not include currency symbols</li>
                <li>Maximum file size: 10MB (~50,000 records)</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
