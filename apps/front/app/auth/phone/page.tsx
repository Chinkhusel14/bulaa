"use client";

import { Button } from "@bulaa/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../lib/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export default function PhoneVerifyPage() {
  const { data: user, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  if (isLoading) return null;
  if (!user) {
    router.replace("/");
    return null;
  }
  if (user.status === "active") {
    router.replace("/");
    return null;
  }

  async function handleRequestCode() {
    setError(null);
    setSending(true);
    try {
      const e164 = phone.startsWith("+976") ? phone : `+976${phone}`;
      await apiFetch("/api/auth/phone/request", {
        method: "POST",
        body: JSON.stringify({ phone: e164 }),
      });
      setStep("code");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа");
    } finally {
      setSending(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setSending(true);
    try {
      const e164 = phone.startsWith("+976") ? phone : `+976${phone}`;
      await apiFetch("/api/auth/phone/verify", {
        method: "POST",
        body: JSON.stringify({ phone: e164, code }),
      });
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      router.replace("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-void px-4">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-md border border-border bg-base p-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text">
            Утас баталгаажуулах
          </h1>
          <p className="mt-1 text-[13px] text-text-muted">
            Verify your phone number
          </p>
        </div>

        {step === "phone" ? (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-text">
                Утасны дугаар
              </span>
              <div className="flex items-center gap-2 rounded-md border border-border bg-void px-3 py-2">
                <span className="text-[13px] text-text-muted">+976</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={8}
                  value={phone.replace("+976", "")}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="99001122"
                  className="flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-text-faint"
                />
              </div>
            </label>
            {error && (
              <p className="text-[13px] text-danger">{error}</p>
            )}
            <Button
              onClick={handleRequestCode}
              disabled={phone.replace("+976", "").length !== 8 || sending}
            >
              {sending ? "Илгээж байна..." : "Код авах"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-text">
                Баталгаажуулах код
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="rounded-md border border-border bg-void px-3 py-2 text-center text-lg tracking-[0.3em] text-text outline-none placeholder:text-text-faint"
              />
            </label>
            {error && (
              <p className="text-[13px] text-danger">{error}</p>
            )}
            <Button
              onClick={handleVerify}
              disabled={code.length !== 6 || sending}
            >
              {sending ? "Шалгаж байна..." : "Баталгаажуулах"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              className="text-[13px] text-accent hover:underline"
            >
              Дугаар солих
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
