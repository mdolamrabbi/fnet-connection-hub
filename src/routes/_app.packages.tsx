import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { fmtCurrency } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/packages")({
  head: () => ({ meta: [{ title: "Packages — FNET" }] }),
  component: PackagesPage,
});

function PackagesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";

  const { data } = useQuery({
    queryKey: ["packages"],
    queryFn: async () =>
      (await supabase.from("packages").select("*").order("speed_mbps")).data ?? [],
  });

  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const blank = { name: "", speed_mbps: 10, monthly_price: 500, description: "" };
  const [form, setForm] = useState<any>(blank);

  const openCreate = () => {
    setForm(blank);
    setEditing(null);
    setCreating(true);
  };
  const openEdit = (p: any) => {
    setForm(p);
    setEditing(p);
    setCreating(true);
  };
  const close = () => setCreating(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      speed_mbps: Number(form.speed_mbps),
      monthly_price: Number(form.monthly_price),
      description: form.description || null,
    };
    const { error } = editing
      ? await supabase.from("packages").update(payload).eq("id", editing.id)
      : await supabase.from("packages").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Package updated" : "Package added");
    close();
    qc.invalidateQueries({ queryKey: ["packages"] });
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete package "${name}"?`)) return;
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["packages"] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Packages</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage internet plans and pricing.</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg gradient-cyan text-navy px-3 py-2 text-sm font-bold"
          >
            <Plus className="h-4 w-4" /> Add Package
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(data ?? []).map((p: any) => (
          <div key={p.id} className="glass rounded-xl p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.name}</div>
            <div className="mt-1 text-3xl font-black text-gradient-cyan">{p.speed_mbps} Mbps</div>
            <div className="mt-2 text-2xl font-bold">{fmtCurrency(p.monthly_price)}</div>
            <div className="text-xs text-muted-foreground">per month</div>
            {p.description && <p className="mt-2 text-xs text-muted-foreground">{p.description}</p>}
            {isAdmin && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEdit(p)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => remove(p.id, p.name)}
                  className="inline-flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 px-2 py-1.5"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={close}>
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold">{editing ? "Edit" : "New"} Package</h3>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Speed (Mbps)</span>
                <input
                  required
                  type="number"
                  value={form.speed_mbps}
                  onChange={(e) => setForm({ ...form, speed_mbps: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Monthly Price</span>
                <input
                  required
                  type="number"
                  value={form.monthly_price}
                  onChange={(e) => setForm({ ...form, monthly_price: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Description</span>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={close} className="rounded-lg border px-3 py-2 text-sm">
                Cancel
              </button>
              <button className="rounded-lg gradient-cyan text-navy px-3 py-2 text-sm font-bold">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
