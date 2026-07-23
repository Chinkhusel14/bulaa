import { Button } from "@bulaa/ui";
import { Crosshair, MapPin } from "@phosphor-icons/react/dist/ssr";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-void">
      {/* Subtle grid accent — flat, no glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 sm:px-10 sm:py-28 lg:py-32">
        <div className="flex max-w-3xl flex-col gap-6">
          <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-text-faint">
            <MapPin weight="bold" className="size-3.5 text-primary" />
            <span>Монгол · Mongolia · CS2 5v5</span>
          </div>

          <h1 className="font-display text-[40px] font-bold leading-[44px] tracking-tight text-text sm:text-[52px] sm:leading-[56px]">
            Төлбөртэй 5v5
            <br />
            <span className="text-primary">matchmaking.</span>
          </h1>

          <p className="max-w-xl text-[15px] leading-[22px] text-text-muted sm:text-[17px] sm:leading-[26px]">
            Steam-ээр нэвтэр, түрийвчээ цэнэглэ, шууд дараалалд орж, капитан сонголтоор
            баг бүрдүүл. Монгол сервер дээр тоглоод ялагчид{" "}
            <span className="tabular-money font-medium">₮ 100,000</span> хүртэл ав.
          </p>
          <p className="max-w-xl text-[13px] leading-5 text-text-faint">
            Sign in with Steam, fund your wallet, queue for fair MMR-based 5v5 matches,
            draft with captains, play on Mongolia-hosted servers, and get paid out to
            your wallet.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button size="lg">
            <Crosshair data-icon="inline-start" weight="bold" />
            Find Match
          </Button>
          <a
            href="#how-it-works"
            className="text-[15px] font-medium text-accent underline-offset-4 hover:underline"
          >
            Яаж ажилладаг вэ?
          </a>
        </div>

        <dl className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
          {[
            { value: "5v5", label: "Формат", sub: "Competitive" },
            { value: "MMR", label: "Тэнцвэр", sub: "Skill-based" },
            { value: "30s", label: "Сонголт", sub: "Captain draft" },
            { value: "0ms", label: "Пинг", sub: "MN servers" },
          ].map((stat) => (
            <div key={stat.label} className="bg-void px-5 py-4">
              <dt className="font-display text-2xl font-semibold leading-8 text-text">
                {stat.value}
              </dt>
              <dd className="mt-0.5 text-[13px] font-medium text-text-muted">{stat.label}</dd>
              <dd className="text-[11px] text-text-faint">{stat.sub}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
