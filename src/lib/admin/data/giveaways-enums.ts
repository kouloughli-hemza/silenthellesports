export const GIVEAWAY_STATUSES = ["upcoming", "active", "drawing", "completed"] as const;
export type GiveawayStatus = (typeof GIVEAWAY_STATUSES)[number];
