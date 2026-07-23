import type { Metadata } from "next";
import { fonts } from "@bulaa/design";
import "@bulaa/ui/globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Bulaa",
  description: "Paid CS2 5v5 matchmaking — Mongolia",
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
