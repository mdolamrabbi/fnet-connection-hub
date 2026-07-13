import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Users,
  Package,
  MapPin,
  Wallet,
  FileText,
  UsersRound,
  BarChart3,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

type NavItem = { to: string; label: string; icon: typeof Users; adminOnly?: boolean };

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/packages", label: "Packages", icon: Package },
  { to: "/zones", label: "Zones", icon: MapPin },
  { to: "/staff", label: "Staff", icon: UsersRound, adminOnly: true },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/activity", label: "Activity Log", icon: Activity, adminOnly: true },
  { to: "/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = NAV.filter((n) => !n.adminOnly || user?.role === "admin");

  const doLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 gradient-hero text-sidebar-foreground transform transition-transform lg:translate-x-0 lg:static lg:flex-shrink-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg gradient-cyan font-black text-navy">
                F
              </div>
              <span className="text-xl font-black tracking-tight">FNET</span>
            </Link>
            <button
              className="lg:hidden text-sidebar-foreground/80"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {items.map((item) => {
              const active =
                pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full gradient-cyan font-bold text-navy">
                {user?.full_name?.[0] ?? "?"}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{user?.full_name}</div>
                <div className="truncate text-xs text-sidebar-foreground/70 capitalize">
                  {user?.role}
                </div>
              </div>
            </div>
            <button
              onClick={doLogout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 text-sm font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur-md px-4 lg:px-6">
          <button
            className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-semibold text-muted-foreground">
            FNET Billing System
          </h1>
          <div className="ml-auto text-xs text-muted-foreground hidden sm:block">
            Signed in as <span className="font-semibold text-foreground">{user?.username}</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-full">{children}</main>
      </div>
    </div>
  );
}
