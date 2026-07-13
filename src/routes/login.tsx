import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { login } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Loader2, Lock, User } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — FNET Billing" },
      { name: "description", content: "Sign in to the FNET Billing System." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(username.trim(), password, remember);
      if (!u) {
        toast.error("Invalid credentials");
        return;
      }
      setUser(u);
      toast.success(`Welcome, ${u.full_name}`);
      navigate({ to: "/dashboard", replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 gradient-hero">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-cyan font-black text-2xl text-navy shadow-glow">
              F
            </div>
            <div className="text-left">
              <div className="text-3xl font-black tracking-tight text-white">FNET</div>
              <div className="text-xs text-white/70 uppercase tracking-widest">
                Billing System
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="glass-dark rounded-2xl p-6 sm:p-8 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-white">Sign in</h1>
            <p className="mt-1 text-sm text-white/70">
              Use your admin or staff credentials to continue.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                autoFocus
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg bg-white/10 border border-white/20 pl-9 pr-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-white/10 border border-white/20 pl-9 pr-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan"
                placeholder="••••••••"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-white/80 select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 accent-cyan"
            />
            Remember me
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg gradient-cyan text-navy font-bold py-2.5 shadow-glow hover:opacity-95 transition disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/60">
          © {new Date().getFullYear()} FNET Communications
        </p>
      </div>
    </div>
  );
}
