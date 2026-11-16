import { format } from "date-fns";
import { Download, RotateCw, Settings2 } from "lucide-react";

import { Button } from "@shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { BalanceDistributionCard } from "@shared/features/billing/balance-distribution-card";
import { FinanceNotification } from "@shared/features/billing/finance-notification";
import { IncomeBreakdown } from "@shared/features/billing/income-breakdown";
import { OverviewKpis } from "@shared/features/billing/overview-kpis";
import { QuickActions } from "@shared/features/billing/quick-actions";
import { TransactionsOverviewCard } from "@shared/features/billing/transactions-overview-card";
import { UpcomingTransactions } from "@shared/features/billing/upcoming-transactions";
import { Wallet } from "@shared/features/billing/wallet";

export default function Page() {
  const formattedDate = format(new Date(), "EEEE, do MMMM yyyy");

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl tracking-tight">Personal Finances</h1>
        <p className="text-muted-foreground text-sm">{formattedDate}</p>
      </div>

      <Tabs defaultValue="30-days" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList variant="line">
            <TabsTrigger value="30-days">Dashboard</TabsTrigger>
            <TabsTrigger value="12-months">Accounts</TabsTrigger>
            <TabsTrigger value="custom">Transactions</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <RotateCw className="size-4" />
              <span>Updated 5 min ago</span>
            </div>
            <Button size="sm" variant="outline">
              <Settings2 />
              Settings
            </Button>
            <Button size="sm" variant="outline">
              <Download data-icon="inline-start" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="30-days" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-6">
              <OverviewKpis />
            </div>

            <div className="flex flex-col gap-4 xl:col-span-6">
              <IncomeBreakdown />
              <FinanceNotification />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <TransactionsOverviewCard />
            </div>
            <div className="xl:col-span-5">
              <BalanceDistributionCard />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-4">
              <Wallet />
            </div>
            <div className="xl:col-span-4">
              <UpcomingTransactions />
            </div>
            <div className="xl:col-span-4">
              <QuickActions />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="12-months">
          <div className="flex h-64 items-center justify-center rounded-xl border border-border border-dashed text-muted-foreground">
            Accounts view coming soon.
          </div>
        </TabsContent>

        <TabsContent value="custom">
          <div className="flex h-64 items-center justify-center rounded-xl border border-border border-dashed text-muted-foreground">
            Transactions view coming soon.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
