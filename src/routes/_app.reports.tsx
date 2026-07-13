import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import { Download } from "lucide-react";
import { StatCard } from "@/components/GlassCard";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — FNET" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);

  const { data: payments } = useQuery({
    queryKey: ["reports-payments", from, to],
    queryFn: async () =>
      (
        await supabase
          .from("payments")
          .select("*, customer:customers(name, customer_code, zone:zones(name))")
          .gte("payment_date", from)
          .lte("payment_date", to)
          .order("payment_date", { ascending: false })
      ).data ?? [],
  });

  const { data: dueInvoices } = useQuery({
    queryKey: ["reports-due"],
    queryFn: async () =>
      (
        await supabase
          .from("invoices")
          .select("*, customer:customers(name, customer_code, phone)")
          .neq("status", "paid")
          .order("due_date", { ascending: true })
      ).data ?? [],
  });

  const totals = useMemo(() => {
    const list = payments ?? [];
    const total = list.reduce((s, p) => s + Number(p.amount), 0);
    const dueTotal = (dueInvoices ?? []).reduce((s, i) => s + Number(i.due_amount || 0), 0);
    return { total, count: list.length, dueTotal, dueCount: dueInvoices?.length ?? 0 };
  }, [payments, dueInvoices]);

  const exportCollection = () =>
    downloadCSV(
      `fnet-collection-${from}-to-${to}.csv`,
      (payments ?? []).map((p: any) => ({
        date: p.payment_date,
        customer: p.customer?.name,
        code: p.customer?.customer_code,
        zone: p.customer?.zone?.name ?? "",
        amount: p.amount,
        method: p.payment_method,
        collector: p.collector_name ?? "",
      })),
    );

  const exportDue = () =>
    downloadCSV(
      `fnet-due-${new Date().toISOString().slice(0, 10)}.csv`,
      (dueInvoices ?? []).map((i: any) => ({
        invoice: i.invoice_number,
        customer: i.customer?.name,
        code: i.customer?.customer_code,
        phone: i.customer?.phone ?? "",
        billing_month: i.billing_month,
        due_date: i.due_date,
        amount: i.amount,
        paid: i.paid_amount,
        due: i.due_amount,
        status: i.status,
      })),
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Collection reports and dues.</p>
      </div>

      <div className="glass rounded-xl p-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="flex items-end">
          <button
            onClick={exportCollection}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg gradient-cyan text-navy px-3 py-2 text-sm font-bold"
          >
            <Download className="h-4 w-4" /> Export Collection
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Payments Count" value={totals.count} accent="cyan" />
        <StatCard label="Total Collection" value={fmtCurrency(totals.total)} accent="success" />
        <StatCard label="Total Due" value={fmtCurrency(totals.dueTotal)} accent="warning" />
        <StatCard label="Due Invoices" value={totals.dueCount} accent="destructive" />
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <h2 className="font-bold">Collection ({from} → {to})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Zone</th>
                <th className="text-left px-4 py-3">Collector</th>
                <th className="text-right px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(payments ?? []).map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2.5">{fmtDate(p.payment_date)}</td>
                  <td className="px-4 py-2.5">{p.customer?.name}</td>
                  <td className="px-4 py-2.5">{p.customer?.zone?.name ?? "—"}</td>
                  <td className="px-4 py-2.5">{p.collector_name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{fmtCurrency(p.amount)}</td>
                </tr>
              ))}
              {(payments ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No payments in range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <h2 className="font-bold">Due Report</h2>
          <button
            onClick={exportDue}
            className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Invoice</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Due Date</th>
                <th className="text-right px-4 py-3">Due</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(dueInvoices ?? []).map((i: any) => (
                <tr key={i.id} className="border-t">
                  <td className="px-4 py-2.5 font-mono text-xs">{i.invoice_number}</td>
                  <td className="px-4 py-2.5">{i.customer?.name}</td>
                  <td className="px-4 py-2.5">{i.customer?.phone ?? "—"}</td>
                  <td className="px-4 py-2.5">{fmtDate(i.due_date)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-warning">{fmtCurrency(i.due_amount)}</td>
                  <td className="px-4 py-2.5 capitalize">{i.status}</td>
                </tr>
              ))}
              {(dueInvoices ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    All invoices paid 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
