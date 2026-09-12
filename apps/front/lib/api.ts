const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3101";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: { code?: string } }).error?.code ?? `HTTP ${res.status}`,
    );
  }
  return res.json() as Promise<T>;
}

export interface AuthUser {
  id: string;
  steamId: string;
  displayName: string;
  avatarUrl: string | null;
  status: string;
  role: string;
  phone: string | null;
}

export function fetchMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/me");
}

export function logout(): Promise<{ ok: true }> {
  return apiFetch("/api/auth/logout", { method: "POST" });
}
