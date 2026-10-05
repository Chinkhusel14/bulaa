"use client";

import { prizePoolMntSchema } from "@bulaa/shared";
import {
  LOBBY_PRIZE_POOL_MAX_MNT,
  LOBBY_PRIZE_POOL_MIN_MNT,
  LOBBY_SEAT_COUNT,
  lobbyCostMnt,
  prizeShareMnt,
  winnerPayoutMnt,
} from "@bulaa/shared/constants";
import { Button, cn } from "@bulaa/ui";
import { X } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ActionError, Money, type Copy, type LobbyActions } from "./lobby-kit";

type Step = "prize" | "confirm";

const PRESETS = [30_000, 50_000, 100_000, 250_000, 500_000] as const;

const STEP_COPY: Record<Step, Copy> = {
  prize: { mn: "Шагналын сан", en: "Prize pool" },
  confirm: { mn: "Баталгаажуулах", en: "Confirm" },
};

function prizePoolIssue(value: number | null): Copy | null {
  if (value === null) return { mn: "Дүн оруулна уу.", en: "Enter an amount." };
  const result = prizePoolMntSchema.safeParse(value);
  if (result.success) return null;
  const code = result.error.issues[0]?.code;
  if (code === "too_small")
    return {
      mn: (
        <>
          Хамгийн багадаа <Money amount={LOBBY_PRIZE_POOL_MIN_MNT} />.
        </>
      ),
      en: "Below the minimum prize pool.",
    };
  if (code === "too_big")
    return {
      mn: (
        <>
          Хамгийн ихдээ <Money amount={LOBBY_PRIZE_POOL_MAX_MNT} />.
        </>
      ),
      en: "Above the maximum prize pool.",
    };
  return {
    mn: `${LOBBY_SEAT_COUNT}-т хуваагдах дүн оруулна уу.`,
    en: `Use an amount that splits evenly across ${LOBBY_SEAT_COUNT} players.`,
  };
}

export function CreateLobbyWizard({
  serverFeeMnt,
  balanceMnt,
  actions,
  onClose,
}: {
  serverFeeMnt: number;
  balanceMnt: number;
  actions: LobbyActions;
  onClose: () => void;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>("prize");
  const [digits, setDigits] = useState(String(LOBBY_PRIZE_POOL_MIN_MNT));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector("input")?.focus();
  }, []);

  const prizePool = digits === "" ? null : Number(digits);
  const issue = prizePoolIssue(prizePool);
  const valid = issue === null && prizePool !== null;
  const cost = valid ? lobbyCostMnt(prizePool, serverFeeMnt) : null;
  const shortfall = cost !== null && balanceMnt < cost;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) return;
    switch (step) {
      case "prize":
        setStep("confirm");
        return;
      case "confirm":
        if (shortfall) return;
        const lobbyId = await actions.create(prizePool);
        if (lobbyId) {
          onClose();
          router.push(`/play/${lobbyId}`);
        }
        return;
      default: {
        const unhandled: never = step;
        return unhandled;
      }
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="create-lobby-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="border-border-strong bg-raised text-text backdrop:bg-void/80 m-auto w-[min(440px,calc(100%-2rem))] rounded-md border p-0"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-text-faint font-mono text-[12px] tabular-nums">
              {step === "prize" ? 1 : 2}/2 · {STEP_COPY[step].en}
            </p>
            <h2
              id="create-lobby-title"
              className="font-display text-[24px] font-semibold leading-[30px]"
            >
              {step === "prize" ? "Лобби үүсгэх" : STEP_COPY.confirm.mn}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Хаах"
          >
            <X weight="bold" />
          </Button>
        </header>

        {step === "prize" ? (
          <PrizeStep
            digits={digits}
            onDigits={setDigits}
            issue={issue}
            prizePool={valid ? prizePool : null}
            serverFeeMnt={serverFeeMnt}
          />
        ) : (
          valid && (
            <ConfirmStep
              prizePool={prizePool}
              serverFeeMnt={serverFeeMnt}
              balanceMnt={balanceMnt}
            />
          )
        )}

        {step === "confirm" && actions.error && <ActionError error={actions.error} />}

        <footer className="flex gap-2">
          {step === "prize" ? (
            <Button type="button" variant="ghost" onClick={onClose}>
              Цуцлах
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep("prize")}
              disabled={actions.busy}
            >
              Буцах
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={!valid || actions.busy || (step === "confirm" && shortfall)}
          >
            {step === "prize"
              ? "Үргэлжлүүлэх"
              : actions.pendingKey === "create"
                ? "Үүсгэж байна..."
                : "Үүсгэх"}
          </Button>
        </footer>
      </form>
    </dialog>
  );
}

function PrizeStep({
  digits,
  onDigits,
  issue,
  prizePool,
  serverFeeMnt,
}: {
  digits: string;
  onDigits: (digits: string) => void;
  issue: Copy | null;
  prizePool: number | null;
  serverFeeMnt: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-text-muted text-[13px]">
          Шагналын сан / Prize pool, MNT
        </span>
        <input
          inputMode="numeric"
          value={digits === "" ? "" : Number(digits).toLocaleString("en-US")}
          onChange={(e) => onDigits(e.target.value.replace(/\D/g, "").slice(0, 7))}
          aria-invalid={issue !== null}
          aria-describedby="prize-pool-hint"
          className={cn(
            "tabular-money bg-base h-12 rounded-md border px-3 text-[20px] font-medium outline-none",
            issue ? "border-danger" : "border-border focus:border-border-strong",
          )}
        />
      </label>

      <div className="flex flex-wrap gap-1" aria-label="Presets">
        {PRESETS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => onDigits(String(amount))}
            className={cn(
              "h-8 rounded-sm border px-2.5 text-[13px] transition-colors",
              prizePool === amount
                ? "border-border-strong bg-overlay"
                : "border-border hover:bg-overlay",
            )}
          >
            <Money amount={amount} />
          </button>
        ))}
      </div>

      <div id="prize-pool-hint" className="min-h-10 text-[13px]">
        {issue ? (
          <div className="flex flex-col gap-0.5" role="alert">
            <p className="text-danger">{issue.mn}</p>
            <p className="text-text-muted text-[12px]">{issue.en}</p>
          </div>
        ) : (
          prizePool !== null && (
            <p className="text-text-muted">
              Тоглогч бүр <Money amount={prizeShareMnt(prizePool)} /> +{" "}
              <Money amount={serverFeeMnt} /> серверийн төлбөр. Ялагч бүр{" "}
              <Money amount={winnerPayoutMnt(prizePool)} /> авна.
            </p>
          )
        )}
      </div>
    </div>
  );
}

function ConfirmStep({
  prizePool,
  serverFeeMnt,
  balanceMnt,
}: {
  prizePool: number;
  serverFeeMnt: number;
  balanceMnt: number;
}) {
  const cost = lobbyCostMnt(prizePool, serverFeeMnt);
  const after = balanceMnt - cost;
  return (
    <div className="flex flex-col gap-4">
      <dl className="flex flex-col gap-2 text-[13px]">
        <Row label="Шагналын сан / Prize pool">
          <Money amount={prizePool} className="text-[15px] font-medium" />
        </Row>
        <Row label="Ялагч бүрт / Each winner gets">
          <Money amount={winnerPayoutMnt(prizePool)} />
        </Row>
      </dl>

      <dl className="border-border flex flex-col gap-2 border-y py-3 text-[13px]">
        <Row label="Таны хувь / Your share">
          <Money amount={prizeShareMnt(prizePool)} />
        </Row>
        <Row
          label="Серверийн төлбөр / Server fee"
          hint="Платформ тогтооно · Set by platform"
        >
          <Money amount={serverFeeMnt} />
        </Row>
        <Row label="Нийт / Total" hint="Үүсгэхэд түгжигдэнэ · Locked on create">
          <Money amount={cost} className="text-[15px] font-medium" />
        </Row>
      </dl>

      <dl className="flex flex-col gap-2 text-[13px]">
        <Row label="Хэтэвч / Wallet">
          <Money amount={balanceMnt} />
        </Row>
        <Row label="Үлдэгдэл / After">
          {after >= 0 ? (
            <Money amount={after} />
          ) : (
            <span className="text-danger">Хүрэлцэхгүй / Not enough</span>
          )}
        </Row>
      </dl>

      <p className="text-text-faint text-[12px]">
        Та хост болж А багийн эхэнд орно. You host and join Team A first.
      </p>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="flex flex-col">
        <span className="text-text-muted">{label}</span>
        {hint && <span className="text-text-faint text-[11px]">{hint}</span>}
      </dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
