// Validate uploaded files by sniffing the actual bytes instead of trusting
// the browser-supplied Content-Type. Catches renamed files and spoofed MIME
// headers — the upload still goes into a private bucket but this is the
// defence-in-depth check before we hand bytes to Supabase storage.

export type AllowedImageKind = "png" | "jpeg" | "webp";

const SIGNATURES: Array<{ kind: AllowedImageKind; magic: number[]; offset?: number; ext: string; mime: string }> = [
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  {
    kind: "png",
    magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    ext: "png",
    mime: "image/png",
  },
  // JPEG: FF D8 FF
  {
    kind: "jpeg",
    magic: [0xff, 0xd8, 0xff],
    ext: "jpg",
    mime: "image/jpeg",
  },
  // WebP: "RIFF" .... "WEBP" — RIFF at 0, WEBP at 8
  {
    kind: "webp",
    magic: [0x52, 0x49, 0x46, 0x46],
    ext: "webp",
    mime: "image/webp",
  },
];

export interface IdentifiedImage {
  kind: AllowedImageKind;
  ext: string;
  mime: string;
}

// Inspect the first ~12 bytes of the buffer and confirm it's a real image.
// Returns null if the bytes don't match any allowed signature.
export function identifyImage(buf: Buffer): IdentifiedImage | null {
  for (const sig of SIGNATURES) {
    if (matchesAt(buf, sig.magic, 0)) {
      // For WebP we additionally require "WEBP" at offset 8.
      if (sig.kind === "webp") {
        if (!matchesAt(buf, [0x57, 0x45, 0x42, 0x50], 8)) continue;
      }
      return { kind: sig.kind, ext: sig.ext, mime: sig.mime };
    }
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
