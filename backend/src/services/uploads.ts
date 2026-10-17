import path from "path";
import fs from "fs";
import crypto from "crypto";

const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/wav": ".wav",
  "audio/webm": ".weba",
  "audio/ogg": ".ogg",
};

interface SaveOptions {
  dir: string;
  maxBytes: number;
  allowedMimes: string[];
}

// Decodes a base64 data URL (used by native app uploads, which bypass multipart)
// and writes it to disk with the same naming scheme as multer.
export function saveDataUrl(dataUrl: string, opts: SaveOptions): string {
  const match = /^data:([a-zA-Z0-9/+.-]+);base64,([\s\S]+)$/.exec(dataUrl.trim());
  if (!match) throw new Error("Invalid data URL");
  const [, mime, base64] = match;
  if (!opts.allowedMimes.includes(mime)) throw new Error("File type not allowed");
  const ext = MIME_EXT[mime];
  if (!ext) throw new Error("File type not allowed");

  const buf = Buffer.from(base64, "base64");
  if (buf.length === 0) throw new Error("Empty file");
  if (buf.length > opts.maxBytes) throw new Error("File too large");

  fs.mkdirSync(opts.dir, { recursive: true });
  const unique = `${Date.now()}-${crypto.randomInt(1e9)}${ext}`;
  fs.writeFileSync(path.join(opts.dir, unique), buf);
  return unique;
}
