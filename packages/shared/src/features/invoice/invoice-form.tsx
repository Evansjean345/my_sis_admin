import { Separator } from "@shared/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { ClientSelector } from "@shared/features/invoice/client-selector";
import { InvoiceAdjustments } from "@shared/features/invoice/invoice-adjustments";
import { InvoiceDetails } from "@shared/features/invoice/invoice-details";
import { InvoiceItems } from "@shared/features/invoice/invoice-items";

export function InvoiceForm() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <Tabs defaultValue="invoice">
        <TabsList className="w-full">
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
        </TabsList>
      </Tabs>

      <InvoiceDetails />

      <Separator />

      <ClientSelector />

      <Separator />

      <InvoiceItems />

      <Separator />

      <InvoiceAdjustments />
    </div>
  );
}
