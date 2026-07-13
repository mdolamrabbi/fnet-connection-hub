import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_app/activity")({
  head: () => ({ meta: [{ title: "Activity Log — FNET" }] }),
  component: ActivityPage,
});

function ActivityPage() {
  const { data } = useQuery({
    queryKey: ["activity"],
    queryFn: async () =>
      (
        await supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500)
      ).data ?? [],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Activity Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last 500 events.</p>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">When</th>
                <th className="text-left px-4 py-3">Who</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((a: any) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                    {fmtDateTime(a.created_at)}
                  </td>
                  <td className="px-4 py-2.5 font-semibold">{a.actor}</td>
                  <td className="px-4 py-2.5">{a.action}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{a.details ?? "—"}</td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No activity yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
