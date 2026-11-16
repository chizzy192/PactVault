import Link from "next/link";

import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

/** Wordmark: a vault door with a combination dial and a handle. */
function VaultMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6 text-teal"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden
    >
      <rect x="2.5" y="3" width="19" height="18" rx="3.5" />
      <circle cx="10.5" cy="12" r="4.25" />
      <path d="M10.5 7.75v1.5M10.5 14.75v1.5M6.25 12h1.5M13.25 12h1.5" />
      <circle cx="10.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <path d="M18 9.5v5" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-border/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2.5 px-5 sm:gap-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md font-heading text-lg font-semibold tracking-tight"
        >
          <VaultMark />
          PactVault
        </Link>
        <Badge variant="info">Devnet</Badge>
        <nav className="ml-auto flex items-center gap-1 sm:gap-3">
          <NavLink href="/faucet">Faucet</NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
