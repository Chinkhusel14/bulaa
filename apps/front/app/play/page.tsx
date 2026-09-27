"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LobbyBrowser } from "@/components/play/lobby-browser";
import { PlayHeader } from "@/components/play/play-header";
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
    <div className="flex min-h-dvh flex-col bg-void">
      <PlayHeader
        user={user}
        balanceMnt={lobbies.data?.viewer.balanceMnt ?? null}
      />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <LobbyBrowser user={user} data={lobbies.data} isError={lobbies.isError} />
      </main>
    </div>
  );
}
