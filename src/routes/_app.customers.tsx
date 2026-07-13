import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Download, Pencil, Trash2 } from "lucide-react";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import { useAuth } from "@/lib/auth-context";
import { logActivity } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/customers")({
  head: () => ({ meta: [{ title: "Customers — FNET" }] }),
  component: CustomersList,
});

function CustomersList() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const zones = useQuery({
    queryKey: ["zones"],
    queryFn: async () => (await supabase.from("zones").select("id, name").order("name")).data ?? [],
  });

  const { data, refetch } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select(
          "id, customer_code, name, username, phone, address, monthly_bill, status, zone:zones(id,name), package:packages(id,name,speed_mbps), created_at",
        )
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("rt-customers-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => refetch())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refetch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((c: any) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (zoneFilter !== "all" && c.zone?.id !== zoneFilter) return false;
      if (!q) return true;
      return (
        c.name?.toLowerCase().includes(q) ||
        c.customer_code?.toLowerCase().includes(q) ||
        c.username?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      );
    });
  }, [data, search, statusFilter, zoneFilter]);

  const doDelete = async (id: string, name: string) => {
    if (user?.role !== "admin") {
      toast.error("Only admin can delete customers");
      return;
    }
    if (!confirm(`Delete customer "${name}"? This also removes their payments and invoices.`)) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logActivity(user.username, "Customer Deleted", `${name}`);
    toast.success("Customer deleted");
    qc.invalidateQueries({ queryKey: ["customers"] });
  };

  const doExport = () => {
    const rows = filtered.map((c: any) => ({
      code: c.customer_code,
      name: c.name,
      username: c.username ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      zone: c.zone?.name ?? "",
      package: c.package?.name ?? "",
      monthly_bill: c.monthly_bill,
      status: c.status,
    }));
    downloadCSV(`fnet-customers-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} of {(data ?? []).length} customers
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={doExport}
            className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <Link
            to="/customers/new"
            className="inline-flex items-center gap-2 rounded-lg gradient-cyan text-navy px-3 py-2 text-sm font-bold hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add Customer
          </Link>
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, phone, username"
              className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All zones</option>
            {(zones.data ?? []).map((z: any) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Username</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Zone</th>
                <th className="text-left px-4 py-3">Package</th>
                <th className="text-right px-4 py-3">Monthly</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No customers found
                  </td>
                </tr>
              )}
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{c.customer_code}</td>
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.username ?? "—"}</td>
                  <td className="px-4 py-3">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3">{c.zone?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {c.package?.name ?? "—"}
                    {c.package?.speed_mbps && (
                      <span className="text-xs text-muted-foreground"> · {c.package.speed_mbps} Mbps</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtCurrency(c.monthly_bill)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        c.status === "active"
                          ? "bg-success/15 text-success"
                          : c.status === "suspended"
                          ? "bg-warning/15 text-warning"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to="/customers/$id"
                        params={{ id: c.id }}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      {user?.role === "admin" && (
                        <button
                          onClick={() => doDelete(c.id, c.name)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-destructive hover:bg-destructive/10"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} record{filtered.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
