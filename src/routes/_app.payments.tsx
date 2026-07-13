import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { fmtCurrency, fmtDate, monthKey, nextInvoiceNumber } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Download } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { logActivity } from "@/lib/auth";
import { downloadCSV } from "@/lib/csv";

type PaymentsSearch = { customer?: string };

export const Route = createFileRoute("/_app/payments")({
  head: () => ({ meta: [{ title: "Payments — FNET" }] }),
  validateSearch: zodValidator(searchSchema),
  component: PaymentsPage,
});

function PaymentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const search = useSearch({ from: "/_app/payments" });

  const { data } = useQuery({
    queryKey: ["payments-list"],
    queryFn: async () =>
      (
        await supabase
          .from("payments")
          .select("*, customer:customers(id, name, customer_code, monthly_bill)")
          .order("payment_date", { ascending: false })
          .limit(500)
      ).data ?? [],
  });

  const customers = useQuery({
    queryKey: ["customers-mini"],
    queryFn: async () =>
      (await supabase.from("customers").select("id, name, customer_code, monthly_bill").order("name"))
        .data ?? [],
  });

  const [open, setOpen] = useState(false);
  const blank = {
    customer_id: search.customer ?? "",
    amount: "",
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "cash",
    collector_name: user?.full_name ?? "",
    transaction_id: "",
    remarks: "",
  };
  const [form, setForm] = useState<any>(blank);

  useEffect(() => {
    if (search.customer) {
      setForm({ ...blank, customer_id: search.customer, collector_name: user?.full_name ?? "" });
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.customer]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id) {
      toast.error("Select a customer");
      return;
    }
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      toast.error("Amount must be positive");
      return;
    }

    // Ensure current-month invoice exists
    const cust = (customers.data ?? []).find((c: any) => c.id === form.customer_id);
    const bm = monthKey(new Date(form.payment_date));
    let { data: inv } = await supabase
      .from("invoices")
      .select("*")
      .eq("customer_id", form.customer_id)
      .eq("billing_month", bm)
      .maybeSingle();

    if (!inv && cust) {
      const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true });
      const invoice_number = nextInvoiceNumber(count ?? 0, new Date(form.payment_date));
      const { data: created } = await supabase
        .from("invoices")
        .insert({
          invoice_number,
          customer_id: form.customer_id,
          amount: cust.monthly_bill,
          due_amount: cust.monthly_bill,
          billing_month: bm,
          issue_date: form.payment_date,
          due_date: form.payment_date,
          status: "pending",
        })
        .select()
        .single();
      inv = created;
    }

    const { error } = await supabase.from("payments").insert({
      customer_id: form.customer_id,
      invoice_id: inv?.id ?? null,
      amount,
      payment_date: form.payment_date,
      payment_method: form.payment_method,
      collector_name: form.collector_name || null,
      transaction_id: form.transaction_id || null,
      remarks: form.remarks || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }

    if (inv) {
      const paid = Number(inv.paid_amount) + amount;
      const due = Math.max(0, Number(inv.amount) - paid);
      const status = due === 0 ? "paid" : paid > 0 ? "partial" : "pending";
      await supabase.from("invoices").update({ paid_amount: paid, due_amount: due, status }).eq("id", inv.id);
    }

    await logActivity(user!.username, "Payment Added", `${cust?.name} — ${fmtCurrency(amount)}`);
    toast.success("Payment recorded");
    setOpen(false);
    setForm(blank);
    qc.invalidateQueries({ queryKey: ["payments-list"] });
    qc.invalidateQueries({ queryKey: ["invoices-list"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const doExport = () => {
    const rows = (data ?? []).map((p: any) => ({
      date: p.payment_date,
      customer: p.customer?.name,
      code: p.customer?.customer_code,
      amount: p.amount,
      method: p.payment_method,
      collector: p.collector_name ?? "",
      txn: p.transaction_id ?? "",
    }));
    downloadCSV(`fnet-payments-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Record and view collections.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={doExport}
            className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            onClick={() => {
              setForm({ ...blank, collector_name: user?.full_name ?? "" });
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg gradient-cyan text-navy px-3 py-2 text-sm font-bold"
          >
            <Plus className="h-4 w-4" /> Add Payment
          </button>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Method</th>
                <th className="text-left px-4 py-3">Collector</th>
                <th className="text-left px-4 py-3">Txn ID</th>
                <th className="text-right px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No payments yet
                  </td>
                </tr>
              )}
              {(data ?? []).map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">{fmtDate(p.payment_date)}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{p.customer?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{p.customer?.customer_code}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">{p.payment_method}</td>
                  <td className="px-4 py-3">{p.collector_name ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.transaction_id ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-bold text-success">{fmtCurrency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold">New Payment</h3>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Customer</span>
              <select
                required
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select customer…</option>
                {(customers.data ?? []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.customer_code}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Amount</span>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Date</span>
                <input
                  required
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Method</span>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Collector</span>
                <input
                  value={form.collector_name}
                  onChange={(e) => setForm({ ...form, collector_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Transaction ID</span>
              <input
                value={form.transaction_id}
                onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Remarks</span>
              <textarea
                rows={2}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-3 py-2 text-sm">
                Cancel
              </button>
              <button className="rounded-lg gradient-cyan text-navy px-3 py-2 text-sm font-bold">Record</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
