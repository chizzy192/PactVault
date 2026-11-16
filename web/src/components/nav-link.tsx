"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Header link that marks the current page (aria-current + lasting underline). */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const current = usePathname() === href;

  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "rounded-md px-2 py-1 text-sm font-medium text-info hover:underline",
        current && "underline decoration-teal/60 decoration-2"
      )}
    >
      {children}
    </Link>
  );
}
