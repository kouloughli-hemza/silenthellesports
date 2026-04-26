export const PLAYER_ROLES = [
  "IGL",
  "Sniper",
  "Fragger",
  "Support",
  "Coach",
  "Manager",
  "Sub",
  "Analyst",
  "Assault",
  "Scout",
] as const;
export type PlayerRole = (typeof PLAYER_ROLES)[number];
