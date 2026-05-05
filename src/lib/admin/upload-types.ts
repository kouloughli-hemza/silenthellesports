export const UPLOAD_BUCKETS = [
  "players",
  "trophies",
  "products",
  "giveaways",
  "events",
  "pages",
  "gallery",
] as const;
export type UploadBucket = (typeof UPLOAD_BUCKETS)[number];
