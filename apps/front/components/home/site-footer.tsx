import { productName } from "@bulaa/design";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-void">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div className="flex flex-col gap-1">
          <span className="font-display text-lg font-semibold text-text">{productName}</span>
          <p className="text-[13px] text-text-faint">
            Paid CS2 5v5 matchmaking · Mongolia
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]" aria-label="Footer">
          <Link href="/design-system" className="text-text-muted hover:text-text">
            Design system
          </Link>
          <a href="#features" className="text-text-muted hover:text-text">
            Features
          </a>
          <a href="#how-it-works" className="text-text-muted hover:text-text">
            How it works
          </a>
        </nav>

        <p className="text-[12px] text-text-faint sm:text-right">
          © {new Date().getFullYear()} {productName}
        </p>
      </div>
    </footer>
  );
}
