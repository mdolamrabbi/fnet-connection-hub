import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, GlassCard } from "@/components/GlassCard";
import {
  Users,
  UserCheck,
  UserX,
  Wallet,
  CalendarClock,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
} from "lucide-react";
import { fmtCurrency, fmtDate, fmtDateTime } from "@/lib/format";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — FNET" }] }),
  component: Dashboard,
});

function Dashboard() {
  const stats = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .slice(0, 10);

      const [customers, payments, invoices] = await Promise.all([
        supabase.from("customers").select("id, status"),
        supabase.from("payments").select("amount, payment_date"),
        supabase.from("invoices").select("customer_id, amount, paid_amount, due_amount, status"),
      ]);

      const cs = customers.data ?? [];
      const ps = payments.data ?? [];
      const inv = invoices.data ?? [];

      // Aggregate per-customer paid/due
      const perCust = new Map<string, { paid: number; due: number }>();
      for (const i of inv) {
        const cur = perCust.get(i.customer_id) ?? { paid: 0, due: 0 };
        cur.paid += Number(i.paid_amount || 0);
        cur.due += Number(i.due_amount || 0);
        perCust.set(i.customer_id, cur);
      }

      let paidCust = 0;
      let unpaidCust = 0;
      let partialCust = 0;
      for (const c of cs) {
        const a = perCust.get(c.id) ?? { paid: 0, due: 0 };
        if (a.due <= 0) paidCust++;
        else if (a.paid > 0) partialCust++;
        else unpaidCust++;
      }

      const total = cs.length;
      const active = cs.filter((c) => c.status === "active").length;
      const inactive = total - active;
      const todaysCollection = ps
        .filter((p) => p.payment_date === todayStr)
        .reduce((s, p) => s + Number(p.amount), 0);
      const monthCollection = ps
        .filter((p) => p.payment_date >= monthStart)
        .reduce((s, p) => s + Number(p.amount), 0);
      const totalDue = inv.reduce((s, i) => s + Number(i.due_amount || 0), 0);
      const pendingBills = inv.filter((i) => i.status !== "paid").length;
      const paidBills = inv.filter((i) => i.status === "paid").length;

      return {
        total,
        active,
        inactive,
        paidCust,
        unpaidCust,
        partialCust,
        todaysCollection,
        monthCollection,
        totalDue,
        pendingBills,
        paidBills,
      };
    },
  });

  const recentPayments = useQuery({
    queryKey: ["recent-payments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("id, amount, payment_date, collector_name, customer:customers(name, customer_code)")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const recentCustomers = useQuery({
    queryKey: ["recent-customers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, name, customer_code, status, created_at")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  // Realtime refresh
  useEffect(() => {
    const chans = ["customers", "payments", "invoices"].map((t) =>
      supabase
        .channel(`rt-${t}`)
        .on("postgres_changes", { event: "*", schema: "public", table: t }, () => {
          stats.refetch();
          recentPayments.refetch();
          recentCustomers.refetch();
        })
        .subscribe(),
    );
    return () => {
      chans.forEach((c) => supabase.removeChannel(c));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = stats.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Realtime overview of your FNET operations.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        <Link to="/customers" search={{ status: undefined }}>
          <StatCard label="Total Customers" value={s?.total ?? "—"} icon={<Users className="h-5 w-5" />} accent="navy" />
        </Link>
        <Link to="/customers" search={{ status: "paid" }}>
          <StatCard label="Paid Customers" value={s?.paidCust ?? "—"} icon={<CheckCircle2 className="h-5 w-5" />} accent="success" />
        </Link>
        <Link to="/customers" search={{ status: "unpaid" }}>
          <StatCard label="Unpaid Customers" value={s?.unpaidCust ?? "—"} icon={<AlertCircle className="h-5 w-5" />} accent="destructive" />
        </Link>
        <Link to="/customers" search={{ status: "partial" }}>
          <StatCard label="Partial Customers" value={s?.partialCust ?? "—"} icon={<CircleDollarSign className="h-5 w-5" />} accent="warning" />
        </Link>
        <Link to="/customers" search={{ status: "active" }}>
          <StatCard label="Active" value={s?.active ?? "—"} icon={<UserCheck className="h-5 w-5" />} accent="success" />
        </Link>
        <Link to="/customers" search={{ status: "inactive" }}>
          <StatCard label="Inactive" value={s?.inactive ?? "—"} icon={<UserX className="h-5 w-5" />} accent="destructive" />
        </Link>
        <StatCard label="Today's Collection" value={s ? fmtCurrency(s.todaysCollection) : "—"} icon={<Wallet className="h-5 w-5" />} accent="cyan" />
        <StatCard label="Monthly Collection" value={s ? fmtCurrency(s.monthCollection) : "—"} icon={<TrendingUp className="h-5 w-5" />} accent="cyan" />
        <StatCard label="Total Due" value={s ? fmtCurrency(s.totalDue) : "—"} icon={<AlertCircle className="h-5 w-5" />} accent="warning" />
        <StatCard label="Pending Bills" value={s?.pendingBills ?? "—"} icon={<CalendarClock className="h-5 w-5" />} accent="warning" />
        <StatCard label="Paid Bills" value={s?.paidBills ?? "—"} icon={<FileText className="h-5 w-5" />} accent="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent Payments</h2>
            <span className="text-xs text-muted-foreground">Last 6</span>
          </div>
          <div className="space-y-2">
            {(recentPayments.data ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground py-4 text-center">No payments yet</div>
            )}
            {(recentPayments.data ?? []).map((p) => {
              const cust = Array.isArray(p.customer) ? p.customer[0] : (p.customer as any);
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{cust?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {cust?.customer_code} • {fmtDate(p.payment_date)}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-success">{fmtCurrency(p.amount)}</div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent Customers</h2>
            <span className="text-xs text-muted-foreground">Last 6</span>
          </div>
          <div className="space-y-2">
            {(recentCustomers.data ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground py-4 text-center">No customers yet</div>
            )}
            {(recentCustomers.data ?? []).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.customer_code} • {fmtDateTime(c.created_at)}
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    c.status === "active"
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
