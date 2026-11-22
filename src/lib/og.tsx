import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { cacheLife } from "next/cache";
import { SITE } from "./seo";

// Branded 1200×630 social share images (Open Graph / X / LinkedIn / WhatsApp / iMessage).

export const OG_SIZE = { width: 1200, height: 630 };
// JPEG keeps share images small (~80–120 KB) — WhatsApp and others skip large previews.
export const OG_CONTENT_TYPE = "image/jpeg";

export type OgPhoto = "hero" | "consult" | "documents" | "accountant" | "calculator" | "reports" | "smallBusiness" | "team";

// Literal paths (no computed file names) so the bundler only ships these files.
const cwd = process.cwd();
const PHOTO: Record<OgPhoto, () => Promise<Buffer>> = {
  hero: () => readFile(join(cwd, "src/assets/photos/hero.jpg")),
  consult: () => readFile(join(cwd, "src/assets/photos/consult.jpg")),
  documents: () => readFile(join(cwd, "src/assets/photos/documents.jpg")),
  accountant: () => readFile(join(cwd, "src/assets/photos/accountant.jpg")),
  calculator: () => readFile(join(cwd, "src/assets/photos/calculator.jpg")),
  reports: () => readFile(join(cwd, "src/assets/photos/reports.jpg")),
  smallBusiness: () => readFile(join(cwd, "src/assets/photos/small-business.jpg")),
  team: () => readFile(join(cwd, "src/assets/photos/team.jpg")),
};

const toArrayBuffer = (b: Buffer) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

/** Fonts, logo and photo — cached so share images are built once, not on every request. */
async function loadOgAssets(photo: OgPhoto) {
  "use cache";
  cacheLife("max");
  const [serif, sans, sansSemi, logo, pic] = await Promise.all([
    readFile(join(cwd, "src/assets/fonts/CormorantGaramond-Bold.ttf")),
    readFile(join(cwd, "src/assets/fonts/SourceSans3-Regular.ttf")),
    readFile(join(cwd, "src/assets/fonts/SourceSans3-SemiBold.ttf")),
    readFile(join(cwd, "public/adept-logo.png")),
    PHOTO[photo](),
  ]);
  return {
    serif: toArrayBuffer(serif),
    sans: toArrayBuffer(sans),
    sansSemi: toArrayBuffer(sansSemi),
    logoSrc: `data:image/png;base64,${logo.toString("base64")}`,
    photoSrc: `data:image/jpeg;base64,${pic.toString("base64")}`,
  };
}

async function renderOgJpeg(title: string, kicker: string, subtitle: string, photo: OgPhoto): Promise<Uint8Array> {
  "use cache";
  cacheLife("max");
  const { serif, sans, sansSemi, logoSrc, photoSrc } = await loadOgAssets(photo);
  // "\n" in a title forces a line break (e.g. one sentence per line).
  const lines = title.split("\n");
  const longest = Math.max(...lines.map((l) => l.length));

  const png = await new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0b1a2e", fontFamily: "Source Sans 3" }}>
        {/* Photo on the right, blended into navy */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoSrc} alt="" width={760} height={630} style={{ position: "absolute", left: 440, top: 0, width: 760, height: 630, objectFit: "cover" }} />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1200,
            height: 630,
            display: "flex",
            background: "linear-gradient(90deg, #0b1a2e 0%, #0b1a2e 44%, rgba(11,26,46,0.92) 54%, rgba(11,26,46,0.45) 72%, rgba(11,26,46,0.08) 100%)",
          }}
        />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: 700, height: 630, padding: "52px 64px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", background: "#ffffff", borderRadius: 18, padding: "12px 18px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt="" width={168} height={75} style={{ width: 168, height: 75 }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", color: "#ecdcb6", fontSize: 22, fontWeight: 600, letterSpacing: 4, textTransform: "uppercase" }}>{kicker}</div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 14, color: "#ffffff", fontFamily: "Cormorant Garamond", fontSize: longest > 40 ? 54 : longest > 28 ? 62 : 76, lineHeight: 1.04, letterSpacing: -1, maxWidth: 572 }}>
              {lines.map((line) => (
                <div key={line} style={{ display: "flex" }}>
                  {line}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", marginTop: 20, color: "rgba(255,255,255,0.78)", fontSize: 26, lineHeight: 1.35, maxWidth: 560 }}>{subtitle}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18, color: "rgba(255,255,255,0.72)", fontSize: 22, fontWeight: 600 }}>
            <div style={{ display: "flex", width: 10, height: 10, borderRadius: 10, background: "#b8914a" }} />
            <div style={{ display: "flex" }}>
              {SITE.city}, {SITE.region}
            </div>
            <div style={{ display: "flex", color: "rgba(255,255,255,0.35)" }}>·</div>
            <div style={{ display: "flex" }}>{SITE.phone}</div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Cormorant Garamond", data: serif, weight: 700, style: "normal" },
        { name: "Source Sans 3", data: sans, weight: 400, style: "normal" },
        { name: "Source Sans 3", data: sansSemi, weight: 600, style: "normal" },
      ],
    },
  ).arrayBuffer();

  const jpg = await sharp(Buffer.from(png)).jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
  return new Uint8Array(jpg);
}

/** Branded share image for a route. Rendered once (cached) and served as JPEG. */
export async function ogImage(input: { title: string; kicker: string; subtitle: string; photo?: OgPhoto }) {
  const bytes = await renderOgJpeg(input.title, input.kicker, input.subtitle, input.photo ?? "hero");
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": OG_CONTENT_TYPE, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
