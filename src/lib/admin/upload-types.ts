export const UPLOAD_BUCKETS = [
  "players",
  "trophies",
  "products",
  "giveaways",
  "events",
  "pages",
] as const;
export type UploadBucket = (typeof UPLOAD_BUCKETS)[number];
