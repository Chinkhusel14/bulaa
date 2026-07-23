import { formatMnt } from "@/lib/money";

const steps = [
  {
    step: "01",
    title: "Steam + утас",
    titleEn: "Sign in & verify",
    description: "Steam OpenID-ээр нэвтэр, утсаа баталгаажуул. Админ эхний skill tier онооно.",
  },
  {
    step: "02",
    title: "Түрийвч цэнэглэх",
    titleEn: "Fund wallet",
    description: "QPay-ээр MNT цэнэглэ. Тоглолт бүрт escrow-д түгжигдэнэ.",
  },
  {
    step: "03",
    title: "Дараалал",
    titleEn: "Find match",
    description: "Solo, duo, эсвэл trio сонго. 10 тоглогч MMR-аар таарвал accept хийнэ.",
  },
  {
    step: "04",
    title: "Капитан сонголт",
    titleEn: "Captain draft",
    description: "Капитанууд 30 секунд тутамд тоглогч сонгоно. Баг бүрдэх хүртэл live draft.",
  },
  {
    step: "05",
    title: "Тоглолт",
    titleEn: "Play & payout",
    description: "Монгол серверт 5v5 тогло. Ялагчид түрийвч рүү шууд payout орно.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-t border-border bg-void">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-20 sm:px-10">
        <header className="flex max-w-2xl flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-text-faint">
            Алхам · How it works
          </p>
          <h2 className="font-display text-[32px] font-semibold leading-[38px] tracking-tight text-text">
            Тоглолт хүртэл 5 алхам
          </h2>
          <p className="text-[15px] leading-[22px] text-text-muted">
            Entry fee, prize pool, draft, escrow — бүгд автомат. Админ зөвхөн үр дүн
            баталгаажуулна.
          </p>
        </header>

        <ol className="flex flex-col gap-0 border border-border">
          {steps.map((item, index) => (
            <li
              key={item.step}
              className={`flex gap-6 border-border bg-base p-6 sm:gap-8 sm:p-8 ${
                index < steps.length - 1 ? "border-b" : ""
              }`}
            >
              <span className="font-mono text-[13px] font-medium leading-5 text-primary">
                {item.step}
              </span>
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <h3 className="font-display text-lg font-semibold leading-6 text-text">
                    {item.title}
                  </h3>
                  <span className="text-[12px] text-text-faint">{item.titleEn}</span>
                </div>
                <p className="max-w-prose text-[15px] leading-[22px] text-text-muted">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="grid gap-px border border-border bg-border sm:grid-cols-3">
          <div className="bg-raised px-6 py-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-text-faint">
              Entry + server fee
            </p>
            <p className="mt-2 tabular-money text-xl font-medium leading-6">
              {formatMnt(55_000)}
            </p>
            <p className="mt-1 text-[13px] text-text-muted">Тоглогч бүр · per player</p>
          </div>
          <div className="bg-raised px-6 py-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-text-faint">
              Prize pool
            </p>
            <p className="mt-2 tabular-money text-xl font-medium leading-6">
              {formatMnt(500_000)}
            </p>
            <p className="mt-1 text-[13px] text-text-muted">10 тоглогч · total pool</p>
          </div>
          <div className="bg-raised px-6 py-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-text-faint">
              Payout
            </p>
            <p className="mt-2 tabular-money text-xl font-medium leading-6">
              {formatMnt(100_000)}
            </p>
            <p className="mt-1 text-[13px] text-text-muted">Ялагч бүр · per winner</p>
          </div>
        </div>
      </div>
    </section>
  );
}
