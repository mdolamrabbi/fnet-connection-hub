import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/staff")({
  head: () => ({ meta: [{ title: "Staff — FNET" }] }),
  component: StaffPage,
});

function StaffPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";

  const { data } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () =>
      (await supabase.from("staff").select("*").order("created_at", { ascending: true })).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const blank = { username: "", password: "", full_name: "", role: "staff", status: "active", phone: "", email: "" };
  const [form, setForm] = useState<any>(blank);

  const openCreate = () => {
    setEditing(null);
    setForm(blank);
    setOpen(true);
  };
  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ ...s });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      username: form.username,
      password: form.password,
      full_name: form.full_name,
      role: form.role,
      status: form.status,
      phone: form.phone || null,
      email: form.email || null,
    };
    const { error } = editing
      ? await supabase.from("staff").update(payload).eq("id", editing.id)
      : await supabase.from("staff").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["staff-list"] });
  };

  const remove = async (s: any) => {
    if (s.role === "admin") {
      toast.error("Cannot delete admin");
      return;
    }
    if (!confirm(`Delete "${s.full_name}"?`)) return;
    const { error } = await supabase.from("staff").delete().eq("id", s.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["staff-list"] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Staff</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage system users and access.</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg gradient-cyan text-navy px-3 py-2 text-sm font-bold"
          >
            <Plus className="h-4 w-4" /> Add Staff
          </button>
        )}
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Username</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((s: any) => (
                <tr key={s.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold">{s.full_name}</td>
                  <td className="px-4 py-3">{s.username}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                        s.role === "admin" ? "gradient-cyan text-navy" : "bg-muted"
                      }`}
                    >
                      {s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        s.status === "active" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEdit(s)}
                            className="h-8 w-8 grid place-items-center rounded-md hover:bg-muted"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            disabled={s.role === "admin"}
                            onClick={() => remove(s)}
                            className="h-8 w-8 grid place-items-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={save}
            className="w-full max-w-md bg-card rounded-xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold">{editing ? "Edit" : "New"} Staff</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="block col-span-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</span>
                <input
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Username</span>
                <input
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Password</span>
                <input
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Role</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Phone</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
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
