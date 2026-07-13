import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    navigate({ to: user ? "/dashboard" : "/login", replace: true });
  }, [user, loading, navigate]);
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="glass rounded-2xl px-8 py-6 text-center">
        <div className="text-3xl font-black text-gradient-cyan">FNET</div>
        <div className="mt-2 text-sm text-muted-foreground">Loading…</div>
      </div>
    </div>
  );
}
