import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { logActivity } from "@/lib/auth";
import { nextCustomerCode } from "@/lib/format";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/customers/new")({
  head: () => ({ meta: [{ title: "Add Customer — FNET" }] }),
  component: NewCustomer,
});

function NewCustomer() {
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

  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    phone: "",
    email: "",
    address: "",
    zone_id: "",
    package_id: "",
    monthly_bill: "",
    billing_day: 1,
    connection_date: new Date().toISOString().slice(0, 10),
    status: "active",
    ip_address: "",
    mac_address: "",
    onu_mac: "",
    remarks: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const pkg = (packages.data ?? []).find((p: any) => p.id === form.package_id);
    if (pkg && !form.monthly_bill) {
      setForm((f) => ({ ...f, monthly_bill: String(pkg.monthly_price) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.package_id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { count } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });
      const code = nextCustomerCode(count ?? 0);
      const { error } = await supabase.from("customers").insert({
        customer_code: code,
        name: form.name,
        username: form.username || null,
        password: form.password || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        zone_id: form.zone_id || null,
        package_id: form.package_id || null,
        monthly_bill: Number(form.monthly_bill || 0),
        billing_day: Number(form.billing_day || 1),
        connection_date: form.connection_date || null,
        status: form.status,
        ip_address: form.ip_address || null,
        mac_address: form.mac_address || null,
        onu_mac: form.onu_mac || null,
        remarks: form.remarks || null,
      });
      if (error) throw error;
      await logActivity(user!.username, "Customer Added", `${form.name} (${code})`);
      toast.success("Customer created");
      navigate({ to: "/customers" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          to="/customers"
          className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Add Customer</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create a new FNET subscriber.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="glass rounded-xl p-6 space-y-6">
        <Section title="Personal">
          <Field label="Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        </Section>

        <Section title="Portal login">
          <Field label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} />
          <Field label="Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
        </Section>

        <Section title="Service">
          <SelectField
            label="Zone"
            value={form.zone_id}
            onChange={(v) => setForm({ ...form, zone_id: v })}
            options={[{ value: "", label: "—" }, ...(zones.data ?? []).map((z: any) => ({ value: z.id, label: z.name }))]}
          />
          <SelectField
            label="Package"
            value={form.package_id}
            onChange={(v) => setForm({ ...form, package_id: v })}
            options={[
              { value: "", label: "—" },
              ...(packages.data ?? []).map((p: any) => ({
                value: p.id,
                label: `${p.name} · ${p.speed_mbps} Mbps · ৳${p.monthly_price}`,
              })),
            ]}
          />
          <Field
            label="Monthly Bill"
            type="number"
            value={form.monthly_bill}
            onChange={(v) => setForm({ ...form, monthly_bill: v })}
          />
          <Field
            label="Billing Day (1-28)"
            type="number"
            value={String(form.billing_day)}
            onChange={(v) => setForm({ ...form, billing_day: Number(v) || 1 })}
          />
          <Field
            label="Connection Date"
            type="date"
            value={form.connection_date}
            onChange={(v) => setForm({ ...form, connection_date: v })}
          />
          <SelectField
            label="Status"
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "suspended", label: "Suspended" },
            ]}
          />
        </Section>

        <Section title="Network">
          <Field label="IP Address" value={form.ip_address} onChange={(v) => setForm({ ...form, ip_address: v })} />
          <Field label="MAC Address" value={form.mac_address} onChange={(v) => setForm({ ...form, mac_address: v })} />
          <Field label="ONU MAC" value={form.onu_mac} onChange={(v) => setForm({ ...form, onu_mac: v })} />
        </Section>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Remarks
          </label>
          <textarea
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Link
            to="/customers"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg gradient-cyan text-navy px-4 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground/80 mb-3 uppercase tracking-wider">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {required && " *"}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
