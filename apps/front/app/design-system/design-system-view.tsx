"use client";

import { brandName, colors, fonts, motion, productName, radius, timer } from "@bulaa/design";
import { Button } from "@bulaa/ui";
import {
  Crosshair,
  ShieldWarning,
  Trophy,
  Wallet,
} from "@phosphor-icons/react";
import Link from "next/link";

const swatches: { name: string; hex: string; className: string }[] = [
  { name: "bgVoid", hex: colors.bgVoid, className: "bg-void" },
  { name: "bgBase", hex: colors.bgBase, className: "bg-base" },
  { name: "bgRaised", hex: colors.bgRaised, className: "bg-raised" },
  { name: "bgOverlay", hex: colors.bgOverlay, className: "bg-overlay" },
  { name: "border", hex: colors.border, className: "bg-[var(--border)]" },
  { name: "borderStrong", hex: colors.borderStrong, className: "bg-[var(--border-strong)]" },
  { name: "text", hex: colors.text, className: "bg-text" },
  { name: "textMuted", hex: colors.textMuted, className: "bg-text-muted" },
  { name: "textFaint", hex: colors.textFaint, className: "bg-text-faint" },
  { name: "primary", hex: colors.primary, className: "bg-primary" },
  { name: "primaryHover", hex: colors.primaryHover, className: "bg-primary-hover" },
  { name: "primaryPressed", hex: colors.primaryPressed, className: "bg-primary-pressed" },
  { name: "accent", hex: colors.accent, className: "bg-accent" },
  { name: "success", hex: colors.success, className: "bg-success" },
  { name: "warning", hex: colors.warning, className: "bg-warning" },
  { name: "danger", hex: colors.danger, className: "bg-danger" },
  { name: "money", hex: colors.money, className: "bg-money" },
  { name: "tierPro", hex: colors.tierPro, className: "bg-tier-pro" },
  { name: "tierMid", hex: colors.tierMid, className: "bg-tier-mid" },
  { name: "tierLow", hex: colors.tierLow, className: "bg-tier-low" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-10">
      <h2 className="font-display text-2xl font-semibold leading-[30px] tracking-tight text-text">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DesignSystemView() {
  return (
    <main className="min-h-dvh bg-base text-text">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-text-faint">
            Temp · {brandName} · {productName}
          </p>
          <h1 className="font-display text-[40px] font-bold leading-[44px] tracking-tight">
            Design system
          </h1>
          <p className="max-w-xl text-[15px] leading-[22px] text-text-muted">
            Dev reference for locked Clutch tokens and UI primitives — not a product
            page.{" "}
            <Link href="/" className="text-accent underline-offset-4 hover:underline">
              Back home
            </Link>
          </p>
        </header>

        <Section title="Color">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {swatches.map((s) => (
              <div key={s.name} className="flex flex-col gap-2">
                <div
                  className={`h-16 rounded-md border border-border ${s.className}`}
                  title={s.hex}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[12px] leading-4 text-text">{s.name}</span>
                  <span className="font-mono text-[12px] leading-4 text-text-faint">
                    {s.hex}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-md border border-border bg-raised p-4">
            <p className="text-[12px] leading-4 text-text-muted">
              Soft fill · <code className="font-mono text-primary">primaryMuted</code>
            </p>
            <div
              className="mt-3 h-10 rounded-sm"
              style={{ backgroundColor: colors.primaryMuted }}
            />
          </div>
        </Section>

        <Section title="Typography">
          <div className="flex flex-col gap-6 rounded-md border border-border bg-raised p-6">
            <div>
              <p className="mb-1 text-[12px] leading-4 text-text-faint">
                Display · {fonts.display}
              </p>
              <p className="font-display text-[40px] font-bold leading-[44px]">
                Find Match
              </p>
            </div>
            <div>
              <p className="mb-1 text-[12px] leading-4 text-text-faint">H1 · 32/38</p>
              <p className="font-display text-[32px] font-semibold leading-[38px]">
                Server ready
              </p>
            </div>
            <div>
              <p className="mb-1 text-[12px] leading-4 text-text-faint">H2 · 24/30</p>
              <p className="font-display text-2xl font-semibold leading-[30px]">
                Your pick
              </p>
            </div>
            <div>
              <p className="mb-1 text-[12px] leading-4 text-text-faint">
                Body · {fonts.body}
              </p>
              <p className="text-[15px] leading-[22px] text-text-muted">
                Paid CS2 5v5 matchmaking for Mongolia. Entry, prize pool, payout, draft,
                escrow.
              </p>
            </div>
            <div>
              <p className="mb-1 text-[12px] leading-4 text-text-faint">
                Mono · {fonts.mono}
              </p>
              <p className="font-mono text-[15px] leading-[22px] text-text">
                match_8f3a · connect 192.168.1.10:27015
              </p>
            </div>
            <div>
              <p className="mb-1 text-[12px] leading-4 text-text-faint">
                Money · 20/24 medium tabular
              </p>
              <p className="tabular-money text-xl font-medium leading-6">₮ 125,000</p>
            </div>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>
              <Crosshair data-icon="inline-start" weight="bold" />
              Find Match
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">
              <ShieldWarning data-icon="inline-start" weight="bold" />
              Cancel
            </Button>
            <Button variant="link">Link action</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Wallet">
              <Wallet weight="bold" />
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Radii & chrome">
          <div className="flex flex-wrap gap-4">
            {(
              [
                ["sm", radius.sm],
                ["md", radius.md],
                ["lg", radius.lg],
              ] as const
            ).map(([name, value]) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div
                  className="size-16 border border-border-strong bg-overlay"
                  style={{ borderRadius: value }}
                />
                <span className="font-mono text-[12px] text-text-muted">
                  {name} · {value}
                </span>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-border bg-raised p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-4 w-1 rounded-sm bg-tier-pro" />
                <span className="text-[13px] font-medium">Pro</span>
              </div>
              <p className="text-[12px] text-text-muted">Left accent bar · tierPro</p>
            </div>
            <div className="rounded-md border border-border bg-raised p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-4 w-1 rounded-sm bg-tier-mid" />
                <span className="text-[13px] font-medium">Mid</span>
              </div>
              <p className="text-[12px] text-text-muted">Left accent bar · tierMid</p>
            </div>
            <div className="rounded-md border border-border bg-raised p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-4 w-1 rounded-sm bg-tier-low" />
                <span className="text-[13px] font-medium">Low</span>
              </div>
              <p className="text-[12px] text-text-muted">Left accent bar · tierLow</p>
            </div>
          </div>
        </Section>

        <Section title="States">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-raised p-4">
              <div className="mb-2 flex items-center gap-2 text-success">
                <Trophy weight="bold" />
                <span className="font-medium">Win / payout</span>
              </div>
              <p className="text-[13px] text-text-muted">
                success · same lime as primary for credit
              </p>
            </div>
            <div className="rounded-md border border-border bg-raised p-4">
              <div className="mb-2 flex items-center gap-2 text-danger">
                <ShieldWarning weight="bold" />
                <span className="font-medium">Loss / ban</span>
              </div>
              <p className="text-[13px] text-text-muted">danger · never primary alone</p>
            </div>
            <div className="rounded-md border border-border bg-raised p-4">
              <p className="mb-1 font-mono text-[13px] text-warning">Draft · 00:09</p>
              <p className="text-[12px] text-text-muted">
                warning at ≤{timer.warningAt}s · danger at ≤{timer.dangerAt}s
              </p>
            </div>
            <div className="rounded-md border border-border bg-raised p-4">
              <p className="mb-1 text-[13px] text-text-muted">Motion (ms)</p>
              <p className="font-mono text-[13px] text-text">
                snap {motion.pickSnap} · flash {motion.pickFlash} · fade {motion.fade}
              </p>
            </div>
          </div>
        </Section>

        <footer className="border-t border-border pt-8 text-[12px] leading-4 text-text-faint">
          Source: <code className="font-mono">docs/design/DESIGN.md</code> ·{" "}
          <code className="font-mono">@bulaa/design</code>
        </footer>
      </div>
    </main>
  );
}
