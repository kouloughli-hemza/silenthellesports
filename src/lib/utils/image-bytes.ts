// Validate uploaded files by sniffing the actual bytes instead of trusting
// the browser-supplied Content-Type. Catches renamed files and spoofed MIME
// headers — the upload still goes into a private bucket but this is the
// defence-in-depth check before we hand bytes to Supabase storage.

export type AllowedImageKind = "png" | "jpeg" | "webp" | "avif";

export interface IdentifiedImage {
  kind: AllowedImageKind;
  ext: string;
  mime: string;
}

export interface IdentifyOptions {
  // Defaults to the strict user-facing set: PNG / JPEG / WebP.
  allow?: ReadonlyArray<AllowedImageKind>;
}

// Inspect the first ~16 bytes of the buffer and confirm it's a real image.
// Returns null if the bytes don't match any allowed signature.
export function identifyImage(
  buf: Buffer,
  options: IdentifyOptions = {},
): IdentifiedImage | null {
  const allow = new Set<AllowedImageKind>(options.allow ?? ["png", "jpeg", "webp"]);

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (allow.has("png") && matchesAt(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)) {
    return { kind: "png", ext: "png", mime: "image/png" };
  }

  // JPEG: FF D8 FF
  if (allow.has("jpeg") && matchesAt(buf, [0xff, 0xd8, 0xff], 0)) {
    return { kind: "jpeg", ext: "jpg", mime: "image/jpeg" };
  }

  // WebP: "RIFF" at 0, "WEBP" at 8
  if (
    allow.has("webp") &&
    matchesAt(buf, [0x52, 0x49, 0x46, 0x46], 0) &&
    matchesAt(buf, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return { kind: "webp", ext: "webp", mime: "image/webp" };
  }

  // AVIF: "ftyp" at 4, "avif" / "avis" at 8. HEIC/HEIF deliberately not
  // accepted — they reuse the same ISOBMFF container but expand attack
  // surface (codec parsing, EXIF) for no gain on this site.
  if (
    allow.has("avif") &&
    matchesAt(buf, [0x66, 0x74, 0x79, 0x70], 4) &&
    (matchesAt(buf, [0x61, 0x76, 0x69, 0x66], 8) ||
      matchesAt(buf, [0x61, 0x76, 0x69, 0x73], 8))
  ) {
    return { kind: "avif", ext: "avif", mime: "image/avif" };
  }

  return null;
}

function matchesAt(buf: Buffer, magic: number[], offset: number): boolean {
  if (buf.length < offset + magic.length) return false;
  for (let i = 0; i < magic.length; i += 1) {
    if (buf[offset + i] !== magic[i]) return false;
  }
  return true;
}
