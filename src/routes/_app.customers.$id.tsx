import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { logActivity } from "@/lib/auth";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { ArrowLeft, Wallet } from "lucide-react";

export const Route = createFileRoute("/_app/customers/$id")({
  head: () => ({ meta: [{ title: "Customer — FNET" }] }),
  component: CustomerDetail,
});

function CustomerDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const packages = useQuery({
    queryKey: ["packages"],
    queryFn: async () =>
      (await supabase.from("packages").select("id, name, speed_mbps, monthly_price").order("speed_mbps"))
        .data ?? [],
  });
  const zones = useQuery({
    queryKey: ["zones"],
    queryFn: async () => (await supabase.from("zones").select("id, name").order("name")).data ?? [],
  });

  const customer = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const payments = useQuery({
    queryKey: ["customer-payments", id],
    queryFn: async () =>
      (
        await supabase
          .from("payments")
          .select("*")
          .eq("customer_id", id)
          .order("payment_date", { ascending: false })
      ).data ?? [],
  });

  const invoices = useQuery({
    queryKey: ["customer-invoices", id],
    queryFn: async () =>
      (
        await supabase
          .from("invoices")
          .select("*")
          .eq("customer_id", id)
          .order("issue_date", { ascending: false })
      ).data ?? [],
  });

  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    if (customer.data) setForm(customer.data);
  }, [customer.data]);

  if (!form) {
    return <div className="text-sm text-muted-foreground">Loading customer…</div>;
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("customers")
      .update({
        name: form.name,
        username: form.username,
        password: form.password,
        phone: form.phone,
        email: form.email,
        address: form.address,
        zone_id: form.zone_id || null,
        package_id: form.package_id || null,
        monthly_bill: Number(form.monthly_bill || 0),
        billing_day: Number(form.billing_day || 1),
        connection_date: form.connection_date,
        status: form.status,
        ip_address: form.ip_address,
        mac_address: form.mac_address,
        onu_mac: form.onu_mac,
        remarks: form.remarks,
      })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logActivity(user!.username, "Customer Edited", `${form.name} (${form.customer_code})`);
    toast.success("Customer updated");
  };

  const del = async () => {
    if (user?.role !== "admin") {
      toast.error("Admin only");
      return;
    }
    if (!confirm("Delete this customer?")) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logActivity(user.username, "Customer Deleted", form.name);
    toast.success("Deleted");
    navigate({ to: "/customers" });
  };

  const totalPaid = (payments.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const totalDue = (invoices.data ?? []).reduce((s, i) => s + Number(i.due_amount || 0), 0);

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/customers" className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">{form.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground font-mono">{form.customer_code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/payments"
            search={{ customer: id } as any}
            className="inline-flex items-center gap-2 rounded-lg gradient-cyan text-navy px-3 py-2 text-sm font-bold hover:opacity-90"
          >
            <Wallet className="h-4 w-4" /> Add Payment
          </Link>
          {user?.role === "admin" && (
            <button
              onClick={del}
              className="rounded-lg border border-destructive text-destructive px-3 py-2 text-sm font-medium hover:bg-destructive/10"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-xl p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Monthly Bill</div>
          <div className="mt-1 text-2xl font-black">{fmtCurrency(form.monthly_bill)}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Paid</div>
          <div className="mt-1 text-2xl font-black text-success">{fmtCurrency(totalPaid)}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Due</div>
          <div className="mt-1 text-2xl font-black text-warning">{fmtCurrency(totalDue)}</div>
        </div>
      </div>

      <form onSubmit={save} className="glass rounded-xl p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="Name" v={form.name} on={(v) => setForm({ ...form, name: v })} />
          <F label="Phone" v={form.phone ?? ""} on={(v) => setForm({ ...form, phone: v })} />
          <F label="Email" v={form.email ?? ""} on={(v) => setForm({ ...form, email: v })} />
          <F label="Address" v={form.address ?? ""} on={(v) => setForm({ ...form, address: v })} />
          <F label="Username" v={form.username ?? ""} on={(v) => setForm({ ...form, username: v })} />
          <F label="Password" v={form.password ?? ""} on={(v) => setForm({ ...form, password: v })} />
          <S
            label="Zone"
            v={form.zone_id ?? ""}
            on={(v) => setForm({ ...form, zone_id: v })}
            opts={[{ value: "", label: "—" }, ...(zones.data ?? []).map((z: any) => ({ value: z.id, label: z.name }))]}
          />
          <S
            label="Package"
            v={form.package_id ?? ""}
            on={(v) => setForm({ ...form, package_id: v })}
            opts={[
              { value: "", label: "—" },
              ...(packages.data ?? []).map((p: any) => ({
                value: p.id,
                label: `${p.name} · ${p.speed_mbps} Mbps`,
              })),
            ]}
          />
          <F
            label="Monthly Bill"
            v={String(form.monthly_bill)}
            on={(v) => setForm({ ...form, monthly_bill: v })}
            type="number"
          />
          <F
            label="Billing Day"
            v={String(form.billing_day)}
            on={(v) => setForm({ ...form, billing_day: Number(v) || 1 })}
            type="number"
          />
          <F
            label="Connection Date"
            v={form.connection_date ?? ""}
            on={(v) => setForm({ ...form, connection_date: v })}
            type="date"
          />
          <S
            label="Status"
            v={form.status}
            on={(v) => setForm({ ...form, status: v })}
            opts={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "suspended", label: "Suspended" },
            ]}
          />
          <F label="IP Address" v={form.ip_address ?? ""} on={(v) => setForm({ ...form, ip_address: v })} />
          <F label="MAC Address" v={form.mac_address ?? ""} on={(v) => setForm({ ...form, mac_address: v })} />
          <F label="ONU MAC" v={form.onu_mac ?? ""} on={(v) => setForm({ ...form, onu_mac: v })} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remarks</label>
          <textarea
            value={form.remarks ?? ""}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex justify-end pt-2 border-t">
          <button type="submit" className="rounded-lg gradient-cyan text-navy px-4 py-2 text-sm font-bold">
            Save Changes
          </button>
        </div>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-xl p-5">
          <h3 className="font-bold mb-3">Payment History</h3>
          {(payments.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments</p>
          ) : (
            <div className="space-y-2">
              {(payments.data ?? []).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                  <div>
                    <div className="text-sm font-semibold">{fmtDate(p.payment_date)}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.payment_method} · {p.collector_name ?? "—"}
                    </div>
                  </div>
                  <div className="font-bold text-success">{fmtCurrency(p.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="glass rounded-xl p-5">
          <h3 className="font-bold mb-3">Invoices</h3>
          {(invoices.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices</p>
          ) : (
            <div className="space-y-2">
              {(invoices.data ?? []).map((i: any) => (
                <div key={i.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                  <div>
                    <div className="text-sm font-semibold font-mono">{i.invoice_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.billing_month} · Due {fmtDate(i.due_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{fmtCurrency(i.amount)}</div>
                    <div className="text-xs text-muted-foreground capitalize">{i.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function F({
  label,
  v,
  on,
  type = "text",
}: {
  label: string;
  v: string;
  on: (s: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={v}
        onChange={(e) => on(e.target.value)}
        className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}
function S({
  label,
  v,
  on,
  opts,
}: {
  label: string;
  v: string;
  on: (s: string) => void;
  opts: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={v}
        onChange={(e) => on(e.target.value)}
        className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
      >
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
