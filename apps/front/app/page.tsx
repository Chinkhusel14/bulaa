import { Button } from "@bulaa/ui";
import { Crosshair } from "@phosphor-icons/react/dist/ssr";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-void px-6">
      <p className="font-display text-4xl font-semibold tracking-tight text-text">
        Bulaa
      </p>
      <p className="max-w-md text-center text-text-muted">
        Paid CS2 5v5 matchmaking for Mongolia. Find Match.
      </p>
      <Button>
        <Crosshair data-icon="inline-start" weight="bold" />
        Find Match
      </Button>
    </main>
  );
}
