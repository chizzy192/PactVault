import Image from "next/image";
import Link from "next/link";

import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

export function SiteHeader() {
  return (
    <header className="border-b border-border/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2.5 px-5 sm:gap-4 sm:px-8">
        <Link
          href="/"
          aria-label="PactVault home"
          className="flex items-center gap-2 rounded-md font-heading text-lg font-bold tracking-tight"
        >
          {/* Brand mark (owner-supplied): light variant in light mode, dark variant in dark mode. */}
          <Image
            src="/pactvault-mark.svg"
            alt=""
            width={28}
            height={28}
            unoptimized
            priority
            className="size-7 dark:hidden"
          />
          <Image
            src="/pactvault-mark-dark.svg"
            alt=""
            width={28}
            height={28}
            unoptimized
            priority
            className="hidden size-7 dark:block"
          />
          <span>
            Pact<span className="text-primary">Vault</span>
          </span>
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
