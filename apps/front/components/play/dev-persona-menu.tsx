"use client";

import { Button, cn } from "@bulaa/ui";
import { UserSwitch } from "@phosphor-icons/react/dist/ssr";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { LOBBIES_QUERY_KEY } from "@/lib/lobbies";
import { fetchDevPersonas, switchDevPersona, type DevPersona } from "@/lib/dev-personas";
import { formatMnt } from "@/lib/money";

const DEV_PERSONAS_KEY = ["dev", "personas"] as const;

/** Development-only quick switch between seeded players. Hidden when the API is unavailable. */
export function DevPersonaMenu({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const personasQuery = useQuery({
    queryKey: DEV_PERSONAS_KEY,
    queryFn: fetchDevPersonas,
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (personasQuery.isError || !personasQuery.data?.personas.length) {
    return null;
  }

  const personas = personasQuery.data.personas;

  async function pick(persona: DevPersona) {
    setPending(persona.label);
    try {
      await switchDevPersona(persona.label);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      await queryClient.invalidateQueries({ queryKey: LOBBIES_QUERY_KEY });
      setOpen(false);
      window.location.reload();
    } finally {
      setPending(null);
    }
  }

  const active =
    personas.find((p) => p.userId === currentUserId)?.label ?? "dev";

  return (
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="border-border-strong text-text-muted font-mono text-[12px]"
      >
        <UserSwitch weight="bold" aria-hidden />
        {active}
      </Button>
      {open && (
        <ul
          role="listbox"
          aria-label="Dev personas"
          className="border-border-strong bg-raised absolute right-0 z-30 mt-1 max-h-72 w-56 overflow-y-auto rounded-md border py-1 shadow-none"
        >
          {personas.map((persona) => (
            <li key={persona.label} role="option" aria-selected={persona.userId === currentUserId}>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => pick(persona)}
                className={cn(
                  "hover:bg-overlay flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors",
                  persona.userId === currentUserId && "bg-overlay",
                )}
              >
                <span className="text-text font-mono text-[12px]">{persona.label}</span>
                <span className="text-text-muted truncate text-[13px]">{persona.displayName}</span>
                <span className="tabular-money text-[12px]">{formatMnt(persona.balanceMnt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
