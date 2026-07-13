import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("glass rounded-xl p-5", className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: "cyan" | "navy" | "success" | "warning" | "destructive";
}) {
  const accentClass =
    accent === "cyan"
      ? "gradient-cyan text-navy-foreground"
      : accent === "navy"
      ? "gradient-hero text-navy-foreground"
      : accent === "success"
      ? "bg-success/15 text-success"
      : accent === "warning"
      ? "bg-warning/15 text-warning"
      : accent === "destructive"
      ? "bg-destructive/15 text-destructive"
      : "bg-muted text-foreground";

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </div>
          <div className="mt-2 text-2xl lg:text-3xl font-black tracking-tight truncate">
            {value}
          </div>
        </div>
        {icon && (
          <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", accentClass)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
