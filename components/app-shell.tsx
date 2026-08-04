"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  BarChart3,
  BookOpenCheck,
  ChevronDown,
  CircleHelp,
  Dice5,
  Gamepad2,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Trophy,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import {
  clearDemoSession,
  getDemoSession,
  switchDemoRole,
  type DemoSession,
} from "@/lib/demo-session";
import { cn } from "@/lib/utils";

const primaryNav = [
  { id: "sports", href: "/sports", label: "Sports", icon: BarChart3 },
  { id: "casino", href: "/casino", label: "Casino", icon: Gamepad2 },
  { id: "leaderboard", href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

const utilityNav = [
  { href: "/sports", label: "My bets", icon: WalletCards },
  { href: "/casino", label: "Game history", icon: History },
  { href: "/fairness", label: "Fairness", icon: ShieldCheck },
  { href: "/help", label: "Help", icon: CircleHelp },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: typeof BarChart3;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "nav-item flex min-h-11 items-center gap-3 rounded-[8px] px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
        active
          ? "bg-[var(--primary-soft)] text-[var(--text)]"
          : "text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)]",
      )}
    >
      <Icon
        className={cn("h-[18px] w-[18px]", active && "text-[var(--primary)]")}
      />
      {label}
    </a>
  );
}

function Brand() {
  return (
    <Link href="/sports" className="flex items-center gap-2.5" aria-label="PlayGrid">
      <span className="grid h-8 w-8 grid-cols-2 gap-[3px] rounded-[9px] bg-[var(--primary)] p-[7px]">
        <i className="rounded-[2px] bg-[var(--primary-foreground)]" />
        <i className="rounded-[2px] bg-[var(--primary-foreground)]" />
        <i className="rounded-[2px] bg-[var(--primary-foreground)]" />
        <i className="rounded-[2px] bg-transparent ring-2 ring-[var(--primary-foreground)]" />
      </span>
      <span className="hidden text-[17px] font-bold tracking-[-0.03em] min-[390px]:inline">
        PlayGrid
      </span>
    </Link>
  );
}

export function AppShell({
  active,
  children,
  admin = false,
}: {
  active: "sports" | "casino" | "leaderboard" | "admin";
  children: ReactNode;
  admin?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [demoSession, setDemoSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    const syncDemoSession = () => setDemoSession(getDemoSession());
    syncDemoSession();
    window.addEventListener("playgrid-demo-session", syncDemoSession);
    return () =>
      window.removeEventListener("playgrid-demo-session", syncDemoSession);
  }, []);

  useEffect(() => {
    if (!mobileOpen && !searchOpen && !accountOpen) return;
    const previousOverflow = document.body.style.overflow;
    if (mobileOpen || searchOpen) document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      setSearchOpen(false);
      setAccountOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen, mobileOpen, searchOpen]);

  const totalCredits = demoSession
    ? demoSession.sportsCredits + demoSession.arcadeCredits
    : 1000;
  const casinoCredits =
    demoSession?.role === "student" ? demoSession.arcadeCredits : 500;

  return (
    <div
      className={cn(
        "min-h-[100dvh] bg-[var(--canvas)] text-[var(--text)]",
        active === "sports" && "sports-theme",
        active === "casino" && "stake-theme",
      )}
    >
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="app-header fixed inset-x-0 top-0 z-50 flex h-16 min-w-0 items-center border-b border-[var(--border)] bg-[var(--canvas)]/95 px-3 backdrop-blur md:pl-[248px] md:pr-6">
        <button
          className="mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="md:hidden">
          <Brand />
        </div>

        {active === "casino" && !admin ? (
          <div className="hidden items-center rounded-[9px] border border-[var(--border)] bg-[var(--surface)] p-1 md:flex">
            <Link
              href="/casino"
              className="rounded-[6px] bg-[var(--surface-raised)] px-5 py-2 text-xs font-bold text-[var(--text)] shadow-sm"
            >
              Casino
            </Link>
            <Link
              href="/sports"
              className="rounded-[6px] px-5 py-2 text-xs font-semibold text-[var(--muted)] transition-colors hover:text-[var(--text)]"
            >
              Sports
            </Link>
          </div>
        ) : null}

        <button
          onClick={() => setSearchOpen(true)}
          className={cn(
            "ml-auto hidden h-10 w-full max-w-sm items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--muted)] hover:border-[var(--border-strong)] md:flex",
            active === "casino" && "ml-4 max-w-xs",
          )}
        >
          <Search className="h-4 w-4" />
          Jump to games or markets
        </button>

        <div className="ml-auto flex items-center gap-2 md:ml-4">
          {!admin ? (
            active === "casino" ? (
              <div className="flex h-10 overflow-hidden rounded-[8px] shadow-lg">
                <div className="flex items-center gap-2 bg-[var(--surface)] px-3 text-sm ring-1 ring-inset ring-[var(--border)]" aria-label={`${casinoCredits} arcade credits`}>
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--primary)] text-[10px] font-black text-[var(--primary-foreground)]">
                    P
                  </span>
                  <strong className="font-mono tabular-nums">
                    {new Intl.NumberFormat("en-IN").format(casinoCredits)}
                  </strong>
                </div>
                <a
                  href="/fairness"
                  className="hidden items-center bg-[var(--primary)] px-4 text-sm font-bold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)] sm:flex"
                >
                  Credits
                </a>
              </div>
            ) : (
              <div className="flex h-11 min-w-0 items-center gap-2 rounded-[9px] border border-[var(--border)] bg-[var(--surface)] px-2.5 text-sm sm:px-3" aria-label={`${totalCredits} total credits`}>
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-[10px] font-black text-[var(--primary-foreground)]">
                  P
                </span>
                <span className="hidden text-[var(--muted)] sm:inline">
                  Credits
                </span>
                <strong className="font-mono tabular-nums">
                  {new Intl.NumberFormat("en-IN").format(totalCredits)}
                </strong>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--muted)]" />
              </div>
            )
          ) : (
            <span className="rounded-full border border-[#f5c45144] bg-[#f5c45112] px-3 py-1.5 text-xs font-semibold text-[var(--warning)]">
              {demoSession ? "Admin demo" : "Admin mode"}
            </span>
          )}
          <div className="relative">
            <button
              className="grid h-10 w-10 place-items-center rounded-full bg-[var(--surface-raised)] text-xs font-bold ring-1 ring-[var(--border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
              aria-label="Account menu"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((open) => !open)}
            >
              {demoSession?.initials ?? "PG"}
            </button>
            {accountOpen && demoSession ? (
              <div
                className="account-popover absolute right-0 top-12 w-[290px] overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
                role="menu"
              >
                <div className="border-b border-[var(--border)] p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--primary-soft)] text-xs font-bold text-[var(--primary)]">
                      {demoSession.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {demoSession.name}
                      </p>
                      <p className="truncate text-xs text-[var(--muted)]">
                        @{demoSession.username}
                      </p>
                    </div>
                    <span className="ml-auto rounded-full border border-[#f5c45144] bg-[#f5c45112] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--warning)]">
                      Demo
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] text-[var(--muted)]">
                    {demoSession.email}
                  </p>
                </div>

                {demoSession.role === "student" ? (
                  <div className="grid grid-cols-2 gap-2 border-b border-[var(--border)] p-3">
                    <div className="rounded-lg bg-[var(--canvas)] p-3">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        Sports
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold">
                        {new Intl.NumberFormat("en-IN").format(
                          demoSession.sportsCredits,
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--canvas)] p-3">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        Arcade
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold">
                        {new Intl.NumberFormat("en-IN").format(
                          demoSession.arcadeCredits,
                        )}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-1 p-2">
                  <button
                    className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm hover:bg-[var(--surface-raised)]"
                    role="menuitem"
                    onClick={() => switchDemoRole(demoSession.role)}
                  >
                    <ArrowRightLeft className="h-4 w-4 text-[var(--primary)]" />
                    Switch to{" "}
                    {demoSession.role === "admin" ? "Student" : "Admin"} Demo
                  </button>
                  <button
                    className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-[var(--loss)] hover:bg-[var(--surface-raised)]"
                    role="menuitem"
                    onClick={() => {
                      clearDemoSession();
                      window.location.assign("/");
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Exit demo
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <aside
        className={cn(
          "app-sidebar fixed inset-y-0 left-0 z-[60] w-56 border-r border-[var(--border)] bg-[var(--surface)] p-4 transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-10 items-center justify-between">
          <Brand />
          <button
            className="grid h-9 w-9 place-items-center rounded-lg text-[var(--muted)] md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 space-y-1">
          {admin ? (
            <>
              <NavItem
                href="/admin"
                label="Overview"
                icon={LayoutDashboard}
                active
                onClick={() => setMobileOpen(false)}
              />
              <NavItem
                href="/admin#markets"
                label="Markets"
                icon={BarChart3}
                active={false}
                onClick={() => setMobileOpen(false)}
              />
              <NavItem
                href="/admin#economy"
                label="Economy"
                icon={WalletCards}
                active={false}
                onClick={() => setMobileOpen(false)}
              />
              <NavItem
                href="/admin#audit"
                label="Audit log"
                icon={BookOpenCheck}
                active={false}
                onClick={() => setMobileOpen(false)}
              />
            </>
          ) : (
            primaryNav.map((item) => (
              <NavItem
                key={item.label}
                {...item}
              active={active === item.id}
                onClick={() => setMobileOpen(false)}
              />
            ))
          )}
        </nav>

        <div className="my-5 border-t border-[var(--border)]" />
        <nav className="space-y-1">
          {(admin
            ? [
                {
                  href: "/sports",
                  label: "Student view",
                  icon: UserRound,
                },
                {
                  href: "/fairness",
                  label: "System health",
                  icon: ShieldCheck,
                },
              ]
            : utilityNav
          ).map((item) => (
            <NavItem
              key={item.label}
              {...item}
              active={false}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        <div className="absolute inset-x-4 bottom-4 rounded-[10px] border border-[var(--border)] bg-[var(--canvas)] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Dice5 className="h-4 w-4 text-[var(--primary)]" />
            Play-money only
          </div>
          <p className="mt-1.5 text-[11px] leading-4 text-[var(--muted)]">
            Credits have no monetary value and cannot be bought or redeemed.
          </p>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          className="fixed inset-0 z-[55] bg-black/55 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <main id="main-content" className="min-h-[100dvh] pt-16 md:pl-56">
        {demoSession ? (
          <div className="border-b border-[#f5c45133] bg-[#f5c4510c] px-4 py-2.5 text-xs text-[var(--muted)] sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-3 gap-y-1">
              <span className="rounded-full bg-[#f5c45118] px-2 py-0.5 font-bold uppercase tracking-wider text-[var(--warning)]">
                Demo environment
              </span>
              <span>
                {demoSession.role === "admin"
                  ? "Explore controls with seeded markets, members, disputes, and audit data. No live records are changed."
                  : "Explore with seeded balances, bets, game history, referrals, and leaderboard data. Activity resets when you exit."}
              </span>
            </div>
          </div>
        ) : null}
        {children}
      </main>

      {searchOpen ? (
        <div
          className="search-dialog fixed inset-0 z-[80] grid place-items-start bg-black/65 px-4 pt-[15vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSearchOpen(false);
          }}
        >
          <div className="w-full max-w-xl rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-2 pb-3">
              <Search className="h-5 w-5 text-[var(--muted)]" />
              <input
                autoFocus
                className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
                placeholder="Search Dice, Cricket, markets..."
              />
              <button
                className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)]"
                onClick={() => setSearchOpen(false)}
              >
                ESC
              </button>
            </div>
            <p className="px-2 pt-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Quick links
            </p>
            <div className="mt-2 grid gap-1">
              {[
                ["Dice", Dice5, "/casino/dice"],
                ["Live sports", BarChart3, "/sports"],
                ["Leaderboard", Trophy, "/leaderboard"],
              ].map(([label, Icon, href]) => (
                <a
                  key={String(label)}
                  href={String(href)}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-[var(--surface-raised)]"
                >
                  <Icon className="h-4 w-4 text-[var(--primary)]" />
                  {String(label)}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {!admin ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(68px+env(safe-area-inset-bottom))] items-start justify-around border-t border-[var(--border)] bg-[var(--surface)] px-2 pt-2 pb-[env(safe-area-inset-bottom)] md:hidden">
          {[
            { id: "sports", href: "/sports", label: "Sports", icon: BarChart3 },
            { id: "casino", href: "/casino", label: "Casino", icon: Gamepad2 },
            { id: "leaderboard", href: "/leaderboard", label: "Ranks", icon: Trophy },
            { id: "bets", href: "/sports", label: "My bets", icon: History },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                "flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] text-[var(--muted)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                active === item.id &&
                  "bg-[var(--primary-soft)] text-[var(--primary)]",
              )}
              aria-current={active === item.id ? "page" : undefined}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
