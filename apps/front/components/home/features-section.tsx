import {
  Crosshair,
  ShieldCheck,
  Sword,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

type Feature = {
  icon: Icon;
  title: string;
  titleEn: string;
  description: string;
  accent: "pro" | "mid" | "low";
};

const features: Feature[] = [
  {
    icon: Crosshair,
    title: "Шууд дараалал",
    titleEn: "Continuous queue",
    description:
      "Solo, duo, эсвэл trio-оор ор. MMR-аар тэнцвэртэй 10 тоглогч бүрдэх хүртэл автоматаар хүлээнэ.",
    accent: "pro",
  },
  {
    icon: Sword,
    title: "Капитан сонголт",
    titleEn: "Captain draft",
    description:
      "Топ тоглогчид капитан болж 30 секунд тутамд сонголт хийнэ. Duo/trio багийн давуу тал хадгалагдана.",
    accent: "mid",
  },
  {
    icon: Wallet,
    title: "MNT түрийвч",
    titleEn: "MNT wallet",
    description:
      "QPay-ээр цэнэглэ, escrow-д түгжигдэнэ, ялалтын дараа шууд түрийвч рүү орно. Гараар шилжүүлэх шаардлагагүй.",
    accent: "pro",
  },
  {
    icon: ShieldCheck,
    title: "Шударга тоглолт",
    titleEn: "Fair play",
    description:
      "VAC шалгалт, утас баталгаажуулалт, зан үйлийн оноо. GOTV demo, smurf илрүүлэлт — итгэлцэлтэй тоглолт.",
    accent: "low",
  },
];

const accentBar: Record<Feature["accent"], string> = {
  pro: "bg-tier-pro",
  mid: "bg-tier-mid",
  low: "bg-tier-low",
};

export function FeaturesSection() {
  return (
    <section id="features" className="border-t border-border bg-base">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 sm:px-10">
        <header className="flex max-w-2xl flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-text-faint">
            Онцлог · Features
          </p>
          <h2 className="font-display text-[32px] font-semibold leading-[38px] tracking-tight text-text">
            Discord-оос платформ руу
          </h2>
          <p className="text-[15px] leading-[22px] text-text-muted">
            Админ гараар мөнгө шилжүүлэх, дараалал зохион байгуулах үеийг орхи. Бүх зүйл
            нэг дор — түрийвч, дараалал, сонголт, төлбөр.
          </p>
        </header>

        <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="flex flex-col gap-4 bg-raised p-6 sm:p-8"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-8 w-1 shrink-0 rounded-sm ${accentBar[feature.accent]}`}
                    aria-hidden
                  />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Icon weight="bold" className="size-5 text-primary" />
                      <h3 className="font-display text-lg font-semibold leading-6 text-text">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-[12px] text-text-faint">{feature.titleEn}</p>
                  </div>
                </div>
                <p className="text-[15px] leading-[22px] text-text-muted">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
