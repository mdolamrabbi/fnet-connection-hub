import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — FNET" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";

  const { data } = useQuery({
    queryKey: ["settings-company"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("v").eq("k", "company").maybeSingle();
      return (data?.v as any) ?? { name: "FNET", address: "", phone: "", email: "", logo_url: "" };
    },
  });

  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (!isAdmin) {
    return <div className="glass rounded-xl p-6 text-sm text-muted-foreground">Admin only.</div>;
  }

  if (!form) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("settings").upsert({ k: "company", v: form, updated_at: new Date().toISOString() });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["settings-company"] });
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Company information and branding.</p>
      </div>

      <form onSubmit={save} className="glass rounded-xl p-6 space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Company Name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Logo URL</span>
          <input
            value={form.logo_url ?? ""}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            placeholder="https://…"
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Phone</span>
            <input
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Email</span>
            <input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Address</span>
          <textarea
            rows={2}
            value={form.address ?? ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </label>

        {form.logo_url && (
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Logo preview</span>
            <div className="mt-2 rounded-lg border p-3 bg-background inline-block">
              <img src={form.logo_url} alt="Logo" className="h-14 w-auto" />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t">
          <button className="rounded-lg gradient-cyan text-navy px-4 py-2 text-sm font-bold">Save Settings</button>
        </div>
      </form>
    </div>
  );
}
