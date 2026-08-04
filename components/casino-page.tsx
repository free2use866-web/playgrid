"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Activity,
  Bomb,
  Bot,
  CarFront,
  ChevronDown,
  ChevronRight,
  CircleGauge,
  CircleDot,
  Dice5,
  Expand,
  Gem,
  Grid3X3,
  Heart,
  History,
  Info,
  Minimize2,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AppGate } from "@/components/app-gate";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  adjustDemoArcadeCredits,
  getDemoSession,
  useDemoSession,
} from "@/lib/demo-session";
import {
  CHICKEN_CITY_RATIO,
  CHICKEN_CROSSING_MS,
  CHICKEN_PLAYER_BOTTOM_RATIO,
  getChickenLaneCenter,
  pickChickenFailureLane,
  type ChickenDifficulty,
  type ChickenPhase,
} from "@/lib/chicken-model";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export type CasinoGame = "dice" | "mines" | "plinko" | "chicken" | "crash";
type BetMode = "manual" | "auto";
type Risk = "low" | "medium" | "high";

type AutoRoundResult = {
  net: number;
  won: boolean;
};

type AutoBetSettings = {
  rounds: number;
  stopOnProfit: number;
  stopOnLoss: number;
  intervalMs: number;
};

type AutoBetState = {
  running: boolean;
  stopping: boolean;
  completed: number;
  sessionProfit: number;
  stopReason: string | null;
};

const defaultAutoBetSettings: AutoBetSettings = {
  rounds: 10,
  stopOnProfit: 0,
  stopOnLoss: 0,
  intervalMs: 450,
};

type CatalogGame = {
  key: string;
  title: string;
  provider: string;
  icon: LucideIcon;
  route?: string;
  colors: [string, string];
  accent: string;
  badge?: string;
};

type RoundRow = {
  id: string;
  game: string;
  user: string;
  wager: number;
  multiplier: number;
  payout: number;
  time: string;
};

const playableGames: CatalogGame[] = [
  {
    key: "dice",
    title: "Dice",
    provider: "PlayGrid Originals",
    icon: Dice5,
    route: "/casino/dice",
    colors: ["#20b8f7", "#7557f4"],
    accent: "#c8f3ff",
    badge: "Original",
  },
  {
    key: "mines",
    title: "Mines",
    provider: "PlayGrid Originals",
    icon: Bomb,
    route: "/casino/mines",
    colors: ["#13a96e", "#0e4c59"],
    accent: "var(--win)",
    badge: "Popular",
  },
  {
    key: "plinko",
    title: "Plinko",
    provider: "PlayGrid Originals",
    icon: CircleDot,
    route: "/casino/plinko",
    colors: ["#f34b73", "#6f2be8"],
    accent: "#ffd8e1",
    badge: "Original",
  },
  {
    key: "chicken",
    title: "Chicken",
    provider: "PlayGrid Originals",
    icon: CarFront,
    route: "/casino/chicken",
    colors: ["#ffc400", "#f57c00"],
    accent: "#fff6ce",
    badge: "New",
  },
  {
    key: "crash",
    title: "Crash",
    provider: "PlayGrid Originals",
    icon: Activity,
    route: "/casino/crash",
    colors: ["var(--loss)", "#4c267a"],
    accent: "#ffe0e8",
    badge: "Live",
  },
];

const upcomingGames: CatalogGame[] = [
  {
    key: "limbo",
    title: "Limbo",
    provider: "PlayGrid Originals",
    icon: Zap,
    colors: ["#ff9b2f", "#d7465b"],
    accent: "#fff0bf",
    badge: "Soon",
  },
  {
    key: "keno",
    title: "Keno",
    provider: "PlayGrid Originals",
    icon: Grid3X3,
    colors: ["#ffca3a", "#f26640"],
    accent: "#fff5c7",
    badge: "Soon",
  },
  {
    key: "roulette",
    title: "Roulette",
    provider: "PlayGrid Table",
    icon: Target,
    colors: ["#14b880", "#073e41"],
    accent: "#b7ffe6",
    badge: "Soon",
  },
  {
    key: "blackjack",
    title: "Blackjack",
    provider: "PlayGrid Table",
    icon: Star,
    colors: ["#3855d8", "#101d58"],
    accent: "#d8e2ff",
    badge: "Soon",
  },
  {
    key: "baccarat",
    title: "Baccarat",
    provider: "PlayGrid Table",
    icon: Trophy,
    colors: ["#b68024", "#3c2610"],
    accent: "#ffedb4",
    badge: "Soon",
  },
  {
    key: "wheel",
    title: "Wheel",
    provider: "PlayGrid Originals",
    icon: CircleDot,
    colors: ["#0da3b7", "#2946b5"],
    accent: "#b8f8ff",
    badge: "Soon",
  },
];

const catalogGames = [...playableGames, ...upcomingGames];

const seededRounds: RoundRow[] = [
  {
    id: "round-1",
    game: "Dice",
    user: "cover_drive",
    wager: 50,
    multiplier: 1.98,
    payout: 99,
    time: "Just now",
  },
  {
    id: "round-2",
    game: "Mines",
    user: "quiet_alpha",
    wager: 100,
    multiplier: 2.44,
    payout: 244,
    time: "8s",
  },
  {
    id: "round-3",
    game: "Plinko",
    user: "late_wicket",
    wager: 25,
    multiplier: 0.5,
    payout: 12,
    time: "14s",
  },
  {
    id: "round-4",
    game: "Dice",
    user: "probability_king",
    wager: 250,
    multiplier: 2.08,
    payout: 520,
    time: "21s",
  },
];

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const gameSoundEvent = "playgrid-game-sound";
type GameSound =
  | "bet"
  | "step"
  | "win"
  | "loss"
  | "launch"
  | "cashout"
  | "crash";
let gameAudioContext: AudioContext | null = null;

function ensureGameAudio() {
  if (typeof window === "undefined") return null;
  gameAudioContext ??= new AudioContext();
  if (gameAudioContext.state === "suspended") {
    void gameAudioContext.resume();
  }
  return gameAudioContext;
}

function playGameSound(sound: GameSound) {
  const context = ensureGameAudio();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  const sounds: Record<GameSound, [number, number, number]> = {
    bet: [190, 250, 0.08],
    step: [420, 620, 0.07],
    win: [520, 880, 0.18],
    loss: [170, 72, 0.22],
    launch: [220, 740, 0.24],
    cashout: [620, 980, 0.16],
    crash: [125, 38, 0.28],
  };
  const [from, to, duration] = sounds[sound];
  oscillator.type =
    sound === "loss" || sound === "crash" ? "sawtooth" : "sine";
  oscillator.frequency.setValueAtTime(from, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.055, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function emitGameFeedback(sound: GameSound) {
  window.dispatchEvent(new CustomEvent<GameSound>(gameSoundEvent, { detail: sound }));
  if (sound === "loss" || sound === "crash") {
    navigator.vibrate?.([35, 35, 70]);
  }
  if (sound === "win" || sound === "cashout") navigator.vibrate?.(35);
}

function subscribeToReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );
}

function getPlayableBalance(fallback: number) {
  const demoSession = getDemoSession();
  return demoSession?.role === "student"
    ? demoSession.arcadeCredits
    : fallback;
}

function useAutoBetRunner({
  runRound,
  balance,
  wager,
}: {
  runRound: () => Promise<AutoRoundResult | null>;
  balance: number;
  wager: number;
}) {
  const runRoundRef = useRef(runRound);
  const balanceRef = useRef(balance);
  const wagerRef = useRef(wager);
  const activeRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const mountedRef = useRef(true);
  const [state, setState] = useState<AutoBetState>({
    running: false,
    stopping: false,
    completed: 0,
    sessionProfit: 0,
    stopReason: null,
  });

  useLayoutEffect(() => {
    runRoundRef.current = runRound;
    balanceRef.current = balance;
    wagerRef.current = wager;
  }, [balance, runRound, wager]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopRequestedRef.current = true;
    };
  }, []);

  const stop = useCallback(() => {
    if (!activeRef.current) return;
    stopRequestedRef.current = true;
    setState((current) => ({ ...current, stopping: true }));
  }, []);

  const start = useCallback(async (settings: AutoBetSettings) => {
    if (activeRef.current) return;

    activeRef.current = true;
    stopRequestedRef.current = false;
    let completed = 0;
    let sessionProfit = 0;
    let stopReason: string | null = null;
    setState({
      running: true,
      stopping: false,
      completed,
      sessionProfit,
      stopReason,
    });

    for (let index = 0; index < settings.rounds; index += 1) {
      if (stopRequestedRef.current) {
        stopReason = "Stopped by you";
        break;
      }

      const available = getPlayableBalance(balanceRef.current);
      if (wagerRef.current < 1 || wagerRef.current > available) {
        stopReason = "Not enough credits for the next bet";
        break;
      }

      const result = await runRoundRef.current();
      if (!result) {
        stopReason = "The next round could not start";
        break;
      }

      completed += 1;
      sessionProfit += result.net;
      if (mountedRef.current) {
        setState({
          running: true,
          stopping: stopRequestedRef.current,
          completed,
          sessionProfit,
          stopReason: null,
        });
      }

      if (settings.stopOnProfit > 0 && sessionProfit >= settings.stopOnProfit) {
        stopReason = "Profit target reached";
        break;
      }
      if (settings.stopOnLoss > 0 && sessionProfit <= -settings.stopOnLoss) {
        stopReason = "Loss limit reached";
        break;
      }
      if (completed >= settings.rounds) {
        stopReason = "All automatic bets completed";
        break;
      }

      const slices = Math.max(1, Math.ceil(settings.intervalMs / 50));
      for (let slice = 0; slice < slices; slice += 1) {
        if (stopRequestedRef.current) break;
        await wait(Math.min(50, settings.intervalMs));
      }
    }

    activeRef.current = false;
    if (mountedRef.current) {
      setState({
        running: false,
        stopping: false,
        completed,
        sessionProfit,
        stopReason: stopReason ?? "Automatic betting stopped",
      });
    }
  }, []);

  return { state, start, stop };
}

const formatCredits = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.max(0, Math.floor(value)),
  );

const formatSignedCredits = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.trunc(value),
  );

function CreditMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-[9px] font-black text-[var(--primary-foreground)]",
        className,
      )}
      aria-hidden="true"
    >
      P
    </span>
  );
}

function GameArtwork({ game }: { game: CatalogGame }) {
  const Icon = game.icon;
  return (
    <div
      className="casino-thumbnail relative aspect-[4/5] overflow-hidden rounded-[8px]"
      style={{
        background: `linear-gradient(145deg, ${game.colors[0]}, ${game.colors[1]})`,
      }}
    >
      <span className="absolute -right-10 -top-8 h-32 w-32 rounded-full border-[18px] border-white/10" />
      <span className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-black/15" />
      <span className="absolute inset-x-0 top-[20%] mx-auto h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <Icon
        className="absolute left-1/2 top-[43%] h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_12px_18px_rgba(0,0,0,.28)]"
        style={{ color: game.accent }}
        strokeWidth={1.85}
      />
      <div className="absolute inset-x-3 bottom-3">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/65">
          PlayGrid
        </p>
        <p className="mt-0.5 text-xl font-black tracking-[-0.04em] text-white drop-shadow">
          {game.title}
        </p>
      </div>
      {game.badge ? (
        <span className="absolute right-2 top-2 rounded-[4px] bg-black/45 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-white backdrop-blur">
          {game.badge}
        </span>
      ) : null}
    </div>
  );
}

function CatalogCard({ game }: { game: CatalogGame }) {
  const content = (
    <>
      <GameArtwork game={game} />
      <div className="mt-2 min-w-0 px-0.5">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-[13px] font-bold">{game.title}</h3>
          {game.route ? (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]" />
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
          {game.provider}
        </p>
      </div>
    </>
  );

  if (game.route) {
    return (
      <a
        href={game.route}
        className="group block min-w-0 rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--canvas)]"
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled
      className="block min-w-0 text-left opacity-70"
      aria-label={`${game.title}, coming soon`}
    >
      {content}
    </button>
  );
}

function LobbyRail({
  title,
  detail,
  games,
}: {
  title: string;
  detail: string;
  games: CatalogGame[];
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-base font-bold tracking-[-0.02em] sm:text-lg">
            {title}
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">{detail}</p>
        </div>
        <span className="font-mono text-[10px] text-[var(--muted)]">{games.length} games</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
        {games.map((game) => (
          <CatalogCard key={game.key} game={game} />
        ))}
      </div>
    </section>
  );
}

function ActivityTable({ compact = false }: { compact?: boolean }) {
  const [tab, setTab] = useState<"all" | "mine" | "high">("all");
  const rows =
    tab === "mine"
      ? seededRounds.filter((row) => row.user === "cover_drive")
      : tab === "high"
        ? [...seededRounds].sort((a, b) => b.wager - a.wager)
        : seededRounds;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[8px] bg-[var(--surface)] shadow-[0_4px_12px_rgba(0,0,0,.16)]",
        compact ? "mt-4" : "mt-10",
      )}
    >
      <div className="flex items-center gap-1 border-b border-[var(--border)] px-3 pt-2">
        {[
          ["all", "All Bets"],
          ["mine", "My Bets"],
          ["high", "High Rollers"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={cn(
              "relative px-3 py-3 text-xs font-semibold text-[var(--muted)] transition-colors hover:text-white",
              tab === key && "text-white",
            )}
          >
            {label}
            {tab === key ? (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--primary)]" />
            ) : null}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[650px]">
          <div className="grid grid-cols-[1.1fr_1fr_.65fr_.8fr_.7fr_.8fr] gap-4 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            <span>Game</span>
            <span>User</span>
            <span>Time</span>
            <span className="text-right">Bet Amount</span>
            <span className="text-right">Multiplier</span>
            <span className="text-right">Payout</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1.1fr_1fr_.65fr_.8fr_.7fr_.8fr] gap-4 border-t border-[var(--border)]/70 px-4 py-3 text-xs transition-colors hover:bg-[var(--surface-raised)]"
            >
              <span className="font-semibold">{row.game}</span>
              <span className="truncate text-[var(--muted)]">@{row.user}</span>
              <span className="text-[var(--muted)]">{row.time}</span>
              <span className="flex items-center justify-end gap-1.5 font-mono">
                {formatCredits(row.wager)}
                <CreditMark className="h-4 w-4 text-[8px]" />
              </span>
              <span
                className={cn(
                  "text-right font-mono",
                  row.multiplier >= 1
                    ? "text-[var(--primary)]"
                    : "text-[var(--muted)]",
                )}
              >
                {row.multiplier.toFixed(2)}×
              </span>
              <span className="flex items-center justify-end gap-1.5 font-mono font-semibold">
                {formatCredits(row.payout)}
                <CreditMark className="h-4 w-4 text-[8px]" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CasinoLobby() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Lobby");
  const demoSession = useDemoSession();
  const arcadeCredits =
    demoSession?.role === "student" ? demoSession.arcadeCredits : 500;
  const matchingGames = catalogGames.filter((game) =>
    game.title.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const filteredGames =
    filter === "Favourites"
      ? playableGames.slice(0, 3)
      : filter === "Recent"
        ? [playableGames[3], playableGames[0], playableGames[4]]
        : filter === "PlayGrid Originals"
          ? catalogGames.filter((game) => game.provider === "PlayGrid Originals")
          : catalogGames;

  return (
    <div className="mx-auto max-w-[1480px] px-3 pb-24 pt-4 sm:px-5 lg:px-7">
      <div className="flex items-center gap-2 overflow-x-auto rounded-[8px] bg-[var(--surface)] p-1.5 shadow-[0_3px_10px_rgba(0,0,0,.16)]">
        {[
          [Play, "Lobby"],
          [Sparkles, "PlayGrid Originals"],
          [Heart, "Favourites"],
          [History, "Recent"],
          [Grid3X3, "All Games"],
        ].map(([Icon, label]) => (
          <button
            key={String(label)}
            onClick={() => setFilter(String(label))}
            className={cn(
              "flex min-h-10 shrink-0 items-center gap-2 rounded-[6px] px-3 text-xs font-semibold transition-colors",
              filter === label
                ? "bg-[var(--surface-raised)] text-white"
                : "text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" />
            {String(label)}
          </button>
        ))}
        <div className="relative ml-auto hidden min-w-[230px] sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 border-0 bg-[var(--canvas)] pl-9 focus:ring-[var(--focus-soft)]"
            placeholder="Search games"
          />
        </div>
      </div>

      <div className="casino-hero relative mt-4 grid overflow-hidden rounded-[12px] border border-[var(--border)] lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)]">
        <div className="p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-semibold text-[var(--primary)]">PlayGrid Originals</p>
          <h1 className="mt-3 max-w-[10ch] text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
            Five games. One clear balance.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Play Dice, Mines, Plinko, Chicken, and Crash with fast controls and visible demo results.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="/casino/dice"
              className="casino-action inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-[var(--primary)] px-5 text-sm font-black text-[var(--primary-foreground)]"
            >
              <Play className="h-4 w-4 fill-current" />
              Play Dice
            </a>
            <span className="flex items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-xs font-semibold text-[var(--text)]">
              <CreditMark />
              {formatCredits(arcadeCredits)} demo credits
            </span>
          </div>
        </div>
        <div className="casino-hero-board grid gap-px border-t border-[var(--border)] bg-[var(--border)] p-px lg:border-t-0 lg:border-l">
          {[
            ["Chicken", "Cross one lane at a time", CarFront, "/casino/chicken"],
            ["Crash", "Cash out before impact", Activity, "/casino/crash"],
          ].map(([title, detail, Icon, href]) => (
            <a key={String(title)} href={String(href)} className="casino-feature-link group flex min-h-28 items-center gap-4 bg-[var(--surface)] p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus)]">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[9px] bg-[var(--primary-soft)] text-[var(--primary)]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <strong className="block text-sm">{String(title)}</strong>
                <span className="mt-1 block text-xs text-[var(--muted)]">{String(detail)}</span>
              </span>
              <ChevronRight className="ml-auto h-4 w-4 text-[var(--muted)] transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
            </a>
          ))}
        </div>
      </div>

      <div className="relative mt-4 sm:hidden">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="border-0 bg-[var(--surface)] pl-9"
          placeholder="Search games"
        />
      </div>

      {search ? (
        <LobbyRail
          title="Search results"
          detail={`${matchingGames.length} games match “${search}”`}
          games={matchingGames}
        />
      ) : filter === "Lobby" ? (
        <>
          <LobbyRail
            title="PlayGrid Originals"
            detail="Purpose-built games with fast, focused controls"
            games={playableGames}
          />
          <LobbyRail
            title="Browse games"
            detail="More original play-money games in development"
            games={upcomingGames}
          />
        </>
      ) : (
        <LobbyRail
          title={filter}
          detail={filter === "Favourites" ? "Your saved demo picks" : filter === "Recent" ? "Recently opened games" : "All games in this category"}
          games={filteredGames}
        />
      )}

      <ActivityTable />
    </div>
  );
}

async function runCasinoRpc(
  game: CasinoGame,
  wager: number,
  config: Record<string, unknown>,
) {
  if (getDemoSession()) return null;
  if (
    process.env.NODE_ENV === "development" &&
    window.location.hostname === "terminal.local"
  ) {
    return null;
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("play_casino_round", {
    p_game_key: game,
    p_wager: wager,
    p_config: config,
    p_client_seed: `web-${crypto.randomUUID()}`,
    p_idempotency_key: crypto.randomUUID(),
  });
  if (error) return null;
  return Array.isArray(data) ? data[0] : data;
}

function ModeTabs({
  mode,
  setMode,
  disabled = false,
}: {
  mode: BetMode;
  setMode: (mode: BetMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-full bg-[var(--canvas)] p-1">
      {(["manual", "auto"] as const).map((item) => (
        <button
          type="button"
          key={item}
          disabled={disabled}
          onClick={() => setMode(item)}
          aria-pressed={mode === item}
          className={cn(
            "min-h-11 rounded-full text-xs font-bold capitalize transition-[transform,color,background-color,box-shadow] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
            mode === item
              ? "bg-[var(--surface-hover)] text-white shadow-sm"
              : "text-[var(--muted)] hover:text-white",
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function FieldLabel({
  children,
  trailing,
}: {
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[var(--muted)]">
      <span>{children}</span>
      {trailing}
    </div>
  );
}

function BetAmountField({
  wager,
  setWager,
  balance,
  disabled,
}: {
  wager: number;
  setWager: (value: number) => void;
  balance: number;
  disabled?: boolean;
}) {
  return (
    <div>
      <FieldLabel trailing={<span>{formatCredits(balance)} available</span>}>
        Bet Amount
      </FieldLabel>
      <div className="casino-field flex h-11 overflow-hidden rounded-[5px] bg-[var(--canvas)] ring-1 ring-inset ring-[var(--surface-hover)] focus-within:ring-[var(--border-strong)]">
        <input
          aria-label="Bet amount"
          type="number"
          min={1}
          max={Math.max(1, balance)}
          disabled={disabled}
          value={wager}
          onChange={(event) =>
            setWager(Math.max(0, Number(event.target.value) || 0))
          }
          className="min-w-0 flex-1 bg-transparent px-3 font-mono text-sm font-semibold outline-none disabled:opacity-60"
        />
        <span className="flex items-center pr-2">
          <CreditMark />
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setWager(Math.max(1, Math.floor(wager / 2)))}
          aria-label="Halve bet amount"
          className="border-l border-[var(--surface-hover)] px-2.5 text-[11px] font-bold text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-white disabled:opacity-50"
        >
          ½
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setWager(Math.min(balance, Math.max(1, wager * 2)))}
          aria-label="Double bet amount"
          className="border-l border-[var(--surface-hover)] px-2.5 text-[11px] font-bold text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-white disabled:opacity-50"
        >
          2×
        </button>
      </div>
    </div>
  );
}

function ReadonlyCreditField({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="casino-field flex h-11 items-center rounded-[5px] bg-[var(--canvas)] px-3 ring-1 ring-inset ring-[var(--surface-hover)]">
        <span className="flex-1 font-mono text-sm font-semibold text-[var(--muted)]">
          {formatCredits(value)}
        </span>
        <CreditMark />
      </div>
    </div>
  );
}

function ReadonlyCountField({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="casino-field flex h-11 items-center rounded-[5px] bg-[var(--canvas)] px-3 ring-1 ring-inset ring-[var(--surface-hover)]">
        <span className="flex-1 font-mono text-sm font-semibold text-[var(--muted)]">
          {value}
        </span>
        <span className="text-[var(--primary)]">{icon}</span>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="casino-field h-11 w-full appearance-none rounded-[5px] bg-[var(--canvas)] px-3 pr-9 text-sm font-semibold outline-none ring-1 ring-inset ring-[var(--surface-hover)] focus:ring-[var(--border-strong)] disabled:opacity-55"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
      </div>
    </div>
  );
}

function BetControls({
  balance,
  wager,
  setWager,
  potential,
  action,
  autoAction,
  actionLabel,
  disabled,
  lockWager,
  mode,
  setMode,
  children,
}: {
  balance: number;
  wager: number;
  setWager: (value: number) => void;
  potential: number;
  action: () => void | AutoRoundResult | null | Promise<AutoRoundResult | null>;
  autoAction?: () => Promise<AutoRoundResult | null>;
  actionLabel: string;
  disabled?: boolean;
  lockWager?: boolean;
  mode: BetMode;
  setMode: (mode: BetMode) => void;
  children?: ReactNode;
}) {
  const [autoSettings, setAutoSettings] = useState(defaultAutoBetSettings);
  const autoRunner = useAutoBetRunner({
    runRound: autoAction ?? (async () => (await action()) ?? null),
    balance,
    wager,
  });
  const autoRunning = autoRunner.state.running;
  const autoProgress = Math.min(
    100,
    (autoRunner.state.completed / Math.max(1, autoSettings.rounds)) * 100,
  );

  function updateAutoSetting<Key extends keyof AutoBetSettings>(
    key: Key,
    value: AutoBetSettings[Key],
  ) {
    setAutoSettings((current) => ({ ...current, [key]: value }));
  }

  return (
    <aside className="casino-control flex h-full flex-col p-3.5 sm:p-4">
      <ModeTabs
        mode={mode}
        setMode={setMode}
        disabled={autoRunning || Boolean(lockWager)}
      />
      <div className="mt-4 space-y-4">
        <BetAmountField
          wager={wager}
          setWager={setWager}
          balance={balance}
          disabled={lockWager || autoRunning}
        />
        {mode === "auto" ? (
          <fieldset disabled={autoRunning} className="space-y-3 disabled:opacity-70">
            <div>
              <FieldLabel>Number of Bets</FieldLabel>
              <div className="casino-field flex h-11 overflow-hidden rounded-[5px] bg-[var(--canvas)] ring-1 ring-inset ring-[var(--surface-hover)]">
                <input
                  aria-label="Number of automatic bets"
                  type="number"
                  min={1}
                  max={100}
                  value={autoSettings.rounds}
                  onChange={(event) =>
                    updateAutoSetting(
                      "rounds",
                      Math.min(
                        100,
                        Math.max(1, Number(event.target.value) || 1),
                      ),
                    )
                  }
                  className="min-w-0 flex-1 bg-transparent px-3 font-mono text-sm font-semibold outline-none"
                />
                <span className="grid w-11 place-items-center border-l border-[var(--surface-hover)] text-[var(--muted)]">
                  <Bot className="h-4 w-4" />
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <FieldLabel>Stop on Profit</FieldLabel>
                <input
                  aria-label="Stop automatic betting on profit"
                  type="number"
                  min={0}
                  value={autoSettings.stopOnProfit}
                  onChange={(event) =>
                    updateAutoSetting(
                      "stopOnProfit",
                      Math.max(0, Number(event.target.value) || 0),
                    )
                  }
                  className="casino-field h-11 w-full rounded-[5px] bg-[var(--canvas)] px-3 font-mono text-xs font-semibold outline-none ring-1 ring-inset ring-[var(--surface-hover)]"
                />
              </label>
              <label className="block">
                <FieldLabel>Stop on Loss</FieldLabel>
                <input
                  aria-label="Stop automatic betting on loss"
                  type="number"
                  min={0}
                  value={autoSettings.stopOnLoss}
                  onChange={(event) =>
                    updateAutoSetting(
                      "stopOnLoss",
                      Math.max(0, Number(event.target.value) || 0),
                    )
                  }
                  className="casino-field h-11 w-full rounded-[5px] bg-[var(--canvas)] px-3 font-mono text-xs font-semibold outline-none ring-1 ring-inset ring-[var(--surface-hover)]"
                />
              </label>
            </div>
            <SelectField
              label="Bet Speed"
              value={autoSettings.intervalMs}
              onChange={(value) =>
                updateAutoSetting("intervalMs", Number(value))
              }
            >
              <option value={800}>Relaxed</option>
              <option value={450}>Normal</option>
              <option value={180}>Fast</option>
            </SelectField>
          </fieldset>
        ) : null}
        <fieldset disabled={autoRunning} className="space-y-4 disabled:opacity-70">
          {children}
        </fieldset>
        <ReadonlyCreditField label="Profit on Win" value={potential - wager} />
        {mode === "auto" &&
        (autoRunning ||
          autoRunner.state.completed > 0 ||
          autoRunner.state.stopReason) ? (
          <div className="auto-bet-progress rounded-[6px] bg-[var(--canvas)] p-3 ring-1 ring-inset ring-[var(--surface-hover)]" aria-live="polite">
            <div className="flex items-center justify-between gap-3 text-[10px] font-bold">
              <span>
                {autoRunning
                  ? autoRunner.state.stopping
                    ? "Finishing current round"
                    : "Auto bet running"
                  : autoRunner.state.stopReason}
              </span>
              <span className="font-mono text-[var(--primary)]">
                {autoRunner.state.completed}/{autoSettings.rounds}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-hover)]">
              <span
                className="block h-full rounded-full bg-[var(--primary)] transition-[width] duration-300"
                style={{ width: `${autoProgress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[9px] text-[var(--muted)]">
              <span>Session P/L</span>
              <span
                className={cn(
                  "font-mono font-bold",
                  autoRunner.state.sessionProfit >= 0
                    ? "text-[var(--primary)]"
                    : "text-[var(--loss)]",
                )}
              >
                {autoRunner.state.sessionProfit >= 0 ? "+" : ""}
                {formatSignedCredits(autoRunner.state.sessionProfit)}
              </span>
            </div>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => {
          if (mode === "manual") {
            void action();
          } else if (autoRunning) {
            autoRunner.stop();
          } else {
            void autoRunner.start(autoSettings);
          }
        }}
        disabled={
          mode === "manual"
            ? disabled || wager < 1 || (!lockWager && wager > balance)
            : !autoRunning &&
              (disabled || wager < 1 || wager > getPlayableBalance(balance))
        }
        className={cn(
          "casino-action mt-4 min-h-12 w-full rounded-[6px] px-4 text-sm font-black disabled:cursor-not-allowed disabled:bg-[#3f5b4b] disabled:text-[#9bb1a3] disabled:shadow-none",
          mode === "auto" && autoRunning
            ? "casino-auto-stop bg-[var(--loss)] text-white"
            : "bg-[var(--primary)] text-[var(--primary-foreground)]",
        )}
      >
        {mode === "auto"
          ? autoRunning
            ? autoRunner.state.stopping
              ? "Stopping…"
              : "Stop Auto Bet"
            : `Start Auto Bet · ${autoSettings.rounds}`
          : actionLabel}
      </button>
      <div className="mt-auto hidden pt-6 text-[10px] leading-4 text-[var(--muted)] lg:block">
        <div className="flex items-center gap-1.5 font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--primary)]" />
          Fairness receipt preview
        </div>
        <p className="mt-1.5">
          Virtual credits only. Outcomes have no monetary value.
        </p>
      </div>
    </aside>
  );
}

function GameToolbar({
  game,
  sound,
  setSound,
  motion,
  setMotion,
  fullscreen,
  setFullscreen,
}: {
  game: CasinoGame;
  sound: boolean;
  setSound: (value: boolean) => void;
  motion: boolean;
  setMotion: (value: boolean) => void;
  fullscreen: boolean;
  setFullscreen: (value: boolean) => void;
}) {
  return (
    <div className="flex min-h-14 items-center border-t border-[var(--surface-hover)] bg-[var(--surface)] px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-[5px] bg-[var(--primary)] text-[var(--primary-foreground)]">
          {game === "dice" ? (
            <Dice5 className="h-4 w-4" />
          ) : game === "mines" ? (
            <Bomb className="h-4 w-4" />
          ) : game === "plinko" ? (
            <CircleDot className="h-4 w-4" />
          ) : game === "chicken" ? (
            <CarFront className="h-4 w-4" />
          ) : (
            <Activity className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold capitalize">{game}</p>
          <p className="truncate text-[9px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            PlayGrid Originals
          </p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => setMotion(!motion)}
          className={cn(
            "grid h-11 w-11 place-items-center rounded-[6px] text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-white",
            motion && "text-white",
          )}
          aria-pressed={motion}
          aria-label={motion ? "Disable animations" : "Enable animations"}
          title={motion ? "Animations on" : "Animations off"}
        >
          <Zap className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setSound(!sound)}
          className={cn(
            "grid h-11 w-11 place-items-center rounded-[6px] text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-white",
            sound && "text-white",
          )}
          aria-pressed={sound}
          aria-label={sound ? "Mute sound" : "Enable sound"}
        >
          {sound ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </button>
        <a
          href="/fairness"
          className="grid h-11 w-11 place-items-center rounded-[6px] text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-white"
          aria-label="Fairness settings"
        >
          <ShieldCheck className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={() => setFullscreen(!fullscreen)}
          className="grid h-11 w-11 place-items-center rounded-[6px] text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-white"
          aria-pressed={fullscreen}
          aria-label={fullscreen ? "Exit expanded game" : "Expand game"}
        >
          {fullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Expand className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function GameFrame({
  game,
  controls,
  stage,
  motion: controlledMotion,
  onMotionChange,
}: {
  game: CasinoGame;
  controls: ReactNode;
  stage: ReactNode;
  motion?: boolean;
  onMotionChange?: (value: boolean) => void;
}) {
  const [sound, setSound] = useState(false);
  const [internalMotion, setInternalMotion] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const motion = controlledMotion ?? internalMotion;

  useEffect(() => {
    if (!fullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreen]);

  useEffect(() => {
    if (!sound) return;
    const onGameSound = (event: Event) => {
      playGameSound((event as CustomEvent<GameSound>).detail);
    };
    window.addEventListener(gameSoundEvent, onGameSound);
    return () => window.removeEventListener(gameSoundEvent, onGameSound);
  }, [sound]);

  function setMotion(value: boolean) {
    if (controlledMotion === undefined) setInternalMotion(value);
    onMotionChange?.(value);
  }

  function toggleSound() {
    const next = !sound;
    if (next) ensureGameAudio();
    setSound(next);
  }

  return (
    <div
      data-motion={motion ? "full" : "reduced"}
      className={cn(
        "casino-game-frame overflow-hidden rounded-[8px] bg-[var(--surface)]",
        fullscreen &&
          "fixed inset-0 z-[100] rounded-none bg-[var(--canvas)] p-2 sm:p-4",
        !motion && "[&_*]:!animate-none",
      )}
    >
      <div
        className={cn(
          "game-frame-layout",
          fullscreen && "h-full min-h-0",
        )}
      >
        <div className="game-frame-controls">{controls}</div>
        <div className="game-frame-stage relative min-h-[390px] overflow-hidden lg:min-h-[560px]">
          {stage}
        </div>
        <div className="game-frame-toolbar">
          <GameToolbar
            game={game}
            sound={sound}
            setSound={(value) => {
              if (value !== sound) toggleSound();
            }}
            motion={motion}
            setMotion={setMotion}
            fullscreen={fullscreen}
            setFullscreen={setFullscreen}
          />
        </div>
      </div>
    </div>
  );
}

function StatInput({
  label,
  value,
  suffix,
  onChange,
  action,
}: {
  label: string;
  value: string;
  suffix?: string;
  onChange?: (value: string) => void;
  action?: ReactNode;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <div className="casino-field flex h-12 overflow-hidden rounded-[5px] bg-[var(--surface)] ring-1 ring-inset ring-[var(--surface-hover)]">
        <input
          value={value}
          readOnly={!onChange}
          onChange={(event) => onChange?.(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 font-mono text-sm font-bold outline-none"
        />
        {suffix ? (
          <span className="grid min-w-10 place-items-center text-sm font-bold text-[var(--muted)]">
            {suffix}
          </span>
        ) : null}
        {action}
      </div>
    </label>
  );
}

function DiceGame({ balance }: { balance: number }) {
  const [mode, setMode] = useState<BetMode>("manual");
  const [wager, setWager] = useState(25);
  const [target, setTarget] = useState(50.5);
  const [direction, setDirection] = useState<"over" | "under">("over");
  const [result, setResult] = useState<number | null>(null);
  const [rollingNumber, setRollingNumber] = useState<number | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [rolling, setRolling] = useState(false);
  const [round, setRound] = useState(0);
  const [history, setHistory] = useState<
    { value: number; won: boolean; id: number }[]
  >([]);
  const roundLockRef = useRef(false);

  const chance = direction === "over" ? 100 - target : target;
  const multiplier = Math.max(1.0101, 99 / Math.max(1, chance));
  const payout = Math.floor(wager * multiplier);
  const visualResult = rollingNumber ?? result;

  async function roll(): Promise<AutoRoundResult | null> {
    if (
      roundLockRef.current ||
      wager < 1 ||
      wager > getPlayableBalance(balance)
    ) {
      return null;
    }
    roundLockRef.current = true;
    emitGameFeedback("bet");
    setRolling(true);
    setWon(null);
    setResult(null);
    setRound((value) => value + 1);

    const payloadPromise = runCasinoRpc("dice", wager, { target, direction });
    for (let index = 0; index < 9; index += 1) {
      setRollingNumber(Math.round(Math.random() * 10000) / 100);
      await wait(42 + index * 7);
    }
    const payload = await payloadPromise;
    const next = Number(
      payload?.result_value ?? Math.round(Math.random() * 10000) / 100,
    );
    const settleFrom = Math.round(Math.random() * 10000) / 100;
    for (const [offset, delay] of [
      [settleFrom - next, 72],
      [(settleFrom - next) * 0.45, 84],
      [(next > 50 ? -1 : 1) * 5.5, 96],
      [(next > 50 ? 1 : -1) * 1.8, 112],
      [0, 128],
    ] as const) {
      setRollingNumber(
        Math.min(99.99, Math.max(0, Math.round((next + offset) * 100) / 100)),
      );
      await wait(delay);
    }
    const didWin = direction === "over" ? next > target : next < target;
    emitGameFeedback(didWin ? "win" : "loss");
    setRollingNumber(null);
    setResult(next);
    setWon(didWin);
    setHistory((items) =>
      [{ value: next, won: didWin, id: Date.now() }, ...items].slice(0, 8),
    );
    adjustDemoArcadeCredits(didWin ? payout - wager : -wager);
    setRolling(false);
    await wait(260);
    roundLockRef.current = false;
    return { net: didWin ? payout - wager : -wager, won: didWin };
  }

  const track =
    direction === "over"
      ? `linear-gradient(90deg, var(--loss) 0%, var(--loss) ${target}%, var(--primary) ${target}%, var(--primary) 100%)`
      : `linear-gradient(90deg, var(--primary) 0%, var(--primary) ${target}%, var(--loss) ${target}%, var(--loss) 100%)`;

  const controls = (
    <BetControls
      balance={balance}
      wager={wager}
      setWager={setWager}
      potential={payout}
      action={roll}
      mode={mode}
      setMode={setMode}
      actionLabel={rolling ? "Rolling…" : "Bet"}
      disabled={rolling || chance < 1 || chance > 98}
    />
  );

  const stage = (
    <section
      data-round={round}
      className={cn(
        "casino-stage relative flex h-full min-h-[390px] flex-col justify-center px-4 py-8 sm:px-8 lg:px-12",
        rolling && "dice-stage-rolling",
        won === true && "dice-stage-win",
        won === false && "dice-stage-loss",
      )}
    >
      <div className="absolute right-4 top-4 z-10 flex max-w-[70%] flex-row-reverse gap-1.5 overflow-hidden sm:right-6 sm:top-6">
        {history.map((item) => (
          <span
            key={item.id}
            className={cn(
              "rounded-[4px] px-2 py-1 font-mono text-[10px] font-black text-white shadow",
              item.won ? "bg-[var(--win)]" : "bg-[#d73858]",
            )}
          >
            {item.value.toFixed(2)}
          </span>
        ))}
      </div>

      <div className="relative z-[1] mx-auto w-full max-w-[780px] pt-12 sm:pt-8">
        <div className="dice-positioning-surface relative h-28">
          {visualResult !== null ? (
            <div
              key={`${round}-${rolling ? "rolling" : "settled"}`}
              className="dice-result-position absolute left-0 top-0 z-20"
              style={{
                "--dice-position": Math.min(98, Math.max(2, visualResult)),
              } as CSSProperties}
            >
            <div
              className={cn(
                "dice-result-chip min-w-[66px] rounded-[5px] px-2.5 py-2 text-center font-mono text-sm font-black text-white shadow-xl",
                rolling
                  ? "bg-[var(--border-strong)]"
                  : won
                    ? "bg-[var(--win)]"
                    : "bg-[#d73858]",
              )}
              aria-live="polite"
            >
              {visualResult.toFixed(2)}
              <span
                className={cn(
                  "absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[7px] border-t-[7px] border-x-transparent",
                  rolling
                    ? "border-t-[var(--border-strong)]"
                    : won
                      ? "border-t-[var(--win)]"
                      : "border-t-[#d73858]",
                )}
              />
            </div>
            </div>
          ) : null}

          <div className="dice-track absolute inset-x-0 bottom-5 h-4 rounded-full bg-[#071821] p-[4px] shadow-[inset_0_2px_5px_rgba(0,0,0,.5)]">
            <div
              className="h-full rounded-full"
              style={{ background: track }}
            />
            <span
              className="dice-knob-position absolute left-0 top-1/2"
              style={{ "--dice-position": target } as CSSProperties}
            >
              <span className="dice-knob block h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--surface-hover)]" />
            </span>
            <input
              aria-label="Dice target"
              type="range"
              min={2}
              max={98}
              step={0.01}
              value={target}
              disabled={rolling}
              onChange={(event) => setTarget(Number(event.target.value))}
              className="dice-range absolute inset-x-0 top-1/2 -translate-y-1/2"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-between font-mono text-[10px] font-semibold text-[var(--muted)]">
            {[0, 25, 50, 75, 100].map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <StatInput
            label="Multiplier"
            value={multiplier.toFixed(4)}
            suffix="×"
          />
          <StatInput
            label={direction === "over" ? "Roll Over" : "Roll Under"}
            value={target.toFixed(2)}
            onChange={(value) =>
              setTarget(Math.min(98, Math.max(2, Number(value) || 2)))
            }
            action={
              <button
                onClick={() =>
                  setDirection((value) =>
                    value === "over" ? "under" : "over",
                  )
                }
                className="grid w-11 place-items-center border-l border-[var(--surface-hover)] text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-white"
                aria-label="Switch roll direction"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            }
          />
          <StatInput
            label="Win Chance"
            value={chance.toFixed(4)}
            suffix="%"
          />
        </div>

        <p
          className={cn(
            "mt-5 min-h-5 text-center text-xs font-bold",
            won === true
              ? "text-[var(--primary)]"
              : won === false
                ? "text-[var(--loss)]"
                : "text-[var(--muted)]",
          )}
          role="status"
        >
          {rolling
            ? "Generating result…"
            : result === null
              ? "Set the target and press Bet"
              : won
                ? `You won ${formatCredits(payout)} credits`
                : `${result.toFixed(2)} missed the target`}
        </p>
      </div>
    </section>
  );

  return <GameFrame game="dice" controls={controls} stage={stage} />;
}

function minesMultiplier(mineCount: number, safePicks: number) {
  if (safePicks === 0) return 1;
  let multiplier = 0.99;
  for (let index = 0; index < safePicks; index += 1) {
    multiplier *= (25 - index) / (25 - mineCount - index);
  }
  return multiplier;
}

function MinesGame({ balance }: { balance: number }) {
  const [mode, setMode] = useState<BetMode>("manual");
  const [wager, setWager] = useState(25);
  const [mineCount, setMineCount] = useState(3);
  const [autoPicks, setAutoPicks] = useState(3);
  const [active, setActive] = useState(false);
  const [mines, setMines] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [lost, setLost] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [explodedIndex, setExplodedIndex] = useState<number | null>(null);
  const [showAllMines, setShowAllMines] = useState(false);
  const [round, setRound] = useState(0);
  const roundLockRef = useRef(false);
  const multiplier = minesMultiplier(mineCount, revealed.length);
  const payout = Math.floor(wager * multiplier);

  function generateMineBoard() {
    const generated = new Set<number>();
    while (generated.size < mineCount) {
      generated.add(Math.floor(Math.random() * 25));
    }
    return [...generated];
  }

  function start() {
    if (
      active ||
      roundLockRef.current ||
      wager < 1 ||
      wager > getPlayableBalance(balance)
    ) {
      return;
    }
    adjustDemoArcadeCredits(-wager);
    emitGameFeedback("bet");
    setMines(generateMineBoard());
    setRevealed([]);
    setLost(false);
    setCashedOut(false);
    setExplodedIndex(null);
    setShowAllMines(false);
    setActive(true);
    setRound((value) => value + 1);
  }

  async function reveal(index: number) {
    if (!active || revealed.includes(index)) return;
    setRevealed((items) => [...items, index]);
    if (mines.includes(index)) {
      emitGameFeedback("loss");
      setExplodedIndex(index);
      setLost(true);
      setActive(false);
      await wait(240);
      setShowAllMines(true);
    } else {
      emitGameFeedback("step");
    }
  }

  function cashOut(): AutoRoundResult | null {
    if (!active || revealed.length === 0) return null;
    adjustDemoArcadeCredits(payout);
    emitGameFeedback("cashout");
    setActive(false);
    setCashedOut(true);
    return { net: payout - wager, won: payout >= wager };
  }

  function randomReveal() {
    const candidates = Array.from({ length: 25 }, (_, index) => index).filter(
      (index) => !revealed.includes(index),
    );
    if (!candidates.length) return;
    void reveal(candidates[Math.floor(Math.random() * candidates.length)]);
  }

  async function runAutomaticMinesRound(): Promise<AutoRoundResult | null> {
    if (
      roundLockRef.current ||
      active ||
      wager < 1 ||
      wager > getPlayableBalance(balance)
    ) {
      return null;
    }

    roundLockRef.current = true;
    const generatedMines = generateMineBoard();
    const order = Array.from({ length: 25 }, (_, index) => index);
    for (let index = order.length - 1; index > 0; index -= 1) {
      const swapWith = Math.floor(Math.random() * (index + 1));
      [order[index], order[swapWith]] = [order[swapWith], order[index]];
    }

    adjustDemoArcadeCredits(-wager);
    emitGameFeedback("bet");
    setMines(generatedMines);
    setRevealed([]);
    setLost(false);
    setCashedOut(false);
    setExplodedIndex(null);
    setShowAllMines(false);
    setActive(true);
    setRound((value) => value + 1);
    await wait(220);

    const picked: number[] = [];
    for (const tile of order.slice(0, autoPicks)) {
      picked.push(tile);
      setRevealed([...picked]);
      await wait(210);
      if (generatedMines.includes(tile)) {
        emitGameFeedback("loss");
        setExplodedIndex(tile);
        setLost(true);
        setActive(false);
        await wait(240);
        setShowAllMines(true);
        await wait(520);
        roundLockRef.current = false;
        return { net: -wager, won: false };
      }
      emitGameFeedback("step");
    }

    const automaticMultiplier = minesMultiplier(mineCount, picked.length);
    const automaticPayout = Math.floor(wager * automaticMultiplier);
    adjustDemoArcadeCredits(automaticPayout);
    emitGameFeedback("cashout");
    setActive(false);
    setCashedOut(true);
    await wait(520);
    roundLockRef.current = false;
    return {
      net: automaticPayout - wager,
      won: automaticPayout >= wager,
    };
  }

  const controls = (
    <BetControls
      balance={balance}
      wager={wager}
      setWager={setWager}
      potential={active ? payout : wager * 1.1}
      action={active ? cashOut : start}
      autoAction={runAutomaticMinesRound}
      mode={mode}
      setMode={setMode}
      actionLabel={
        active
          ? revealed.length
            ? `Cashout ${multiplier.toFixed(2)}×`
            : "Select a tile"
          : "Bet"
      }
      disabled={active ? revealed.length === 0 : false}
      lockWager={active}
    >
      <SelectField
        label="Mines"
        value={mineCount}
        disabled={active}
        onChange={(value) => setMineCount(Number(value))}
      >
        {Array.from({ length: 24 }, (_, index) => index + 1).map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </SelectField>
      <ReadonlyCountField
        label="Gems"
        value={25 - mineCount}
        icon={<Gem className="h-4 w-4" />}
      />
      {mode === "auto" ? (
        <SelectField
          label="Gems per Bet"
          value={autoPicks}
          disabled={active}
          onChange={(value) => setAutoPicks(Number(value))}
        >
          {Array.from(
            { length: Math.max(1, 25 - mineCount) },
            (_, index) => index + 1,
          ).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </SelectField>
      ) : null}
    </BetControls>
  );

  const stage = (
    <section
      key={round}
      className="casino-stage relative grid h-full min-h-[470px] place-items-center px-3 py-8 sm:px-6"
    >
      <div className="relative z-[1] w-full max-w-[560px]">
        <div className="mb-4 flex min-h-8 items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            {lost
              ? "Mine hit"
              : cashedOut
                ? "Round complete"
                : active
                  ? `${25 - mineCount - revealed.length} safe tiles remain`
                  : "Choose mines and place a bet"}
          </span>
          {active ? (
            <button
              onClick={randomReveal}
              className="flex min-h-8 items-center gap-1.5 rounded-[5px] bg-[var(--surface)] px-2.5 text-[10px] font-bold text-[var(--muted)] ring-1 ring-inset ring-[var(--surface-hover)] hover:text-white"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Pick random tile
            </button>
          ) : null}
        </div>

        <div
          className="relative grid grid-cols-5 gap-2 sm:gap-3"
          role="grid"
          aria-label="Mines board"
        >
          {Array.from({ length: 25 }, (_, index) => {
            const shown = revealed.includes(index);
            const isMine = mines.includes(index);
            const revealMine =
              lost &&
              isMine &&
              (showAllMines || explodedIndex === index);
            const safe = shown && !isMine;
            return (
              <button
                key={index}
                role="gridcell"
                disabled={!active || shown}
                onClick={() => void reveal(index)}
                aria-label={`Row ${Math.floor(index / 5) + 1}, column ${
                  (index % 5) + 1
                }, ${safe ? "safe" : revealMine ? "mine" : "hidden"}`}
                className={cn(
                  "mines-tile grid aspect-square min-h-12 place-items-center rounded-[7px] bg-[var(--surface-raised)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                  safe && "mines-tile-safe",
                  revealMine && "mines-tile-mine",
                  !active && !safe && !revealMine && "opacity-85",
                )}
                style={
                  revealMine
                    ? ({ animationDelay: `${index * 18}ms` } as CSSProperties)
                    : undefined
                }
              >
                {safe ? (
                  <Gem
                    className="mines-gem h-[44%] w-[44%] text-[var(--primary)]"
                    strokeWidth={2.4}
                  />
                ) : revealMine ? (
                  <Bomb
                    className="mines-bomb h-[44%] w-[44%] text-[var(--loss)]"
                    strokeWidth={2.4}
                  />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-[var(--surface-hover)] shadow-[inset_0_1px_0_rgba(255,255,255,.08)]" />
                )}
              </button>
            );
          })}

          {!active && (lost || cashedOut) ? (
            <div
              className={cn(
                "casino-win-pop pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-[6px] bg-[var(--surface)] px-5 py-3 text-center shadow-[0_10px_30px_rgba(0,0,0,.38)] ring-2",
                lost ? "ring-[var(--loss)]" : "ring-[var(--primary)]",
              )}
            >
              <p
                className={cn(
                  "font-mono text-xl font-black",
                  lost ? "text-[var(--loss)]" : "text-[var(--primary)]",
                )}
              >
                {lost ? "BUST" : `${multiplier.toFixed(2)}×`}
              </p>
              <p className="mt-0.5 flex items-center justify-center gap-1.5 text-[10px] font-bold text-[var(--muted)]">
                {lost ? formatCredits(wager) : formatCredits(payout)}{" "}
                <CreditMark className="h-4 w-4" />
              </p>
            </div>
          ) : null}
        </div>

        {active && revealed.length > 0 ? (
          <div className="mx-auto mt-4 flex w-fit items-center gap-3 rounded-full bg-[var(--surface)] px-4 py-2 text-[10px] font-bold shadow-lg ring-1 ring-inset ring-[var(--surface-hover)]">
            <span className="font-mono text-[var(--primary)]">
              {multiplier.toFixed(2)}×
            </span>
            <span className="text-[var(--muted)]">
              {formatCredits(payout)} ready to cash out
            </span>
          </div>
        ) : null}

        <p
          className={cn(
            "mt-6 min-h-5 text-center text-xs font-bold",
            lost
              ? "text-[var(--loss)]"
              : cashedOut
                ? "text-[var(--primary)]"
                : "text-[var(--muted)]",
          )}
          role="status"
        >
          {lost
            ? `${formatCredits(wager)} credits lost`
            : cashedOut
              ? `${formatCredits(payout)} credits secured`
              : active
                ? "Each safe reveal increases the cashout multiplier"
                : "The board unlocks after you press Bet"}
        </p>
      </div>
    </section>
  );

  return <GameFrame game="mines" controls={controls} stage={stage} />;
}

function getPlinkoMultipliers(rows: number, risk: Risk) {
  return Array.from({ length: rows + 1 }, (_, index) => {
    const distance = Math.abs(index - rows / 2) / (rows / 2);
    if (risk === "low") {
      if (distance > 0.9) return 5.6;
      if (distance > 0.72) return 2.1;
      if (distance > 0.5) return 1.1;
      if (distance > 0.26) return 0.7;
      return 0.5;
    }
    if (risk === "medium") {
      if (distance > 0.9) return rows >= 14 ? 26 : 13;
      if (distance > 0.72) return 3;
      if (distance > 0.5) return 1.3;
      if (distance > 0.26) return 0.5;
      return 0.3;
    }
    if (distance > 0.9) {
      return rows >= 16 ? 1000 : rows >= 14 ? 620 : 110;
    }
    if (distance > 0.72) return rows >= 14 ? 14 : 9;
    if (distance > 0.5) return 2;
    if (distance > 0.26) return 0.4;
    return 0.2;
  });
}

type PlinkoPoint = { x: number; y: number };
type PlinkoPath = {
  id: number;
  path: string;
  points: PlinkoPoint[];
  landing: number;
};

function createPlinkoPath(rows: number, forcedLanding?: number): PlinkoPath {
  let decisions: boolean[];
  if (forcedLanding !== undefined) {
    const clamped = Math.max(0, Math.min(rows, forcedLanding));
    decisions = [
      ...Array.from({ length: clamped }, () => true),
      ...Array.from({ length: rows - clamped }, () => false),
    ].sort(() => Math.random() - 0.5);
  } else {
    decisions = Array.from({ length: rows }, () => Math.random() >= 0.5);
  }

  const width = 800;
  const center = width / 2;
  const gapX = Math.min(44, 620 / (rows + 2));
  const top = 62;
  const bottom = 408;
  const gapY = (bottom - top) / Math.max(1, rows - 1);
  const points: PlinkoPoint[] = [{ x: center, y: 18 }];
  let x = center;

  decisions.forEach((right, index) => {
    const y = top + index * gapY;
    points.push({ x, y });
    x += right ? gapX / 2 : -gapX / 2;
  });
  points.push({ x, y: 458 });

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const next = points[index];
    const vertical = next.y - previous.y;
    path += ` C ${previous.x} ${previous.y + vertical * 0.48}, ${next.x} ${
      next.y - vertical * 0.2
    }, ${next.x} ${next.y}`;
  }

  return {
    id: Date.now(),
    path,
    points: points.slice(1, -1),
    landing: decisions.filter(Boolean).length,
  };
}

function PlinkoBoard({
  rows,
  risk,
  dropping,
  roundPath,
  landing,
}: {
  rows: number;
  risk: Risk;
  dropping: boolean;
  roundPath: PlinkoPath | null;
  landing: number | null;
}) {
  const width = 800;
  const center = width / 2;
  const gapX = Math.min(44, 620 / (rows + 2));
  const top = 62;
  const bottom = 408;
  const gapY = (bottom - top) / Math.max(1, rows - 1);
  const multipliers = useMemo(
    () => getPlinkoMultipliers(rows, risk),
    [rows, risk],
  );

  const pegs = useMemo(
    () =>
      Array.from({ length: rows }, (_, row) => {
        const count = row + 3;
        const start = center - ((count - 1) * gapX) / 2;
        return Array.from({ length: count }, (_, column) => ({
          x: start + column * gapX,
          y: top + row * gapY,
          key: `${row}-${column}`,
        }));
      }).flat(),
    [rows, center, gapX, gapY],
  );

  return (
    <div className="relative mx-auto w-full max-w-[820px]">
      <svg
        viewBox="0 0 800 480"
        className="block h-auto w-full overflow-visible"
        role="img"
        aria-label="Animated Plinko board"
      >
        <defs>
          <radialGradient id="plinko-ball-fill" cx="35%" cy="28%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#edf2f5" />
            <stop offset="100%" stopColor="#aab7bf" />
          </radialGradient>
        </defs>
        {pegs.map((peg) => (
          <circle
            key={peg.key}
            cx={peg.x}
            cy={peg.y}
            r={rows > 13 ? 4.2 : 5}
            fill="var(--muted)"
          />
        ))}

        {dropping && roundPath
          ? roundPath.points.map((point, index) => (
              <circle
                key={`${roundPath.id}-hit-${index}`}
                cx={point.x}
                cy={point.y}
                r={rows > 13 ? 4.2 : 5}
                fill="var(--muted)"
                className="plinko-hit"
                style={{
                  animationDelay: `${(index * 1580) / rows}ms`,
                }}
              />
            ))
          : null}

        {dropping && roundPath ? (
          <circle
            key={roundPath.id}
            r={10}
            fill="url(#plinko-ball-fill)"
            className="plinko-ball"
          >
            <animateMotion
              dur="1.7s"
              path={roundPath.path}
              fill="freeze"
              calcMode="linear"
            />
          </circle>
        ) : (
          <circle
            cx={center}
            cy={18}
            r={9}
            fill="url(#plinko-ball-fill)"
            opacity={0.65}
          />
        )}
      </svg>

      <div
        className="mx-auto -mt-1 grid gap-[3px] px-1 sm:gap-1"
        style={{ gridTemplateColumns: `repeat(${rows + 1}, minmax(0, 1fr))` }}
      >
        {multipliers.map((value, index) => {
          const distance = Math.abs(index - rows / 2) / (rows / 2);
          const color =
            distance > 0.88
              ? "var(--loss)"
              : distance > 0.64
                ? "#f9733f"
                : distance > 0.42
                  ? "var(--warning)"
                  : "#ffc642";
          return (
            <div
              key={`${rows}-${risk}-${index}`}
              className={cn(
                "plinko-bin flex min-h-7 items-center justify-center rounded-[3px] px-0.5 font-mono text-[7px] font-black text-[#23190b] shadow-[0_3px_0_rgba(0,0,0,.22)] sm:min-h-9 sm:text-[9px]",
                landing === index && "plinko-bin-hit",
              )}
              style={{ backgroundColor: color, color }}
            >
              <span className="text-[#25190a]">
                {value >= 100 ? Math.round(value) : value}×
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlinkoGame({ balance }: { balance: number }) {
  const [mode, setMode] = useState<BetMode>("manual");
  const [wager, setWager] = useState(25);
  const [risk, setRisk] = useState<Risk>("medium");
  const [rows, setRows] = useState(12);
  const [dropping, setDropping] = useState(false);
  const [landing, setLanding] = useState<number | null>(null);
  const [roundPath, setRoundPath] = useState<PlinkoPath | null>(null);
  const [history, setHistory] = useState<
    { multiplier: number; id: number }[]
  >([]);
  const roundLockRef = useRef(false);
  const multipliers = useMemo(
    () => getPlinkoMultipliers(rows, risk),
    [rows, risk],
  );
  const maxPayout = wager * Math.max(...multipliers);

  async function drop(): Promise<AutoRoundResult | null> {
    if (
      roundLockRef.current ||
      wager < 1 ||
      wager > getPlayableBalance(balance)
    ) {
      return null;
    }
    roundLockRef.current = true;
    emitGameFeedback("bet");
    setDropping(true);
    setLanding(null);
    const payload = await runCasinoRpc("plinko", wager, { risk, rows });
    const payloadLanding =
      payload?.landing_index === undefined
        ? undefined
        : Number(payload.landing_index);
    const path = createPlinkoPath(rows, payloadLanding);
    setRoundPath(path);
    await wait(1770);
    const multiplier = multipliers[path.landing];
    const payout = Math.floor(wager * multiplier);
    emitGameFeedback(multiplier >= 1 ? "win" : "loss");
    setLanding(path.landing);
    setHistory((items) =>
      [{ multiplier, id: Date.now() }, ...items].slice(0, 8),
    );
    adjustDemoArcadeCredits(payout - wager);
    setDropping(false);
    await wait(320);
    roundLockRef.current = false;
    return { net: payout - wager, won: payout >= wager };
  }

  const landedMultiplier =
    landing === null ? null : multipliers[Math.min(landing, multipliers.length - 1)];

  const controls = (
    <BetControls
      balance={balance}
      wager={wager}
      setWager={setWager}
      potential={maxPayout}
      action={drop}
      mode={mode}
      setMode={setMode}
      actionLabel={dropping ? "Dropping…" : "Bet"}
      disabled={dropping}
      lockWager={dropping}
    >
      <SelectField
        label="Risk"
        value={risk}
        disabled={dropping}
        onChange={(value) => {
          setRisk(value as Risk);
          setLanding(null);
        }}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </SelectField>
      <SelectField
        label="Rows"
        value={rows}
        disabled={dropping}
        onChange={(value) => {
          setRows(Number(value));
          setLanding(null);
        }}
      >
        {Array.from({ length: 9 }, (_, index) => index + 8).map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </SelectField>
    </BetControls>
  );

  const stage = (
    <section className="casino-stage relative flex h-full min-h-[500px] flex-col justify-center overflow-hidden px-3 pb-7 pt-14 sm:px-7">
      <div className="absolute right-4 top-4 z-10 flex max-w-[72%] flex-row-reverse gap-1.5 overflow-hidden sm:right-6">
        {history.map((item) => (
          <span
            key={item.id}
            className={cn(
              "rounded-[4px] px-2 py-1 font-mono text-[9px] font-black shadow",
              item.multiplier >= 1
                ? "bg-[var(--win)] text-white"
                : "bg-[var(--surface-hover)] text-[var(--muted)]",
            )}
          >
            {item.multiplier}×
          </span>
        ))}
      </div>

      <div className="relative z-[1] mx-auto w-full max-w-[880px]">
        <PlinkoBoard
          rows={rows}
          risk={risk}
          dropping={dropping}
          roundPath={roundPath}
          landing={landing}
        />
        <p
          className={cn(
            "mt-6 min-h-5 text-center text-xs font-bold",
            landedMultiplier !== null && landedMultiplier >= 1
              ? "text-[var(--primary)]"
              : "text-[var(--muted)]",
          )}
          role="status"
        >
          {dropping
            ? "Following the verified path…"
            : landedMultiplier === null
              ? "Choose risk and rows, then press Bet"
              : `Landed on ${landedMultiplier}×, ${formatCredits(
                  wager * landedMultiplier,
                )} credits`}
        </p>
      </div>
    </section>
  );

  return <GameFrame game="plinko" controls={controls} stage={stage} />;
}

const chickenMultipliers: Record<ChickenDifficulty, number[]> = {
  easy: [1.08, 1.17, 1.28, 1.42, 1.6, 1.82, 2.12],
  medium: [1.15, 1.37, 1.64, 2, 2.46, 3.04, 3.82],
  hard: [1.31, 1.77, 2.46, 3.48, 5.04, 7.51, 11.56],
  expert: [1.63, 2.7, 4.63, 8.19, 14.93, 28.13, 54.9],
};

function GameSprite({
  name,
  className,
}: {
  name: "taxi" | "chicken" | "craft" | "explosion";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("game-sprite", `game-sprite-${name}`, className)}
    />
  );
}

type ChickenRoundState = {
  phase: ChickenPhase;
  lane: number;
  targetLane: number | null;
  failureLane: number | null;
  roundId: number;
};

type ChickenPlayerMotion = {
  frame: number;
  fromLane: number;
  toLane: number;
  progress: number;
  resolve: (completed: boolean) => void;
};

type ChickenGeometry = {
  centers: number[];
  playerHalf: number;
};

function ChickenGame({ balance }: { balance: number }) {
  const [mode, setMode] = useState<BetMode>("manual");
  const [wager, setWager] = useState(25);
  const [difficulty, setDifficulty] =
    useState<ChickenDifficulty>("medium");
  const [autoTarget, setAutoTarget] = useState(3);
  const [autoSettings, setAutoSettings] = useState(defaultAutoBetSettings);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldAnimate = motionEnabled && !prefersReducedMotion;
  const [roundState, setRoundState] = useState<ChickenRoundState>({
    phase: "idle",
    lane: 0,
    targetLane: null,
    failureLane: null,
    roundId: 0,
  });
  const roundStateRef = useRef(roundState);
  const stageRef = useRef<HTMLElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const playerMotionRef = useRef<ChickenPlayerMotion | null>(null);
  const geometryRef = useRef<ChickenGeometry>({
    centers: [],
    playerHalf: 0,
  });
  const visualLaneRef = useRef(0);
  const multipliers = chickenMultipliers[difficulty];
  const securedLane = roundState.lane;
  const currentMultiplier =
    securedLane === 0 ? 1 : multipliers[securedLane - 1];
  const payout = Math.floor(wager * currentMultiplier);
  const roundIsOpen = ["ready", "crossing", "safe"].includes(
    roundState.phase,
  );
  const canGo =
    (roundState.phase === "ready" || roundState.phase === "safe") &&
    roundState.lane < multipliers.length;
  const canCashOut = roundState.phase === "safe" && securedLane > 0;
  const eventLane =
    roundState.phase === "crossing" || roundState.phase === "crashed"
      ? roundState.targetLane
      : null;

  const commitRoundState = useCallback((next: ChickenRoundState) => {
    roundStateRef.current = next;
    setRoundState(next);
  }, []);

  const syncStageMetrics = useCallback(() => {
    const stage = stageRef.current;
    const player = playerRef.current;
    if (!stage || !player) return;

    const stageRect = stage.getBoundingClientRect();
    const cityWidth = stageRect.width * CHICKEN_CITY_RATIO;
    const laneWidth =
      (stageRect.width - cityWidth) / Math.max(1, multipliers.length);
    const playerTarget = Math.max(28, Math.min(88, laneWidth * 0.82));
    const taxiTarget = Math.max(34, Math.min(102, laneWidth * 0.94));
    const impactTarget = Math.max(46, Math.min(132, laneWidth * 1.2));
    stage.style.setProperty("--chicken-player-size", `${playerTarget}px`);
    stage.style.setProperty("--chicken-taxi-size", `${taxiTarget}px`);
    stage.style.setProperty("--chicken-impact-size", `${impactTarget}px`);
    const playerSize = player.getBoundingClientRect().width;
    const impactY =
      stageRect.height * (1 - CHICKEN_PLAYER_BOTTOM_RATIO) - playerSize / 2;
    geometryRef.current = {
      centers: Array.from({ length: multipliers.length + 1 }, (_, lane) =>
        getChickenLaneCenter(stageRect.width, lane, multipliers.length),
      ),
      playerHalf: playerSize / 2,
    };
    stage.style.setProperty("--chicken-stage-height", `${stageRect.height}px`);
    stage.style.setProperty("--chicken-impact-y", `${impactY}px`);
  }, [multipliers.length]);

  const renderPlayerAtLane = useCallback(
    (lane: number) => {
      const player = playerRef.current;
      if (!player) return;
      if (!geometryRef.current.centers[lane]) syncStageMetrics();
      const geometry = geometryRef.current;
      const center = geometry.centers[lane];
      if (center === undefined) return;
      const x = center - geometry.playerHalf;
      player.style.transform = `translate3d(${x}px, 0, 0)`;
    },
    [syncStageMetrics],
  );

  const cancelPlayerMotion = useCallback(() => {
    const motion = playerMotionRef.current;
    if (!motion) return;
    cancelAnimationFrame(motion.frame);
    playerMotionRef.current = null;
    motion.resolve(false);
  }, []);

  const animatePlayerToLane = useCallback(
    (fromLane: number, toLane: number, duration: number) =>
      new Promise<boolean>((resolve) => {
        cancelPlayerMotion();

        if (duration <= 0) {
          visualLaneRef.current = toLane;
          renderPlayerAtLane(toLane);
          resolve(true);
          return;
        }

        const startedAt = performance.now();
        const motion: ChickenPlayerMotion = {
          frame: 0,
          fromLane,
          toLane,
          progress: 0,
          resolve,
        };

        const animate = (now: number) => {
          if (playerMotionRef.current !== motion) {
            resolve(false);
            return;
          }

          motion.progress = Math.min(1, (now - startedAt) / duration);
          const player = playerRef.current;
          const geometry = geometryRef.current;

          if (player) {
            const from = geometry.centers[motion.fromLane];
            const to = geometry.centers[motion.toLane];
            if (from === undefined || to === undefined) {
              syncStageMetrics();
              motion.frame = requestAnimationFrame(animate);
              return;
            }
            const eased =
              motion.progress < 0.5
                ? 4 * Math.pow(motion.progress, 3)
                : 1 - Math.pow(-2 * motion.progress + 2, 3) / 2;
            const center = from + (to - from) * eased;
            const x = center - geometry.playerHalf;
            player.style.transform = `translate3d(${x}px, 0, 0)`;
          }

          if (motion.progress >= 1) {
            visualLaneRef.current = toLane;
            playerMotionRef.current = null;
            resolve(true);
            return;
          }

          motion.frame = requestAnimationFrame(animate);
        };

        playerMotionRef.current = motion;
        motion.frame = requestAnimationFrame(animate);
      }),
    [cancelPlayerMotion, renderPlayerAtLane, syncStageMetrics],
  );

  useLayoutEffect(() => {
    syncStageMetrics();
    renderPlayerAtLane(visualLaneRef.current);
    const stage = stageRef.current;
    if (!stage) return;

    const resizeObserver = new ResizeObserver(() => {
      syncStageMetrics();
      const motion = playerMotionRef.current;
      if (!motion) {
        renderPlayerAtLane(visualLaneRef.current);
        return;
      }

      const player = playerRef.current;
      if (!player) return;
      const geometry = geometryRef.current;
      const from = geometry.centers[motion.fromLane];
      const to = geometry.centers[motion.toLane];
      if (from === undefined || to === undefined) return;
      const eased =
        motion.progress < 0.5
          ? 4 * Math.pow(motion.progress, 3)
          : 1 - Math.pow(-2 * motion.progress + 2, 3) / 2;
      const center = from + (to - from) * eased;
      player.style.transform = `translate3d(${
        center - geometry.playerHalf
      }px, 0, 0)`;
    });

    resizeObserver.observe(stage);
    return () => resizeObserver.disconnect();
  }, [multipliers.length, renderPlayerAtLane, syncStageMetrics]);

  useEffect(() => cancelPlayerMotion, [cancelPlayerMotion]);

  useEffect(() => {
    if (shouldAnimate) return;
    const motion = playerMotionRef.current;
    if (!motion) return;
    cancelAnimationFrame(motion.frame);
    playerMotionRef.current = null;
    visualLaneRef.current = motion.toLane;
    renderPlayerAtLane(motion.toLane);
    motion.resolve(true);
  }, [renderPlayerAtLane, shouldAnimate]);

  function startRound() {
    if (
      ["ready", "crossing", "safe"].includes(roundStateRef.current.phase) ||
      wager < 1 ||
      wager > getPlayableBalance(balance)
    ) {
      return false;
    }

    const failureLane = pickChickenFailureLane(
      Math.random,
      difficulty,
      multipliers.length,
    );
    adjustDemoArcadeCredits(-wager);
    emitGameFeedback("bet");
    cancelPlayerMotion();
    visualLaneRef.current = 0;
    renderPlayerAtLane(0);
    commitRoundState({
      phase: "ready",
      lane: 0,
      targetLane: null,
      failureLane,
      roundId: roundStateRef.current.roundId + 1,
    });
    return true;
  }

  async function go(): Promise<"safe" | AutoRoundResult | null> {
    const current = roundStateRef.current;
    if (
      (current.phase !== "ready" && current.phase !== "safe") ||
      current.lane >= multipliers.length
    ) {
      return null;
    }

    const fromLane = current.lane;
    const targetLane = fromLane + 1;
    commitRoundState({
      ...current,
      phase: "crossing",
      targetLane,
    });

    const completed = await animatePlayerToLane(
      fromLane,
      targetLane,
      shouldAnimate ? CHICKEN_CROSSING_MS : 0,
    );
    if (!completed) return null;

    const crossing = roundStateRef.current;
    if (
      crossing.phase !== "crossing" ||
      crossing.targetLane !== targetLane
    ) {
      return null;
    }

    if (targetLane === crossing.failureLane) {
      emitGameFeedback("loss");
      commitRoundState({ ...crossing, phase: "crashed" });
      return { net: -wager, won: false };
    }

    if (targetLane === multipliers.length) {
      const finalPayout = Math.floor(wager * multipliers[targetLane - 1]);
      adjustDemoArcadeCredits(finalPayout);
      emitGameFeedback("cashout");
      commitRoundState({
        ...crossing,
        phase: "cashed-out",
        lane: targetLane,
        targetLane: null,
      });
      return { net: finalPayout - wager, won: true };
    }

    commitRoundState({
      ...crossing,
      phase: "safe",
      lane: targetLane,
      targetLane: null,
    });
    emitGameFeedback("step");
    return "safe";
  }

  function cashOut(): AutoRoundResult | null {
    const current = roundStateRef.current;
    if (current.phase !== "safe" || current.lane === 0) return null;
    commitRoundState({ ...current, phase: "cashed-out" });
    const securedMultiplier = multipliers[current.lane - 1];
    const securedPayout = Math.floor(wager * securedMultiplier);
    adjustDemoArcadeCredits(securedPayout);
    emitGameFeedback("cashout");
    return { net: securedPayout - wager, won: true };
  }

  async function runAutomaticChickenRound(): Promise<AutoRoundResult | null> {
    if (!startRound()) return null;
    await wait(shouldAnimate ? 220 : 20);

    const targetSteps = Math.min(autoTarget, multipliers.length);
    for (let step = 0; step < targetSteps; step += 1) {
      const result = await go();
      if (!result) return null;
      if (result !== "safe") {
        await wait(shouldAnimate ? 680 : 40);
        return result;
      }
      await wait(shouldAnimate ? 170 : 20);
    }

    const result = cashOut();
    await wait(shouldAnimate ? 520 : 40);
    return result;
  }

  const autoRunner = useAutoBetRunner({
    runRound: runAutomaticChickenRound,
    balance,
    wager,
  });
  const autoProgress = Math.min(
    100,
    (autoRunner.state.completed / Math.max(1, autoSettings.rounds)) * 100,
  );

  const controls = (
    <aside className="casino-control flex h-full flex-col p-3.5 sm:p-4">
      <ModeTabs
        mode={mode}
        setMode={setMode}
        disabled={roundIsOpen || autoRunner.state.running}
      />
      <div className="mt-4 space-y-4">
        <BetAmountField
          wager={wager}
          setWager={setWager}
          balance={balance}
          disabled={roundIsOpen || autoRunner.state.running}
        />
        <SelectField
          label="Difficulty"
          value={difficulty}
          disabled={roundIsOpen || autoRunner.state.running}
          onChange={(value) => setDifficulty(value as ChickenDifficulty)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="expert">Expert</option>
        </SelectField>
        {mode === "auto" ? (
          <fieldset
            disabled={autoRunner.state.running}
            className="space-y-3 disabled:opacity-70"
          >
            <div className="grid grid-cols-2 gap-2">
              <label>
                <FieldLabel>Number of Bets</FieldLabel>
                <input
                  aria-label="Number of automatic chicken bets"
                  type="number"
                  min={1}
                  max={100}
                  value={autoSettings.rounds}
                  onChange={(event) =>
                    setAutoSettings((current) => ({
                      ...current,
                      rounds: Math.min(
                        100,
                        Math.max(1, Number(event.target.value) || 1),
                      ),
                    }))
                  }
                  className="casino-field h-11 w-full rounded-[5px] bg-[var(--canvas)] px-3 font-mono text-xs font-semibold outline-none ring-1 ring-inset ring-[var(--surface-hover)]"
                />
              </label>
              <SelectField
                label="Cashout Step"
                value={autoTarget}
                onChange={(value) => setAutoTarget(Number(value))}
              >
                {multipliers.map((value, index) => (
                  <option key={value} value={index + 1}>
                    {index + 1} · {value.toFixed(2)}×
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label>
                <FieldLabel>Stop on Profit</FieldLabel>
                <input
                  aria-label="Stop automatic chicken betting on profit"
                  type="number"
                  min={0}
                  value={autoSettings.stopOnProfit}
                  onChange={(event) =>
                    setAutoSettings((current) => ({
                      ...current,
                      stopOnProfit: Math.max(
                        0,
                        Number(event.target.value) || 0,
                      ),
                    }))
                  }
                  className="casino-field h-11 w-full rounded-[5px] bg-[var(--canvas)] px-3 font-mono text-xs font-semibold outline-none ring-1 ring-inset ring-[var(--surface-hover)]"
                />
              </label>
              <label>
                <FieldLabel>Stop on Loss</FieldLabel>
                <input
                  aria-label="Stop automatic chicken betting on loss"
                  type="number"
                  min={0}
                  value={autoSettings.stopOnLoss}
                  onChange={(event) =>
                    setAutoSettings((current) => ({
                      ...current,
                      stopOnLoss: Math.max(
                        0,
                        Number(event.target.value) || 0,
                      ),
                    }))
                  }
                  className="casino-field h-11 w-full rounded-[5px] bg-[var(--canvas)] px-3 font-mono text-xs font-semibold outline-none ring-1 ring-inset ring-[var(--surface-hover)]"
                />
              </label>
            </div>
          </fieldset>
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (mode === "auto") {
              if (autoRunner.state.running) {
                autoRunner.stop();
              } else {
                void autoRunner.start(autoSettings);
              }
              return;
            }
            if (roundIsOpen) {
              cashOut();
            } else {
              startRound();
            }
          }}
          disabled={
            mode === "manual"
              ? roundState.phase === "crossing" ||
                (roundIsOpen && !canCashOut) ||
                (!roundIsOpen &&
                  (wager < 1 || wager > getPlayableBalance(balance)))
              : !autoRunner.state.running &&
                (roundIsOpen ||
                  wager < 1 ||
                  wager > getPlayableBalance(balance))
          }
          className={cn(
            "casino-action min-h-12 w-full rounded-[6px] px-4 text-sm font-black disabled:cursor-not-allowed disabled:bg-[#3f5b4b] disabled:text-[#9bb1a3] disabled:shadow-none",
            mode === "auto" && autoRunner.state.running
              ? "casino-auto-stop bg-[var(--loss)] text-white"
              : "bg-[var(--primary)] text-[var(--primary-foreground)]",
          )}
        >
          {mode === "auto"
            ? autoRunner.state.running
              ? autoRunner.state.stopping
                ? "Stopping…"
                : "Stop Auto Bet"
              : `Start Auto Bet · ${autoSettings.rounds}`
            : roundIsOpen
              ? `Cashout ${currentMultiplier.toFixed(2)}×`
              : "Bet"}
        </button>
        {mode === "manual" ? (
          <button
            type="button"
            onClick={() => void go()}
            disabled={!canGo}
            className="chicken-go min-h-12 w-full rounded-[6px] bg-[var(--surface-hover)] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-[#29404d] disabled:text-[#78909d]"
          >
            {roundState.phase === "crossing" ? "Crossing…" : "Go"}
          </button>
        ) : null}
        <ReadonlyCreditField
          label={`Total Profit (${currentMultiplier.toFixed(2)}×)`}
          value={Math.max(0, payout - wager)}
        />
        {mode === "auto" &&
        (autoRunner.state.running ||
          autoRunner.state.completed > 0 ||
          autoRunner.state.stopReason) ? (
          <div className="auto-bet-progress rounded-[6px] bg-[var(--canvas)] p-3 ring-1 ring-inset ring-[var(--surface-hover)]" aria-live="polite">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span>
                {autoRunner.state.running
                  ? autoRunner.state.stopping
                    ? "Finishing current crossing"
                    : "Auto crossing"
                  : autoRunner.state.stopReason}
              </span>
              <span className="font-mono text-[var(--primary)]">
                {autoRunner.state.completed}/{autoSettings.rounds}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-hover)]">
              <span
                className="block h-full rounded-full bg-[var(--primary)] transition-[width] duration-300"
                style={{ width: `${autoProgress}%` }}
              />
            </div>
            <p className="mt-2 text-right font-mono text-[9px] font-bold text-[var(--muted)]">
              P/L {autoRunner.state.sessionProfit >= 0 ? "+" : ""}
              {formatSignedCredits(autoRunner.state.sessionProfit)}
            </p>
          </div>
        ) : null}
      </div>
      <div className="mt-auto hidden pt-6 text-[10px] leading-4 text-[var(--muted)] lg:block">
        <div className="flex items-center gap-1.5 font-semibold">
          <CircleGauge className="h-3.5 w-3.5 text-[var(--primary)]" />
          One lane per click
        </div>
        <p className="mt-1.5">
          Cash out after any safe crossing. Virtual credits only.
        </p>
      </div>
    </aside>
  );

  const stage = (
    <section
      ref={stageRef}
      data-phase={roundState.phase}
      data-player-lane={roundState.lane}
      data-target-lane={roundState.targetLane ?? ""}
      data-secured-lane={securedLane}
      aria-label={`Chicken road, secured lane ${securedLane} of ${multipliers.length}${
        roundState.targetLane ? `, crossing toward lane ${roundState.targetLane}` : ""
      }`}
      className={cn(
        "chicken-stage relative h-full min-h-[500px] overflow-hidden bg-[#0c202d]",
        roundState.phase === "crashed" && "chicken-stage-crash",
        roundState.phase === "cashed-out" && "chicken-stage-win",
      )}
      style={
        {
          "--chicken-city-width": `${CHICKEN_CITY_RATIO * 100}%`,
          "--chicken-crossing-ms": `${CHICKEN_CROSSING_MS}ms`,
          "--chicken-taxi-pass-ms": `${Math.round(
            CHICKEN_CROSSING_MS * 0.78,
          )}ms`,
          "--chicken-player-bottom": `${
            CHICKEN_PLAYER_BOTTOM_RATIO * 100
          }%`,
          "--chicken-lane-count": multipliers.length,
        } as CSSProperties
      }
    >
      <div className="chicken-city absolute inset-y-0 left-0 border-r-[10px] border-[var(--surface-hover)] bg-[#102735]">
        <span className="traffic-light absolute left-1/2 top-[12%] -translate-x-1/2">
          <i
            className={
              roundState.phase === "crashed"
                ? "is-red"
                : roundState.phase === "crossing"
                  ? "is-amber"
                  : roundIsOpen
                    ? "is-green"
                    : "is-amber"
            }
          />
          <i />
        </span>
        <span className="absolute bottom-[14%] left-1/2 h-16 w-16 -translate-x-1/2 rounded-full bg-[#1a3645] shadow-[0_12px_0_#071821]" />
      </div>

      <div
        className="chicken-road-grid absolute inset-y-0 right-0 grid"
        style={{
          gridTemplateColumns: `repeat(${multipliers.length}, minmax(0, 1fr))`,
        }}
      >
        {multipliers.map((multiplier, index) => {
          const lane = index + 1;
          const passed = securedLane >= lane;
          const isEventLane = eventLane === lane;
          const crashed = roundState.phase === "crashed" && isEventLane;
          const fatalCrossing =
            roundState.phase === "crossing" &&
            isEventLane &&
            roundState.failureLane === lane;
          return (
            <div
              key={`${difficulty}-${multiplier}`}
              className={cn(
                "chicken-lane relative",
                passed && "chicken-lane-passed",
                isEventLane && "chicken-lane-active",
              )}
            >
              <span className="road-dash road-dash-a" />
              <span className="road-dash road-dash-b" />
              <span className="road-drain" />
              {isEventLane && roundState.phase === "crossing" ? (
                <div
                  className={cn(
                    "chicken-taxi absolute left-1/2 z-20",
                    fatalCrossing && "is-fatal",
                  )}
                >
                  <GameSprite name="taxi" />
                </div>
              ) : null}
              {crashed ? (
                <div className="chicken-impact-anchor absolute left-1/2 z-30">
                  <div className="chicken-explosion">
                    <GameSprite name="explosion" />
                    <span className="fire-core" />
                    <span className="smoke smoke-a" />
                    <span className="smoke smoke-b" />
                  </div>
                </div>
              ) : null}
              <span
                className={cn(
                  "chicken-multiplier absolute bottom-6 left-1/2 z-20 -translate-x-1/2",
                  passed && "is-passed",
                  (isEventLane || securedLane === lane) && "is-current",
                )}
              >
                {multiplier.toFixed(2)}×
              </span>
            </div>
          );
        })}
      </div>

      <div
        ref={playerRef}
        className={cn(
          "chicken-player absolute z-30",
        )}
      >
        <span
          className={cn(
            "chicken-player-character",
            roundState.phase === "crossing" && "is-hopping",
            roundState.phase === "crashed" && "is-crashed",
          )}
        >
          <GameSprite name="chicken" />
        </span>
      </div>

      <div className="chicken-return absolute right-4 top-4 z-40 rounded-[5px] bg-[#071821aa] px-3 py-2 text-right backdrop-blur-sm">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
          Current return
        </p>
        <p className="mt-0.5 font-mono text-lg font-black text-white">
          {currentMultiplier.toFixed(2)}×
        </p>
      </div>
      <p
        className={cn(
          "absolute inset-x-0 top-5 z-40 mx-auto w-fit rounded-full bg-[#071821cc] px-4 py-2 text-[11px] font-bold backdrop-blur",
          "chicken-status",
          roundState.phase === "crashed"
            ? "text-[var(--loss)]"
            : roundState.phase === "cashed-out"
              ? "text-[var(--primary)]"
              : "text-[var(--muted)]",
        )}
        aria-live="polite"
        role="status"
      >
        {roundState.phase === "crossing"
          ? "Watch the traffic…"
          : roundState.phase === "crashed"
            ? "Traffic hit, round over"
            : roundState.phase === "cashed-out"
              ? `${formatCredits(payout)} credits secured`
              : roundState.phase === "safe"
                ? "Go again or cash out"
                : roundState.phase === "ready"
                  ? "Press Go to cross the first lane"
                : "Choose difficulty and place a bet"}
      </p>
    </section>
  );

  return (
    <GameFrame
      game="chicken"
      controls={controls}
      stage={stage}
      motion={motionEnabled}
      onMotionChange={setMotionEnabled}
    />
  );
}

type CrashPhase = "idle" | "betting" | "running" | "crashed";

function getCrashGeometry(multiplier: number, crashAt: number) {
  const progress = Math.min(
    0.96,
    0.12 + ((multiplier - 1) / Math.max(0.2, crashAt - 1)) * 0.82,
  );
  const height = Math.min(
    0.82,
    0.07 +
      (Math.log(multiplier) / Math.log(Math.max(1.25, crashAt))) * 0.7,
  );
  const points = Array.from({ length: 28 }, (_, index) => {
    const t = index / 27;
    const x = 6 + progress * 88 * t;
    const y = 91 - height * 86 * Math.pow(t, 1.62);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  return {
    points,
    x: 6 + progress * 88,
    y: 91 - height * 86,
  };
}

function CrashGame({ balance }: { balance: number }) {
  const [mode, setMode] = useState<BetMode>("manual");
  const [wager, setWager] = useState(25);
  const [autoCashout, setAutoCashout] = useState(2);
  const [phase, setPhase] = useState<CrashPhase>("idle");
  const [countdown, setCountdown] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [crashAt, setCrashAt] = useState(2.4);
  const [cashedAt, setCashedAt] = useState<number | null>(null);
  const [history, setHistory] = useState([
    1.24, 3.61, 1.08, 2.17, 8.42, 1.55, 4.04,
  ]);
  const cashoutRef = useRef<number | null>(null);
  const multiplierRef = useRef(1);
  const graphRef = useRef<HTMLDivElement>(null);
  const craftPositionRef = useRef<HTMLDivElement>(null);
  const graphLineRef = useRef<SVGPolylineElement>(null);
  const graphAreaRef = useRef<SVGPolygonElement>(null);
  const multiplierTextRef = useRef<HTMLParagraphElement>(null);
  const graphSizeRef = useRef({ width: 0, height: 0 });
  const roundLockRef = useRef(false);
  const roundWagerRef = useRef(wager);
  const roundResolverRef = useRef<
    ((result: AutoRoundResult | null) => void) | null
  >(null);

  useLayoutEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const sync = () => {
      const rect = graph.getBoundingClientRect();
      graphSizeRef.current = { width: rect.width, height: rect.height };
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(graph);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      roundResolverRef.current?.(null);
      roundResolverRef.current = null;
      roundLockRef.current = false;
    },
    [],
  );

  useEffect(() => {
    if (phase !== "betting") return;
    let frame = 0;
    const duration = 1350;
    const startedAt = performance.now();
    let lastPaint = 0;

    const tick = (now: number) => {
      const remaining = Math.max(0, duration - (now - startedAt));
      if (now - lastPaint > 70) {
        lastPaint = now;
        setCountdown(remaining / 1000);
      }
      if (remaining <= 0) {
        setCountdown(0);
        emitGameFeedback("launch");
        setPhase("running");
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") return;
    let frame = 0;
    const startedAt = performance.now();
    let lastReactPaint = 0;

    const animate = (now: number) => {
      const seconds = (now - startedAt) / 1000;
      const next = 1 + Math.pow(seconds * 0.78, 1.58);
      multiplierRef.current = next;
      const geometry = getCrashGeometry(Math.min(next, crashAt), crashAt);

      graphLineRef.current?.setAttribute("points", geometry.points);
      graphAreaRef.current?.setAttribute(
        "points",
        `6,92 ${geometry.points} ${geometry.x.toFixed(2)},92`,
      );
      if (multiplierTextRef.current) {
        multiplierTextRef.current.textContent = `${Math.min(next, crashAt).toFixed(2)}×`;
      }
      const craft = craftPositionRef.current;
      const { width, height } = graphSizeRef.current;
      if (craft && width > 0 && height > 0) {
        const x = (geometry.x / 100) * width;
        const y = (geometry.y / 100) * height;
        craft.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      if (next >= crashAt) {
        emitGameFeedback(cashoutRef.current === null ? "loss" : "crash");
        multiplierRef.current = crashAt;
        setMultiplier(crashAt);
        setPhase("crashed");
        setHistory((items) => [crashAt, ...items].slice(0, 9));
        const cashedMultiplier = cashoutRef.current;
        const roundWager = roundWagerRef.current;
        roundResolverRef.current?.({
          net:
            cashedMultiplier === null
              ? -roundWager
              : Math.floor(roundWager * cashedMultiplier) - roundWager,
          won: cashedMultiplier !== null,
        });
        roundResolverRef.current = null;
        roundLockRef.current = false;
        return;
      }

      if (cashoutRef.current === null && next >= autoCashout) {
        cashoutRef.current = autoCashout;
        setCashedAt(autoCashout);
        adjustDemoArcadeCredits(
          Math.floor(roundWagerRef.current * autoCashout),
        );
        emitGameFeedback("cashout");
      }

      if (now - lastReactPaint >= 100) {
        lastReactPaint = now;
        setMultiplier(next);
      }
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [autoCashout, crashAt, phase]);

  function startRound(): Promise<AutoRoundResult | null> {
    if (
      roundLockRef.current ||
      wager < 1 ||
      wager > getPlayableBalance(balance)
    ) {
      return Promise.resolve(null);
    }
    const random = Math.random();
    const nextCrash =
      random < 0.42
        ? 1.05 + Math.random() * 0.8
        : random < 0.82
          ? 1.85 + Math.random() * 2.8
          : 4.65 + Math.random() * 7.5;
    roundLockRef.current = true;
    roundWagerRef.current = wager;
    adjustDemoArcadeCredits(-wager);
    emitGameFeedback("bet");
    cashoutRef.current = null;
    multiplierRef.current = 1;
    setCashedAt(null);
    setMultiplier(1);
    setCrashAt(Math.round(nextCrash * 100) / 100);
    setCountdown(1.35);
    setPhase("betting");
    graphLineRef.current?.setAttribute("points", "");
    graphAreaRef.current?.setAttribute("points", "");
    if (craftPositionRef.current) {
      craftPositionRef.current.style.transform = "translate3d(0, 0, 0)";
    }
    return new Promise((resolve) => {
      roundResolverRef.current = resolve;
    });
  }

  function cashOut(): AutoRoundResult | null {
    if (phase !== "running" || cashoutRef.current !== null) return null;
    const liveMultiplier = multiplierRef.current;
    cashoutRef.current = liveMultiplier;
    setCashedAt(liveMultiplier);
    const payout = Math.floor(roundWagerRef.current * liveMultiplier);
    adjustDemoArcadeCredits(payout);
    emitGameFeedback("cashout");
    return {
      net: payout - roundWagerRef.current,
      won: true,
    };
  }

  const crashGeometry = getCrashGeometry(multiplier, crashAt);
  const graphPoints = crashGeometry.points;
  const finalX = crashGeometry.x;
  const finalY = crashGeometry.y;

  const controls = (
    <BetControls
      balance={balance}
      wager={wager}
      setWager={setWager}
      potential={Math.floor(wager * autoCashout)}
      action={phase === "running" ? cashOut : startRound}
      autoAction={startRound}
      mode={mode}
      setMode={setMode}
      actionLabel={
        phase === "betting"
          ? `Launching in ${countdown.toFixed(1)}s`
          : phase === "running"
          ? cashedAt
            ? `Cashed at ${cashedAt.toFixed(2)}×`
            : `Cashout ${multiplier.toFixed(2)}×`
          : "Bet"
      }
      disabled={
        phase === "betting" || (phase === "running" && cashedAt !== null)
      }
      lockWager={phase === "betting" || phase === "running"}
    >
      <SelectField
        label="Auto Cashout"
        value={autoCashout}
        disabled={phase === "betting" || phase === "running"}
        onChange={(value) => setAutoCashout(Number(value))}
      >
        {[1.5, 2, 3, 5, 10].map((value) => (
          <option key={value} value={value}>
            {value.toFixed(2)}×
          </option>
        ))}
      </SelectField>
    </BetControls>
  );

  const stage = (
    <section
      className={cn(
        "crash-stage relative h-full min-h-[500px] overflow-hidden bg-[var(--canvas)]",
        phase === "betting" && "is-betting",
        phase === "crashed" && "is-crashed",
      )}
    >
      <div className="absolute left-4 right-4 top-4 z-20 flex gap-1.5 overflow-hidden sm:left-6 sm:right-6">
        {history.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className={cn(
              "shrink-0 rounded-[4px] px-2 py-1 font-mono text-[9px] font-black",
              value < 2
                ? "bg-[var(--surface-hover)] text-[var(--muted)]"
                : value < 5
                  ? "bg-[#1475e1] text-white"
                  : "bg-[#8d42e6] text-white",
            )}
          >
            {value.toFixed(2)}×
          </span>
        ))}
      </div>

      <div ref={graphRef} className="absolute inset-x-4 bottom-16 top-14 sm:inset-x-8 sm:bottom-20">
        <svg
          className="h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label="Crash multiplier graph"
        >
          <defs>
            <linearGradient id="crash-line-gradient" x1="0" x2="1" y1="1" y2="0">
              <stop offset="0%" stopColor="#1687ff" />
              <stop offset="42%" stopColor="#00c991" />
              <stop offset="72%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ffd452" />
            </linearGradient>
            <linearGradient id="crash-area-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity=".3" />
              <stop offset="65%" stopColor="#00c991" stopOpacity=".12" />
              <stop offset="100%" stopColor="#1687ff" stopOpacity="0" />
            </linearGradient>
            <filter id="crash-glow">
              <feGaussianBlur stdDeviation="1.1" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g className="crash-grid-lines">
            {[18, 36, 54, 72, 90].map((value) => (
              <line
                key={`horizontal-${value}`}
                x1="5"
                x2="97"
                y1={value}
                y2={value}
              />
            ))}
            {[20, 40, 60, 80].map((value) => (
              <line
                key={`vertical-${value}`}
                x1={value}
                x2={value}
                y1="8"
                y2="92"
              />
            ))}
          </g>
          <polygon
            ref={graphAreaRef}
            points={
              phase === "running" || phase === "crashed"
                ? `6,92 ${graphPoints} ${finalX.toFixed(2)},92`
                : ""
            }
            fill="url(#crash-area-fill)"
          />
          <polyline
            ref={graphLineRef}
            points={phase === "running" || phase === "crashed" ? graphPoints : ""}
            fill="none"
            stroke="url(#crash-line-gradient)"
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
            filter="url(#crash-glow)"
          />
        </svg>

        <div
          ref={craftPositionRef}
          className="crash-craft-position pointer-events-none absolute left-0 top-0 z-20"
          style={{ opacity: phase === "running" || phase === "crashed" ? 1 : 0 }}
        >
          <div
            className={cn(
              "crash-craft absolute",
              phase === "running" && "is-flying",
              phase === "crashed" && "is-broken",
            )}
          >
            {phase === "running" ? <span className="crash-flame" /> : null}
            <GameSprite name="craft" />
            {phase === "crashed" ? (
              <GameSprite name="explosion" className="crash-burst" />
            ) : null}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
        <div className="text-center">
          <p
            ref={multiplierTextRef}
            className={cn(
              "font-mono text-5xl font-black tracking-[-0.06em] drop-shadow sm:text-7xl",
              phase === "crashed"
                ? "text-[var(--loss)]"
                : phase === "betting"
                  ? "text-[var(--primary)]"
                  : "text-white",
            )}
          >
            {phase === "betting"
              ? countdown.toFixed(1)
              : `${multiplier.toFixed(2)}×`}
          </p>
          <p
            className={cn(
              "mt-2 text-xs font-black uppercase tracking-[0.18em]",
              phase === "crashed"
                ? "text-[var(--loss)]"
                : cashedAt
                  ? "text-[var(--primary)]"
                  : "text-[var(--muted)]",
            )}
            role="status"
          >
            {phase === "idle"
              ? "Place a bet to start"
              : phase === "betting"
                ? "Next round launching"
              : phase === "crashed"
                ? `Crashed at ${crashAt.toFixed(2)}×`
                : cashedAt
                  ? `Cashed out at ${cashedAt.toFixed(2)}×`
                  : "Multiplier rising"}
          </p>
        </div>
      </div>

      {phase === "crashed" ? (
        <div
          className="crash-crack pointer-events-none absolute inset-0 z-30"
          style={{ "--crash-x": `${finalX}%`, "--crash-y": `${finalY}%` } as CSSProperties}
        >
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : null}

      {phase === "betting" ? (
        <div className="crash-launch-line pointer-events-none absolute inset-x-8 bottom-[18%] z-20 h-px overflow-visible bg-[var(--surface-hover)]">
          <span />
        </div>
      ) : null}

      <div className="absolute bottom-4 left-5 z-20 flex items-center gap-2 text-[10px] font-semibold text-[var(--muted)]">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            phase === "running"
              ? "animate-pulse bg-[var(--primary)]"
              : "bg-[var(--border-strong)]",
          )}
        />
        {phase === "betting"
          ? "Bet accepted · launch sequence"
          : phase === "running"
            ? "Round live"
            : phase === "crashed"
              ? "Result locked"
              : "Ready for next round"}
      </div>
    </section>
  );

  return <GameFrame game="crash" controls={controls} stage={stage} />;
}

function GameHelp({ game }: { game: CasinoGame }) {
  const copy = {
    dice: {
      title: "How to play Dice",
      body: "Move the target, choose over or under, and place a virtual-credit bet. The result marker lands from 0.00 to 100.00.",
      edge: "Demo",
    },
    mines: {
      title: "How to play Mines",
      body: "Choose the mine count, start the round, reveal safe gems, and cash out before uncovering a mine.",
      edge: "Demo",
    },
    plinko: {
      title: "How to play Plinko",
      body: "Choose risk and rows, then drop the ball. Connected play will render the server result; demo outcomes stay inside this browser tab.",
      edge: "Demo",
    },
    chicken: {
      title: "How to play Chicken",
      body: "Start a round, cross one lane at a time, and cash out after any safe hop. A passing car can end the round before the next multiplier is secured.",
      edge: "Demo",
    },
    crash: {
      title: "How to play Crash",
      body: "Place a virtual-credit bet before launch and cash out while the multiplier climbs. If the craft crashes first, the active bet is lost.",
      edge: "Demo",
    },
  }[game];

  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-[1.35fr_.65fr]">
      <div className="rounded-[8px] bg-[var(--surface)] p-4 shadow-[0_3px_10px_rgba(0,0,0,.14)]">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-[var(--primary)]" />
          <h2 className="text-sm font-bold">{copy.title}</h2>
        </div>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          {copy.body}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-[8px] bg-[var(--surface)] p-3 shadow-[0_3px_10px_rgba(0,0,0,.14)]">
        {[
          ["RNG", copy.edge],
          ["Mode", "Demo"],
          ["Proof", "Preview"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[5px] bg-[var(--canvas)] px-2 py-3 text-center"
          >
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
              {label}
            </p>
            <p className="mt-1 font-mono text-xs font-bold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GamePage({ game }: { game: CasinoGame }) {
  const demoSession = useDemoSession();
  const balance =
    demoSession?.role === "student" ? demoSession.arcadeCredits : 500;

  return (
    <div className="mx-auto max-w-[1380px] px-2 pb-24 pt-3 sm:px-4 sm:pt-4 lg:px-6">
      <div className="mb-3 flex items-center gap-2 text-[11px] text-[var(--muted)]">
        <a href="/casino" className="hover:text-white">
          Casino
        </a>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold capitalize text-white">{game}</span>
        <Badge tone="win" className="ml-auto">
          Demo balance: {formatCredits(balance)}
        </Badge>
      </div>

      {game === "dice" ? (
        <DiceGame balance={balance} />
      ) : game === "mines" ? (
        <MinesGame balance={balance} />
      ) : game === "plinko" ? (
        <PlinkoGame balance={balance} />
      ) : game === "chicken" ? (
        <ChickenGame balance={balance} />
      ) : (
        <CrashGame balance={balance} />
      )}

      <GameHelp game={game} />
      <ActivityTable compact />
    </div>
  );
}

export function CasinoPage({ game }: { game?: CasinoGame }) {
  return (
    <AppGate>
      <AppShell active="casino">
        {game ? <GamePage game={game} /> : <CasinoLobby />}
      </AppShell>
    </AppGate>
  );
}
