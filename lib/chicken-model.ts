export type ChickenDifficulty = "easy" | "medium" | "hard" | "expert";

export type ChickenPhase =
  | "idle"
  | "ready"
  | "crossing"
  | "safe"
  | "crashed"
  | "cashed-out";

export const CHICKEN_CITY_RATIO = 0.18;
export const CHICKEN_CROSSING_MS = 620;
export const CHICKEN_PLAYER_BOTTOM_RATIO = 0.15;

export const chickenFailureChance: Record<ChickenDifficulty, number> = {
  easy: 0.11,
  medium: 0.18,
  hard: 0.27,
  expert: 0.39,
};

export function getChickenSecuredLane(phase: ChickenPhase, lane: number) {
  if (phase === "crossing" || phase === "crashed") {
    return Math.max(0, lane - 1);
  }
  return lane;
}

export function getChickenLaneCenter(
  stageWidth: number,
  lane: number,
  laneCount: number,
) {
  const safeWidth = Math.max(0, stageWidth);
  const safeLaneCount = Math.max(1, Math.floor(laneCount));
  const cityWidth = safeWidth * CHICKEN_CITY_RATIO;

  if (lane <= 0) return cityWidth / 2;

  const clampedLane = Math.min(safeLaneCount, lane);
  const laneWidth = (safeWidth - cityWidth) / safeLaneCount;
  return cityWidth + (clampedLane - 0.5) * laneWidth;
}

export function pickChickenFailureLane(
  random: () => number,
  difficulty: ChickenDifficulty,
  laneCount: number,
) {
  let lane = 1;
  const chance = chickenFailureChance[difficulty];
  while (lane <= laneCount && random() > chance) lane += 1;
  return lane;
}
