import { apiFetch } from "./api";

export type DevPersona = {
  label: string;
  userId: string;
  displayName: string;
  mmr: number;
  balanceMnt: number;
  status: string;
};

export function fetchDevPersonas(): Promise<{ personas: DevPersona[] }> {
  return apiFetch("/api/dev/users");
}

export function switchDevPersona(label: string): Promise<{ ok: true }> {
  return apiFetch("/api/dev/session", {
    method: "POST",
    body: JSON.stringify({ label }),
  });
}
