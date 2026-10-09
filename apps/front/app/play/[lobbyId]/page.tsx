"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LobbyRoomView } from "@/components/play/lobby-room";
import { useLobbyRoom } from "@/lib/lobbies";
import { useAuth } from "@/lib/use-auth";

export default function LobbyRoomPage() {
  const { data: user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ lobbyId: string }>();
  const lobbyId = params.lobbyId;
  const canView = !!user && user.status !== "pending_phone" && !!lobbyId;
  const room = useLobbyRoom(lobbyId, canView);

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/");
    else if (user.status === "pending_phone") router.replace("/auth/phone");
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!room.error) return;
    if (room.error.message === "not_in_lobby" || room.error.message === "lobby_closed") {
      router.replace("/play");
    }
  }, [room.error, router]);

  useEffect(() => {
    if (!room.data || !user) return;
    const stillHere = room.data.players.some((player) => player.userId === user.id);
    if (!stillHere) router.replace("/play");
  }, [room.data, user, router]);

  if (isLoading || !user || user.status === "pending_phone") return null;

  return <LobbyRoomView lobbyId={lobbyId} room={room.data} isError={room.isError} />;
}
