"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** v1 terminal — four primary surfaces (pipeline lives under Deals + /opportunities) */
const NAV = [
  { href: "/market", label: "Market" },
  { href: "/deals", label: "Deals" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/briefing", label: "Briefing" },
] as const;

function navActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  if (
    href === "/deals" &&
    (pathname.startsWith("/deal") || pathname.startsWith("/opportunities"))
  ) {
    return true;
  }
  return pathname.startsWith(`${href}/`);
}

export function PlanSureShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-deal-bg text-deal-text">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-deal-border p-5 md:flex">
        <Link href="/market" className="mb-6 block text-deal-text">
          <span className="text-lg font-semibold tracking-tight">PlanSureAI</span>
          <span className="mt-1 block text-[10px] font-medium leading-snug tracking-wide text-deal-muted">
            Market Intelligence for Development Finance
          </span>
        </Link>
        <nav className="space-y-3 text-sm">
          {NAV.map(({ href, label }) => {
            const on = navActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={
                  on
                    ? "font-medium text-deal-green"
                    : "text-deal-muted hover:text-deal-text"
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2 pt-10 text-xs">
          <Link
            href="/opportunities"
            className="block text-deal-muted hover:text-deal-text"
          >
            Opportunities feed
          </Link>
          <Link href="/" className="block text-deal-muted hover:text-deal-text">
            ← Product home
          </Link>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <header className="sticky top-0 z-10 flex flex-col border-b border-deal-border bg-deal-bg px-4 py-3 md:hidden">
          <Link href="/market" className="text-base font-semibold tracking-tight text-deal-text">
            PlanSureAI
          </Link>
          <span className="text-[9px] font-medium tracking-wide text-deal-muted">
            Market Intelligence for Development Finance
          </span>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-deal-border bg-deal-bg px-1 pt-1 pb-[env(safe-area-inset-bottom,0px)] md:hidden"
        aria-label="Primary"
      >
        {NAV.map(({ href, label }) => {
          const on = navActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={
                on
                  ? "min-h-[44px] flex-1 py-2 text-center text-xs font-semibold text-deal-green"
                  : "min-h-[44px] flex-1 py-2 text-center text-xs font-medium text-deal-muted"
              }
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
