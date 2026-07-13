import { supabase } from "@/integrations/supabase/client";

const COOKIE = "fnet_session";

export type SessionUser = {
  id: string;
  username: string;
  role: "admin" | "staff";
  full_name: string;
};

export function readCookie(): SessionUser | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(COOKIE + "="));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split("=")[1])) as SessionUser;
  } catch {
    return null;
  }
}

export function writeCookie(user: SessionUser, remember: boolean) {
  const value = encodeURIComponent(JSON.stringify(user));
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  document.cookie = `${COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearCookie() {
  document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export async function login(
  username: string,
  password: string,
  remember: boolean,
): Promise<SessionUser | null> {
  const { data, error } = await supabase
    .from("staff")
    .select("id, username, role, full_name, status, password")
    .eq("username", username)
    .maybeSingle();
  if (error || !data) return null;
  if (data.status !== "active") return null;
  if (data.password !== password) return null;
  const user: SessionUser = {
    id: data.id,
    username: data.username,
    role: data.role as "admin" | "staff",
    full_name: data.full_name,
  };
  writeCookie(user, remember);
  await logActivity(user.username, "Login", `Signed in as ${user.role}`);
  return user;
}

export async function logout(username?: string) {
  if (username) await logActivity(username, "Logout", "Signed out");
  clearCookie();
}

export async function logActivity(actor: string, action: string, details?: string) {
  try {
    await supabase.from("activity_logs").insert({ actor, action, details: details ?? null });
  } catch {
    // ignore
  }
}
