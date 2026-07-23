import { Button } from "@bulaa/ui";
import { Crosshair } from "@phosphor-icons/react/dist/ssr";

export function CtaSection() {
  return (
    <section className="border-t border-border bg-base">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 sm:px-10 sm:py-20">
        <div className="flex max-w-xl flex-col gap-3">
          <h2 className="font-display text-[32px] font-semibold leading-[38px] tracking-tight text-text">
            Бэлэн үү?
          </h2>
          <p className="text-[15px] leading-[22px] text-text-muted">
            Монголын CS2 нийгэмлэгт нэгдээрэй. Steam-ээр нэвтэрч, эхний тоглолтоо олоорой.
          </p>
        </div>
        <Button size="lg">
          <Crosshair data-icon="inline-start" weight="bold" />
          Find Match
        </Button>
      </div>
    </section>
  );
}
