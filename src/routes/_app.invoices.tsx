import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { fmtCurrency, fmtDate, monthKey, nextInvoiceNumber } from "@/lib/format";
import { toast } from "sonner";
import { Download, FilePlus2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { logActivity } from "@/lib/auth";
import { downloadCSV } from "@/lib/csv";

export const Route = createFileRoute("/_app/invoices")({
  head: () => ({ meta: [{ title: "Invoices — FNET" }] }),
  component: InvoicesPage,
});

function InvoicesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [generating, setGenerating] = useState(false);

  const { data } = useQuery({
    queryKey: ["invoices-list"],
    queryFn: async () =>
      (
        await supabase
          .from("invoices")
          .select("*, customer:customers(id, name, customer_code)")
          .order("issue_date", { ascending: false })
          .limit(1000)
      ).data ?? [],
  });

  const filtered = (data ?? []).filter((i: any) => {
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (monthFilter !== "all" && i.billing_month !== monthFilter) return false;
    return true;
  });

  const months = Array.from(new Set((data ?? []).map((i: any) => i.billing_month))).sort().reverse();

  const generate = async () => {
    if (user?.role !== "admin") {
      toast.error("Admin only");
      return;
    }
    setGenerating(true);
    try {
      const bm = monthKey();
      const [{ data: customers }, { data: existing }, { count }] = await Promise.all([
        supabase.from("customers").select("id, name, monthly_bill, billing_day, status").eq("status", "active"),
        supabase.from("invoices").select("customer_id").eq("billing_month", bm),
        supabase.from("invoices").select("*", { count: "exact", head: true }),
      ]);
      const existingSet = new Set((existing ?? []).map((x: any) => x.customer_id));
      const toCreate = (customers ?? []).filter((c: any) => !existingSet.has(c.id));
      if (toCreate.length === 0) {
        toast.info("All active customers already have this month's invoice");
        return;
      }
      const now = new Date();
      let seq = count ?? 0;
      const rows = toCreate.map((c: any) => {
        seq += 1;
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        return {
          invoice_number: `FNET-${y}-${m}-${String(seq).padStart(4, "0")}`,
          customer_id: c.id,
          amount: c.monthly_bill,
          due_amount: c.monthly_bill,
          billing_month: bm,
          issue_date: now.toISOString().slice(0, 10),
          due_date: new Date(now.getFullYear(), now.getMonth(), Math.min(28, c.billing_day || 1))
            .toISOString()
            .slice(0, 10),
          status: "pending",
        };
      });
      const { error } = await supabase.from("invoices").insert(rows);
      if (error) throw error;
      await logActivity(user!.username, "Bills Generated", `${rows.length} invoices for ${bm}`);
      toast.success(`Generated ${rows.length} invoices for ${bm}`);
      qc.invalidateQueries({ queryKey: ["invoices-list"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setGenerating(false);
    }
  };

  const doExport = () => {
    downloadCSV(
      `fnet-invoices-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((i: any) => ({
        invoice_number: i.invoice_number,
        customer: i.customer?.name,
        code: i.customer?.customer_code,
        billing_month: i.billing_month,
        issue_date: i.issue_date,
        due_date: i.due_date,
        amount: i.amount,
        paid: i.paid_amount,
        due: i.due_amount,
        status: i.status,
      })),
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monthly billing and dues.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={doExport}
            className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          {user?.role === "admin" && (
            <button
              onClick={generate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-lg gradient-cyan text-navy px-3 py-2 text-sm font-bold disabled:opacity-60"
            >
              <FilePlus2 className="h-4 w-4" /> {generating ? "Generating…" : "Generate This Month"}
            </button>
          )}
        </div>
      </div>

      <div className="glass rounded-xl p-4 grid gap-3 md:grid-cols-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Invoice #</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Month</th>
                <th className="text-left px-4 py-3">Due Date</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-right px-4 py-3">Paid</th>
                <th className="text-right px-4 py-3">Due</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No invoices
                  </td>
                </tr>
              )}
              {filtered.map((i: any) => (
                <tr key={i.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{i.invoice_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{i.customer?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{i.customer?.customer_code}</div>
                  </td>
                  <td className="px-4 py-3">{i.billing_month}</td>
                  <td className="px-4 py-3">{fmtDate(i.due_date)}</td>
                  <td className="px-4 py-3 text-right">{fmtCurrency(i.amount)}</td>
                  <td className="px-4 py-3 text-right text-success">{fmtCurrency(i.paid_amount)}</td>
                  <td className="px-4 py-3 text-right text-warning font-semibold">{fmtCurrency(i.due_amount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                        i.status === "paid"
                          ? "bg-success/15 text-success"
                          : i.status === "partial"
                          ? "bg-warning/15 text-warning"
                          : i.status === "overdue"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
