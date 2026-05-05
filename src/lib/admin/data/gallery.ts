import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { GalleryImage } from "@/lib/data/gallery";

export async function listGalleryImagesAdmin(): Promise<GalleryImage[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listGalleryImagesAdmin: ${error.message}`);
  return (data ?? []) as unknown as GalleryImage[];
}

export async function getGalleryImageAdmin(id: string): Promise<GalleryImage | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getGalleryImageAdmin: ${error.message}`);
  return (data as unknown as GalleryImage | null) ?? null;
}
