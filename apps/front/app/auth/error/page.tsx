"use client";

import { Button } from "@bulaa/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const errorMessages: Record<string, { mn: string; en: string }> = {
  vac_banned: {
    mn: "Таны CS2 бүртгэл VAC ban авсан байна.",
    en: "Your CS2 account has a VAC ban.",
  },
  game_banned: {
    mn: "Таны CS2 бүртгэл game ban авсан байна.",
    en: "Your CS2 account has a game ban.",
  },
  steam_profile_private: {
    mn: "Steam профайл хаалттай байна. Тоглоомын дэлгэрэнгүйг нээнэ үү.",
    en: "Your Steam profile is private. Please set game details to public.",
  },
  account_too_new: {
    mn: "Steam бүртгэл хэт шинэ байна (90+ хоног шаардлагатай).",
    en: "Your Steam account is too new (90+ days required).",
  },
  cs2_hours_too_low: {
    mn: "CS2 тоглосон цаг хүрэхгүй байна (100+ цаг шаардлагатай).",
    en: "Not enough CS2 playtime (100+ hours required).",
  },
  unauthenticated: {
    mn: "Steam нэвтрэлт амжилтгүй боллоо.",
    en: "Steam authentication failed.",
  },
};

function ErrorContent() {
  const params = useSearchParams();
  const code = params.get("code") ?? "unauthenticated";
  const msg = errorMessages[code] ?? errorMessages.unauthenticated;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-void px-4">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-md border border-border bg-base p-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-danger">
            Нэвтрэх боломжгүй
          </h1>
          <p className="mt-1 text-[13px] text-text-muted">
            Unable to sign in
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-danger/30 bg-danger/5 p-4">
          <p className="text-[15px] text-text">{msg!.mn}</p>
          <p className="text-[13px] text-text-muted">{msg!.en}</p>
        </div>

        <Button variant="secondary" asChild>
          <Link href="/">Нүүр хуудас руу буцах</Link>
        </Button>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}
