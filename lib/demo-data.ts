export type Outcome = {
  id: number;
  label: string;
  share: number;
  multiplier: number;
};

export type SportsMarket = {
  id: number;
  slug: string;
  league: string;
  sport: string;
  status: "LIVE" | "UPCOMING" | "FUTURES";
  clock: string;
  home: string;
  away: string;
  score?: string;
  pool: number;
  outcomes: Outcome[];
};

export const sportsMarkets: SportsMarket[] = [
  {
    id: 1,
    slug: "india-australia-odi",
    league: "International Cricket",
    sport: "Cricket",
    status: "LIVE",
    clock: "2nd innings, 31.2 ov",
    home: "India",
    away: "Australia",
    score: "IND 211/4, AUS 286/8",
    pool: 12450,
    outcomes: [
      { id: 1, label: "India", share: 57.2, multiplier: 1.66 },
      { id: 2, label: "Australia", share: 42.8, multiplier: 2.22 },
    ],
  },
  {
    id: 2,
    slug: "madrid-manchester",
    league: "Club Football",
    sport: "Football",
    status: "UPCOMING",
    clock: "Today, 11:30 PM",
    home: "Madrid",
    away: "Manchester",
    pool: 9180,
    outcomes: [
      { id: 3, label: "Madrid", share: 44.6, multiplier: 2.13 },
      { id: 4, label: "Draw", share: 22.1, multiplier: 4.3 },
      { id: 5, label: "Manchester", share: 33.3, multiplier: 2.85 },
    ],
  },
  {
    id: 3,
    slug: "mumbai-chennai-t20",
    league: "T20 League",
    sport: "Cricket",
    status: "UPCOMING",
    clock: "Tomorrow, 7:30 PM",
    home: "Mumbai",
    away: "Chennai",
    pool: 6825,
    outcomes: [
      { id: 6, label: "Mumbai", share: 51.7, multiplier: 1.84 },
      { id: 7, label: "Chennai", share: 48.3, multiplier: 1.97 },
    ],
  },
  {
    id: 4,
    slug: "formula-championship",
    league: "Motorsport",
    sport: "More",
    status: "FUTURES",
    clock: "Closes in 18 days",
    home: "Drivers’ Championship",
    away: "Season winner",
    pool: 22340,
    outcomes: [
      { id: 8, label: "Norris", share: 41.2, multiplier: 2.31 },
      { id: 9, label: "Piastri", share: 35.9, multiplier: 2.65 },
      { id: 10, label: "Other", share: 22.9, multiplier: 4.15 },
    ],
  },
];

export const leaderboard = [
  { rank: 1, username: "probability_king", credits: 18840, roi: 42.6, streak: 7 },
  { rank: 2, username: "late_wicket", credits: 17195, roi: 36.4, streak: 5 },
  { rank: 3, username: "quiet_alpha", credits: 15920, roi: 31.8, streak: 9 },
  { rank: 4, username: "midnight_math", credits: 14860, roi: 29.1, streak: 4 },
  { rank: 5, username: "cover_drive", credits: 13745, roi: 24.7, streak: 6 },
  { rank: 6, username: "demo_student", credits: 12480, roi: 22.3, streak: 3 },
  { rank: 7, username: "variance_vibe", credits: 11980, roi: 18.9, streak: 2 },
  { rank: 8, username: "underdog.exe", credits: 10650, roi: 16.2, streak: 4 },
];

export const recentActivity = [
  { user: "cover_drive", game: "Dice", wager: 50, result: "1.92×", tone: "win" },
  { user: "quiet_alpha", game: "Mines", wager: 100, result: "2.44×", tone: "win" },
  { user: "late_wicket", game: "Plinko", wager: 25, result: "0.50×", tone: "loss" },
  { user: "probability_king", game: "Dice", wager: 250, result: "2.08×", tone: "win" },
];
