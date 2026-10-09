"use client";

import { PlayShell } from "@/components/play/play-shell";

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <PlayShell>{children}</PlayShell>;
}
