"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LobbyScout } from "@/components/play/lobby-scout";
import { useLobbies } from "@/lib/lobbies";
import { useAuth } from "@/lib/use-auth";

export default function PlayPage() {
  const { data: user, isLoading } = useAuth();
  const router = useRouter();
  const canView = !!user && user.status !== "pending_phone";
  const lobbies = useLobbies(canView);

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/");
    else if (user.status === "pending_phone") router.replace("/auth/phone");
  }, [isLoading, user, router]);

  if (isLoading || !user || user.status === "pending_phone") return null;

  return (
    <LobbyScout
      user={user}
      data={lobbies.data}
      isError={lobbies.isError}
      flashIds={lobbies.flashIds}
    />
  );
}
