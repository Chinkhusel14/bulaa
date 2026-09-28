"use client";

import type { LobbyListResponse, LobbySnapshotMessage } from "@bulaa/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { API_URL, apiFetch } from "./api";

export const LOBBIES_QUERY_KEY = ["lobbies"] as const;

const LOBBIES_WS_URL = (() => {
  const url = new URL("/ws/lobbies", API_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
})();

export function fetchLobbies(): Promise<LobbyListResponse> {
  return apiFetch<LobbyListResponse>("/api/lobbies");
}

export function createLobby(prizePoolMnt: number): Promise<{ ok: true }> {
  return apiFetch("/api/lobbies", {
    method: "POST",
    body: JSON.stringify({ prizePoolMnt }),
  });
}

export function joinLobby(id: string): Promise<{ ok: true }> {
  return apiFetch(`/api/lobbies/${id}/join`, { method: "POST" });
}

export function leaveLobby(id: string): Promise<{ ok: true }> {
  return apiFetch(`/api/lobbies/${id}/leave`, { method: "POST" });
}

/** Paints from GET, then swaps in live public rows while keeping the viewer's own fields. */
export function useLobbies(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: LOBBIES_QUERY_KEY,
    queryFn: fetchLobbies,
    enabled,
  });

  useEffect(() => {
    if (!enabled) return;
    const socket = new WebSocket(LOBBIES_WS_URL);
    socket.onmessage = (event: MessageEvent<string>) => {
      let message: LobbySnapshotMessage;
      try {
        message = JSON.parse(event.data) as LobbySnapshotMessage;
      } catch {
        return;
      }
      if (message.type !== "snapshot") return;
      queryClient.setQueryData<LobbyListResponse>(LOBBIES_QUERY_KEY, (prev) =>
        prev ? { ...prev, lobbies: message.lobbies } : prev,
      );
    };
    return () => socket.close();
  }, [enabled, queryClient]);

  return query;
}
