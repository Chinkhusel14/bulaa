"use client";

import type {
  LobbyIdResponse,
  LobbyListResponse,
  LobbyRoom,
  LobbyRoomMessage,
  LobbySnapshotMessage,
  MapId,
  Side,
} from "@bulaa/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { API_URL, apiFetch } from "./api";

export const LOBBIES_QUERY_KEY = ["lobbies"] as const;

export function roomQueryKey(lobbyId: string) {
  return ["lobby-room", lobbyId] as const;
}

const LOBBIES_WS_URL = (() => {
  const url = new URL("/ws/lobbies", API_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
})();

function roomWsUrl(lobbyId: string): string {
  const url = new URL(`/ws/lobbies/${lobbyId}`, API_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function fetchLobbies(): Promise<LobbyListResponse> {
  return apiFetch<LobbyListResponse>("/api/lobbies");
}

export function fetchRoom(lobbyId: string): Promise<LobbyRoom> {
  return apiFetch<LobbyRoom>(`/api/lobbies/${lobbyId}`);
}

export function createLobby(prizePoolMnt: number): Promise<LobbyIdResponse> {
  return apiFetch("/api/lobbies", {
    method: "POST",
    body: JSON.stringify({ prizePoolMnt }),
  });
}

export function joinLobby(id: string): Promise<LobbyIdResponse> {
  return apiFetch(`/api/lobbies/${id}/join`, { method: "POST" });
}

export function leaveLobby(id: string): Promise<{ ok: true }> {
  return apiFetch(`/api/lobbies/${id}/leave`, { method: "POST" });
}

export function moveLobbySide(id: string, side: Side): Promise<{ ok: true }> {
  return apiFetch(`/api/lobbies/${id}/side`, {
    method: "POST",
    body: JSON.stringify({ side }),
  });
}

export function setLobbyReady(id: string, ready: boolean): Promise<{ ok: true }> {
  return apiFetch(`/api/lobbies/${id}/ready`, {
    method: "POST",
    body: JSON.stringify({ ready }),
  });
}

export function acceptLobby(id: string): Promise<{ ok: true }> {
  return apiFetch(`/api/lobbies/${id}/accept`, { method: "POST" });
}

export function declineLobby(id: string): Promise<{ ok: true }> {
  return apiFetch(`/api/lobbies/${id}/decline`, { method: "POST" });
}

export function postLobbyMessage(id: string, body: string): Promise<{ ok: true }> {
  return apiFetch(`/api/lobbies/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function startLobbyVote(id: string, targetUserId: string): Promise<{ ok: true }> {
  return apiFetch(`/api/lobbies/${id}/votes`, {
    method: "POST",
    body: JSON.stringify({ targetUserId }),
  });
}

export function castLobbyBallot(
  id: string,
  voteId: string,
  yes: boolean,
): Promise<{ ok: true }> {
  return apiFetch(`/api/lobbies/${id}/votes/${voteId}`, {
    method: "POST",
    body: JSON.stringify({ yes }),
  });
}

export function vetoLobbyMap(id: string, map: MapId): Promise<{ ok: true }> {
  return apiFetch(`/api/lobbies/${id}/veto`, {
    method: "POST",
    body: JSON.stringify({ map }),
  });
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

export function useLobbyRoom(lobbyId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: roomQueryKey(lobbyId),
    queryFn: () => fetchRoom(lobbyId),
    enabled,
  });

  useEffect(() => {
    if (!enabled) return;
    const socket = new WebSocket(roomWsUrl(lobbyId));
    socket.onmessage = (event: MessageEvent<string>) => {
      let message: LobbyRoomMessage;
      try {
        message = JSON.parse(event.data) as LobbyRoomMessage;
      } catch {
        return;
      }
      if (message.type !== "room") return;
      queryClient.setQueryData(roomQueryKey(lobbyId), message.room);
    };
    return () => socket.close();
  }, [enabled, lobbyId, queryClient]);

  return query;
}