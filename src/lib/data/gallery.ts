import "server-only";

import { unstable_cache as cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Translated } from "@/types/domain";

// Hero gallery — admin-managed photos shown in the rotating cinematic frame.
// Cached so the home page stays cheap; admin actions invalidate by tag.
const REVALIDATE_SECONDS = 60;

export const TAG_GALLERY = "gallery-images";

export interface GalleryImage {
  id: string;
  image_url: string;
  caption: Translated;
  meta: Translated;
  hud_heading: string | null;
  hud_zone: string | null;
  hud_signal: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getActiveGalleryImages(limit = 8): Promise<GalleryImage[]> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error || !data) return [];
      return data as unknown as GalleryImage[];
    },
    ["gallery-active", String(limit)],
    { revalidate: REVALIDATE_SECONDS, tags: [TAG_GALLERY] },
  )();
}
