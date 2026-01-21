
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useStation } from "@/contexts/StationContext";
import { apiRequest } from "@/lib/api";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import type { PurchaseOrder, Supplier, Product } from "@shared/schema";

interface PurchaseOrderWithDetails extends PurchaseOrder {
  supplier: Supplier;
  items: Array<{ product: Product; quantity: string; unitPrice: string; totalPrice: string }>;
}

export default function PurchaseInvoiceView() {
  const { id } = useParams<{ id: string }>();
  const { formatCurrency } = useCurrency();
  const { stationSettings } = useStation();

  const { data: purchaseOrder, isLoading } = useQuery<PurchaseOrderWithDetails>({
    queryKey: ["/api/purchase-orders/detail", id!],
    enabled: !!id,
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <h2 className="text-2xl font-bold mb-2">Purchase Order Not Found</h2>
            <Link href="/purchase-orders">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Purchase Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden sticky top-0 bg-background/80 backdrop-blur-sm border-b z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/purchase-orders">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Purchase Order #{purchaseOrder.orderNumber}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Card className="print:shadow-none print:border-none">
          <CardContent className="p-8">
            <div className="text-center mb-8 border-b border-gray-300 pb-6">
              <h1 className="text-3xl font-bold text-blue-600 mb-2">{stationSettings?.stationName || 'FuelFlow Station'}</h1>
              <div className="text-sm text-gray-600 space-y-1">
                {stationSettings?.address && <p>{stationSettings.address}</p>}
                {stationSettings?.contactNumber && <p>Phone: {stationSettings.contactNumber}</p>}
              </div>
              <p className="text-lg text-gray-600 mt-4">Purchase Order</p>
              <p className="text-sm text-gray-500">PO #{purchaseOrder.orderNumber}</p>
            </div>

            <div className="flex gap-2 mb-6">
              <Badge variant={purchaseOrder.status === 'delivered' ? 'default' : 'secondary'}>
                {purchaseOrder.status?.toUpperCase()}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-lg mb-3">Supplier:</h3>
                <div className="space-y-1">
                  <p className="font-semibold">{purchaseOrder.supplier?.name}</p>
                  {purchaseOrder.supplier?.contactPerson && <p>Contact: {purchaseOrder.supplier.contactPerson}</p>}
                  {purchaseOrder.supplier?.contactPhone && <p>Phone: {purchaseOrder.supplier.contactPhone}</p>}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3">Order Details:</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Order Date:</span> {purchaseOrder.orderDate ? format(new Date(purchaseOrder.orderDate), 'MMM dd, yyyy') : 'N/A'}</p>
                  <p><span className="font-semibold">Expected Delivery:</span> {purchaseOrder.expectedDeliveryDate ? format(new Date(purchaseOrder.expectedDeliveryDate), 'MMM dd, yyyy') : 'N/A'}</p>
                </div>
              </div>
            </div>

            <Separator className="mb-6" />

            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4">Items</h3>
              <div className="border rounded-lg">
                <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 font-semibold text-sm border-b">
                  <div className="col-span-5">Product</div>
                  <div className="col-span-2 text-right">Quantity</div>
                  <div className="col-span-2 text-right">Unit Price</div>
                  <div className="col-span-3 text-right">Total</div>
                </div>
                {purchaseOrder.items?.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0">
                    <div className="col-span-5">
                      <div className="font-semibold">{item.product?.name}</div>
                    </div>
                    <div className="col-span-2 text-right">{parseFloat(item.quantity).toFixed(2)}</div>
                    <div className="col-span-2 text-right">{formatCurrency(parseFloat(item.unitPrice))}</div>
                    <div className="col-span-3 text-right font-semibold">{formatCurrency(parseFloat(item.totalPrice))}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end mb-8">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(parseFloat(purchaseOrder.totalAmount ?? '0'))}</span>
                </div>
              </div>
            </div>

            <Separator className="mb-6" />
            <div className="text-center text-sm text-muted-foreground">
              <p>Thank you for your business!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
