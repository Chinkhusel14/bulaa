"use client";

import { timer } from "@bulaa/design";
import type { LobbyRoom, LobbyRoomPlayer, MapId, Side } from "@bulaa/shared";
import {
  CHAT_MAX_LENGTH,
  MAP_DISPLAY_NAMES,
  MAP_POOL,
  SIDE_SIZE,
  VOTE_MIN_MEMBERS,
  VETO_STEPS,
} from "@bulaa/shared/constants";
import { Button, cn } from "@bulaa/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  acceptLobby,
  castLobbyBallot,
  declineLobby,
  leaveLobby,
  moveLobbySide,
  postLobbyMessage,
  roomQueryKey,
  setLobbyReady,
  startLobbyVote,
  vetoLobbyMap,
} from "@/lib/lobbies";
import {
  ActionError,
  LobbiesLoadError,
  LobbiesLoading,
  Money,
  TierBadge,
  errorCopy,
  useNow,
  type Copy,
} from "./lobby-kit";

const STEAM_ID = /^7656119\d{10}$/;

function secondsLeft(deadline: string | null, now: number): number | null {
  if (!deadline) return null;
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - now) / 1000));
}

function timerClass(seconds: number): string {
  if (seconds <= timer.dangerAt) return "text-danger";
  if (seconds <= timer.warningAt) return "text-warning";
  return "text-text";
}

function sideLabel(side: Side): Copy {
  return side === "a"
    ? { mn: "А баг", en: "Team A" }
    : { mn: "Б баг", en: "Team B" };
}

function actionLabel(action: "ban" | "pick" | "decider"): Copy {
  switch (action) {
    case "ban":
      return { mn: "Хориглох", en: "Ban" };
    case "pick":
      return { mn: "Сонгох", en: "Pick" };
    case "decider":
      return { mn: "Шийдвэрлэгч", en: "Decider" };
    default: {
      const unhandled: never = action;
      return unhandled;
    }
  }
}

function PlayerName({ player }: { player: LobbyRoomPlayer }) {
  if (STEAM_ID.test(player.steamId)) {
    return (
      <a
        href={`https://steamcommunity.com/profiles/${player.steamId}`}
        target="_blank"
        rel="noreferrer"
        className="text-text hover:text-accent truncate text-[14px]"
      >
        {player.displayName}
      </a>
    );
  }
  return <span className="text-text truncate text-[14px]">{player.displayName}</span>;
}

export function LobbyRoomView({
  lobbyId,
  room,
  isError,
}: {
  lobbyId: string;
  room: LobbyRoom | undefined;
  isError: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const now = useNow(250);
  const [error, setError] = useState<Copy | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<unknown>): Promise<boolean> {
    setPending(key);
    setError(null);
    try {
      await action();
      await queryClient.invalidateQueries({ queryKey: roomQueryKey(lobbyId) });
      return true;
    } catch (e: unknown) {
      setError(errorCopy(e instanceof Error ? e.message : ""));
      return false;
    } finally {
      setPending(null);
    }
  }

  if (isError) return <LobbiesLoadError />;
  if (!room) return <LobbiesLoading />;

  const viewer = room.players.find((p) => p.userId === room.viewerUserId);
  const canLeave = room.status === "open" || room.status === "accepting";
  const showReady = room.status === "open";
  const showVeto = room.status === "veto" || room.status === "awaiting_server";

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-text text-2xl font-semibold">Лобби өрөө</h1>
          <p className="text-text-muted mt-1 text-[13px]">Lobby room</p>
          <p className="tabular-money mt-2 text-[15px] font-medium">
            <Money amount={room.prizePoolMnt} />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canLeave && (
            <Button
              variant="secondary"
              onClick={async () => {
                if (await run("leave", () => leaveLobby(lobbyId))) router.push("/play");
              }}
              disabled={pending !== null}
            >
              {pending === "leave" ? "Гарч байна..." : "Гарах / Leave"}
            </Button>
          )}
          {showReady && viewer && (
            <Button
              onClick={() => run("ready", () => setLobbyReady(lobbyId, !viewer.ready))}
              disabled={pending !== null}
              variant={viewer.ready ? "secondary" : "default"}
            >
              {viewer.ready ? "Цуцлах / Unready" : "Бэлэн / Ready"}
            </Button>
          )}
        </div>
      </header>

      {error && <ActionError error={error} />}
      {room.vote && (
        <VoteBanner
          room={room}
          now={now}
          busy={pending !== null}
          onBallot={(yes) =>
            run(yes ? "yes" : "no", () => castLobbyBallot(lobbyId, room.vote!.id, yes))
          }
        />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)]">
        <TeamColumn
          side="a"
          room={room}
          viewer={viewer}
          busy={pending !== null}
          onMove={() => run("side-a", () => moveLobbySide(lobbyId, "a"))}
          onVote={(userId) => run("vote", () => startLobbyVote(lobbyId, userId))}
        />
        <section className="flex min-h-80 flex-col gap-3">
          {showVeto ? (
            <>
              <VetoBoard
                room={room}
                viewer={viewer}
                busy={pending !== null}
                onPick={(map) => run("veto", () => vetoLobbyMap(lobbyId, map))}
              />
              <ChatPanel
                room={room}
                compact
                busy={pending !== null}
                onSend={(body) => run("chat", () => postLobbyMessage(lobbyId, body))}
              />
            </>
          ) : (
            <ChatPanel
              room={room}
              compact={false}
              busy={pending !== null}
              onSend={(body) => run("chat", () => postLobbyMessage(lobbyId, body))}
            />
          )}
        </section>
        <TeamColumn
          side="b"
          room={room}
          viewer={viewer}
          busy={pending !== null}
          onMove={() => run("side-b", () => moveLobbySide(lobbyId, "b"))}
          onVote={(userId) => run("vote", () => startLobbyVote(lobbyId, userId))}
        />
      </div>

      {room.status === "accepting" && (
        <AcceptDialog
          room={room}
          viewer={viewer}
          now={now}
          busy={pending !== null}
          onAccept={() => run("accept", () => acceptLobby(lobbyId))}
          onDecline={() => run("decline", () => declineLobby(lobbyId))}
        />
      )}
    </div>
  );
}

function TeamColumn({
  side,
  room,
  viewer,
  busy,
  onMove,
  onVote,
}: {
  side: Side;
  room: LobbyRoom;
  viewer: LobbyRoomPlayer | undefined;
  busy: boolean;
  onMove: () => void;
  onVote: (userId: string) => void;
}) {
  const members = room.players.filter((p) => p.side === side).sort((a, b) => a.slot - b.slot);
  const label = sideLabel(side);
  const canMove =
    room.status === "open" &&
    viewer !== undefined &&
    viewer.side !== side &&
    members.length < SIDE_SIZE;
  const canVote =
    (room.status === "open" || room.status === "accepting") &&
    room.players.length >= VOTE_MIN_MEMBERS &&
    room.vote === null;

  return (
    <section className="border-border bg-raised flex flex-col gap-2 rounded-md border p-3">
      <header>
        <h2 className="text-text text-[15px] font-medium">{label.mn}</h2>
        <p className="text-text-muted text-[12px]">
          {label.en} · {members.length}/{SIDE_SIZE}
        </p>
      </header>
      <ol className="flex flex-col gap-1.5">
        {Array.from({ length: SIDE_SIZE }, (_, slot) => {
          const player = members[slot];
          if (player) {
            return (
              <li key={player.userId}>
                <PlayerCard
                  player={player}
                  showVote={canVote && player.userId !== room.viewerUserId}
                  busy={busy}
                  onVote={() => onVote(player.userId)}
                />
              </li>
            );
          }
          return (
            <li key={`empty-${side}-${slot}`}>
              {canMove ? (
                <button
                  type="button"
                  onClick={onMove}
                  disabled={busy}
                  className="border-border text-text-faint hover:border-border-strong hover:bg-overlay flex h-14 w-full items-center justify-center rounded-sm border border-dashed text-[12px]"
                >
                  Шилжих / Join this side
                </button>
              ) : (
                <div className="border-border bg-base text-text-faint flex h-14 items-center justify-center rounded-sm border border-dashed text-[12px]">
                  Сул / Open
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function PlayerCard({
  player,
  showVote,
  busy,
  onVote,
}: {
  player: LobbyRoomPlayer;
  showVote: boolean;
  busy: boolean;
  onVote: () => void;
}) {
  return (
    <div className="border-border bg-base flex items-center gap-2 rounded-sm border px-2 py-1.5">
      {player.avatarUrl ? (
        <img
          src={player.avatarUrl}
          alt=""
          className="border-border size-8 rounded-sm border"
        />
      ) : (
        <span className="bg-overlay border-border size-8 rounded-sm border" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <PlayerName player={player} />
          {player.host && <span className="text-text-faint text-[10px]">HOST</span>}
          {player.captain && <span className="text-primary text-[10px]">C</span>}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <TierBadge label={player.tier} band={player.tierBand} />
          {player.ready && <span className="text-primary text-[11px]">Ready</span>}
        </div>
      </div>
      {showVote && (
        <Button variant="ghost" size="sm" onClick={onVote} disabled={busy}>
          Хөөх
        </Button>
      )}
    </div>
  );
}

function ChatPanel({
  room,
  compact,
  busy,
  onSend,
}: {
  room: LobbyRoom;
  compact: boolean;
  busy: boolean;
  onSend: (body: string) => Promise<boolean>;
}) {
  const [body, setBody] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const chatOk =
    room.status === "open" ||
    room.status === "accepting" ||
    room.status === "veto" ||
    room.status === "awaiting_server";

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [room.messages.length]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next = body.trim();
    if (!next) return;
    if (await onSend(next)) setBody("");
  }

  return (
    <div
      className={cn(
        "border-border bg-raised flex flex-col rounded-md border",
        compact ? "h-48" : "min-h-80 flex-1",
      )}
    >
      <div className="border-border border-b px-3 py-2">
        <p className="text-text text-[13px]">Чат</p>
        <p className="text-text-muted text-[12px]">Chat</p>
      </div>
      <div ref={scroller} className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-2">
        {room.messages.length === 0 ? (
          <p className="text-text-faint text-[12px]">Мессеж алга. / No messages yet.</p>
        ) : (
          room.messages.map((message) => (
            <p key={message.id} className="text-[13px]">
              <span className="text-text-muted mr-2">{message.displayName}</span>
              <span className="text-text break-words">{message.body}</span>
            </p>
          ))
        )}
      </div>
      {chatOk && (
        <form onSubmit={handleSubmit} className="border-border flex gap-2 border-t p-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, CHAT_MAX_LENGTH))}
            maxLength={CHAT_MAX_LENGTH}
            placeholder="Бичих / Type"
            className="border-border bg-base text-text placeholder:text-text-faint h-9 min-w-0 flex-1 rounded-sm border px-2 text-[13px] outline-none"
          />
          <Button type="submit" size="sm" disabled={busy || body.trim() === ""}>
            Илгээх
          </Button>
        </form>
      )}
    </div>
  );
}

function VoteBanner({
  room,
  now,
  busy,
  onBallot,
}: {
  room: LobbyRoom;
  now: number;
  busy: boolean;
  onBallot: (yes: boolean) => void;
}) {
  const vote = room.vote;
  if (!vote) return null;
  const target = room.players.find((p) => p.userId === vote.targetUserId);
  const left = secondsLeft(vote.endsAt, now) ?? 0;
  const canBallot = vote.myBallot === null && room.viewerUserId !== vote.targetUserId;
  return (
    <div className="border-border-strong bg-raised flex flex-col gap-2 rounded-md border px-4 py-3">
      <p className="text-text text-[15px]">
        {target?.displayName ?? "Тоглогч"}-г гаргах санал
      </p>
      <p className="text-text-muted text-[13px]">Vote kick in progress</p>
      <div className="flex flex-wrap items-center gap-3 text-[13px]">
        <span className="text-text">
          Тийм / Yes {vote.yesCount}/{vote.threshold}
        </span>
        <span className={cn("font-mono tabular-nums", timerClass(left))}>{left}s</span>
        {canBallot && (
          <>
            <Button size="sm" onClick={() => onBallot(true)} disabled={busy}>
              Тийм / Yes
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onBallot(false)} disabled={busy}>
              Үгүй / No
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function VetoBoard({
  room,
  viewer,
  busy,
  onPick,
}: {
  room: LobbyRoom;
  viewer: LobbyRoomPlayer | undefined;
  busy: boolean;
  onPick: (map: MapId) => void;
}) {
  const step = VETO_STEPS[room.vetoStep];
  const used = new Map(room.mapActions.map((action) => [action.map, action]));
  const actingSide = step && "side" in step ? step.side : null;
  const canAct =
    room.status === "veto" &&
    viewer?.captain === true &&
    viewer.side === actingSide &&
    step !== undefined &&
    "action" in step &&
    step.action !== "decider";
  const banner = step
    ? "side" in step
      ? {
          mn: `${sideLabel(step.side).mn} · ${actionLabel(step.action).mn}`,
          en: `${sideLabel(step.side).en} ${actionLabel(step.action).en}`,
        }
      : actionLabel("decider")
    : { mn: "Газрын самбар", en: "Map board" };

  return (
    <div className="border-border bg-raised flex flex-col gap-3 rounded-md border p-3">
      <header>
        <p className="text-text text-[15px]">{banner.mn}</p>
        <p className="text-text-muted text-[12px]">{banner.en}</p>
        {room.phaseDeadline && room.status === "veto" && (
          <Countdown deadline={room.phaseDeadline} />
        )}
      </header>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MAP_POOL.map((map) => {
          const stamp = used.get(map);
          const open = stamp === undefined;
          return (
            <li key={map}>
              <button
                type="button"
                disabled={!canAct || !open || busy}
                onClick={() => onPick(map)}
                className={cn(
                  "flex h-16 w-full flex-col items-start justify-center rounded-sm border px-3 text-left",
                  open
                    ? "border-border hover:border-border-strong hover:bg-overlay"
                    : "border-border bg-base opacity-70",
                  canAct && open ? "cursor-pointer" : "cursor-default",
                )}
              >
                <span className="text-text text-[14px]">{MAP_DISPLAY_NAMES[map]}</span>
                {stamp && (
                  <span className="text-text-muted text-[11px]">
                    {actionLabel(stamp.action).en}
                    {stamp.side ? ` · ${sideLabel(stamp.side).en}` : ""}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Countdown({ deadline }: { deadline: string }) {
  const now = useNow(250);
  const left = secondsLeft(deadline, now) ?? 0;
  return (
    <p className={cn("mt-1 font-mono text-[13px] tabular-nums", timerClass(left))}>{left}s</p>
  );
}

function AcceptDialog({
  room,
  viewer,
  now,
  busy,
  onAccept,
  onDecline,
}: {
  room: LobbyRoom;
  viewer: LobbyRoomPlayer | undefined;
  now: number;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const left = secondsLeft(room.phaseDeadline, now) ?? 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="accept-title"
      className="border-border-strong bg-raised text-text backdrop:bg-void/80 m-auto w-[min(400px,calc(100%-2rem))] rounded-md border p-0"
      onCancel={(event) => event.preventDefault()}
    >
      <div className="flex flex-col gap-4 p-5">
        <header>
          <h2 id="accept-title" className="font-display text-[24px] font-semibold leading-[30px]">
            Тоглолтыг зөвшөөрөх
          </h2>
          <p className="text-text-muted text-[13px]">Accept the match</p>
          <p className={cn("mt-2 font-mono text-[20px] tabular-nums", timerClass(left))}>
            {left}s
          </p>
        </header>
        <p className="text-text-muted text-[13px]">
          {viewer?.accepted
            ? "Хүлээгээд байна. Waiting for the others."
            : "Бүх 10 тоглогч зөвшөөрсөнөөр газрын сонголт эхэлнэ."}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onDecline} disabled={busy}>
            Татгалзах / Decline
          </Button>
          {viewer?.accepted ? (
            <p className="text-text-muted flex flex-1 items-center text-[13px]">
              Хүлээгээд байна / Waiting
            </p>
          ) : (
            <Button type="button" className="flex-1" onClick={onAccept} disabled={busy}>
              Зөвшөөрөх / Accept
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}
