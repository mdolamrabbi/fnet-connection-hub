import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/zones")({
  head: () => ({ meta: [{ title: "Zones — FNET" }] }),
  component: ZonesPage,
});

function ZonesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";

  const { data } = useQuery({
    queryKey: ["zones-all"],
    queryFn: async () => {
      const [z, c] = await Promise.all([
        supabase.from("zones").select("*").order("name"),
        supabase.from("customers").select("zone_id"),
      ]);
      const counts = new Map<string, number>();
      (c.data ?? []).forEach((r: any) => {
        if (r.zone_id) counts.set(r.zone_id, (counts.get(r.zone_id) ?? 0) + 1);
      });
      return (z.data ?? []).map((zone: any) => ({ ...zone, customer_count: counts.get(zone.id) ?? 0 }));
    },
  });

  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setOpen(true);
  };
  const openEdit = (z: any) => {
    setEditing(z);
    setForm({ name: z.name, description: z.description ?? "" });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name, description: form.description || null };
    const { error } = editing
      ? await supabase.from("zones").update(payload).eq("id", editing.id)
      : await supabase.from("zones").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["zones-all"] });
    qc.invalidateQueries({ queryKey: ["zones"] });
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete zone "${name}"?`)) return;
    const { error } = await supabase.from("zones").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["zones-all"] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Zones</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organize customers by service area.</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg gradient-cyan text-navy px-3 py-2 text-sm font-bold"
          >
            <Plus className="h-4 w-4" /> Add Zone
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((z: any) => (
          <div key={z.id} className="glass rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold">{z.name}</div>
                {z.description && <p className="text-sm text-muted-foreground mt-0.5">{z.description}</p>}
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <button onClick={() => openEdit(z)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(z.id, z.name)}
                    className="h-8 w-8 grid place-items-center rounded-md text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 text-sm">
              <span className="font-bold">{z.customer_count}</span>
              <span className="text-muted-foreground"> customer{z.customer_count === 1 ? "" : "s"}</span>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={save}
            className="w-full max-w-md bg-card rounded-xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold">{editing ? "Edit" : "New"} Zone</h3>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Description</span>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-3 py-2 text-sm">
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
