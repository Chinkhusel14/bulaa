import type { Metadata } from "next";
import { fonts } from "@bulaa/design";
import "@bulaa/ui/globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Bulaa — Paid CS2 5v5 Matchmaking",
  description:
    "Mongolia's paid CS2 5v5 matchmaking platform. Sign in with Steam, fund your MNT wallet, queue for fair matches, captain draft, and get paid out.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href={`https://fonts.googleapis.com/css2?family=${fonts.googleFamilies}&display=swap`}
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
