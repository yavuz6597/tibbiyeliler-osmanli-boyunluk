"use client";

// Yaka kartının saf SVG (vektör) hali – matbaa için. Ölçüler mm: 60 × 90.
// Yazılar opentype.js ile eğriye çevrilir; dosya açan bilgisayarda Gilroy olmasa da aynı görünür.
// Canlı mockup'taki HTML kartla (live-badge.tsx) aynı yerleşimi izler.

import { forwardRef, useEffect, useId, useState } from "react";
import opentype from "opentype.js";
import { STRAP_W, SYMBOL_HALF_W, StrapDefs, StrapSegment, SymbolArt, useInlineSrc } from "./motifs";
import type { Design } from "./live-badge";

const CARD_MM_W = 60;
export const CARD_MM = { w: CARD_MM_W, h: 90 };
const PAPER = "#FBF7EE";

/* ---------- fontlar ---------- */

type Fonts = { regular: opentype.Font; bold: opentype.Font; extra: opentype.Font };
let fontsPromise: Promise<Fonts> | null = null;
function loadFonts() {
  fontsPromise ??= Promise.all(
    ["Gilroy-Regular", "Gilroy-Bold", "Gilroy-ExtraBold"].map((n) => opentype.load(`/fonts/${n}.ttf`))
  ).then(([regular, bold, extra]) => ({ regular, bold, extra }));
  return fontsPromise;
}
export function useFonts() {
  const [fonts, setFonts] = useState<Fonts | null>(null);
  useEffect(() => {
    let alive = true;
    loadFonts().then((f) => alive && setFonts(f));
    return () => {
      alive = false;
    };
  }, []);
  return fonts;
}

export type TextSpec = {
  text: string;
  x: number;
  y: number; // taban çizgisi
  size: number;
  spacing?: number;
  anchor?: "start" | "middle";
  maxWidth?: number;
};

/** Metni glif glif yerleştirir ve eğri komutlarını döndürür (mm). SVG ve PDF aynı yerleşimi kullanır. */
export function textPaths(font: opentype.Font, t: TextSpec): opentype.Path[] {
  const { text, x, y, size, spacing = 0, anchor = "start", maxWidth } = t;
  const glyphs = font.stringToGlyphs(text);
  const k = (s: number) => s / font.unitsPerEm;
  const widthAt = (s: number) =>
    glyphs.reduce((w, g) => w + (g.advanceWidth ?? 0) * k(s) + spacing, 0) - (glyphs.length ? spacing : 0);
  // uzun isimler kartın dışına taşmasın
  let s = size;
  if (maxWidth && widthAt(s) > maxWidth) s = (size * maxWidth) / widthAt(size);
  let cx = anchor === "middle" ? x - widthAt(s) / 2 : x;
  return glyphs.map((g) => {
    const p = g.getPath(cx, y, s);
    cx += (g.advanceWidth ?? 0) * k(s) + spacing;
    return p;
  });
}

function OutlinedText({ font, fill, ...t }: TextSpec & { font: opentype.Font; fill: string }) {
  const d = textPaths(font, t)
    .map((p) => p.toPathData(3))
    .join("");
  return <path d={d} fill={fill} />;
}

/** Arka yüzdeki isim ve görev yazılarının yerleşimi (mm) */
export const BACK_TEXT = {
  name: (name: string): TextSpec => ({ text: name, x: 6.26, y: 43, size: 6.26, maxWidth: CARD_MM_W - 12.5 }),
  role: (role: string): TextSpec => ({
    text: role.toLocaleUpperCase("tr-TR"),
    x: 6.26,
    y: 47.6,
    size: 2.6,
    spacing: 0.52,
    maxWidth: CARD_MM_W - 12.5,
  }),
  nameColor: "#2b2117",
  roleColor: "#8b7b66",
};

/* ---------- parçalar ---------- */

function Band({ d, y }: { d: Design; y: number }) {
  const uid = "cb" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const h = (CARD_MM.w * STRAP_W) / 130;
  return (
    <svg x={0} y={y} width={CARD_MM.w} height={h} viewBox={`-65 0 130 ${STRAP_W}`} preserveAspectRatio="xMidYMid slice">
      <StrapDefs uid={uid} p={d.p} motif={d.motif} subtle={d.subtle} orig={d.orig} />
      <StrapSegment uid={uid} p={d.p} x0={-65} x1={65} />
    </svg>
  );
}
const BAND_H = (CARD_MM.w * STRAP_W) / 130;
const TOP_Y = CARD_MM.w * 0.18;

function useDataUrl(src: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(src)
      .then((r) => r.blob())
      .then(
        (b) =>
          new Promise<string>((res) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result as string);
            fr.readAsDataURL(b);
          })
      )
      .then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [src]);
  return url;
}

/** Kartın her şeyi (font, logo, motif) hazır mı? Hazır değilken dışa aktarma yapılmaz. */
export function useCardReady(d: Design) {
  const fonts = useFonts();
  const logo = useDataUrl("/logo-siyah.png");
  const motif = useInlineSrc(d.motif.img?.src);
  return { fonts, logo, ready: !!fonts && !!logo && (!d.motif.img || !!motif) };
}

/* ---------- yüzler ---------- */

type FaceProps = { d: Design; fonts: Fonts | null; logo: string | null };

export const CardFrontSvg = forwardRef<SVGSVGElement, FaceProps>(function CardFrontSvg({ d, fonts, logo }, ref) {
  const ink = d.p.id === "iznik" ? d.p.motif : d.p.bg;
  const hw = SYMBOL_HALF_W[d.emblem];
  const symH = 31.6;
  const symW = hw ? (symH * (hw + 0.3) * 2) / 16.4 : 0;
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${CARD_MM.w} ${CARD_MM.h}`} className="block w-full h-full">
      <rect width={CARD_MM.w} height={CARD_MM.h} fill={PAPER} />
      <Band d={d} y={TOP_Y} />
      <Band d={d} y={CARD_MM.h - CARD_MM.w * 0.06 - BAND_H} />
      {hw && (
        <svg
          x={30 - symW / 2}
          y={hw ? 21.6 : 0}
          width={symW}
          height={symH}
          viewBox={`${-(hw + 0.3)} -8.2 ${(hw + 0.3) * 2} 16.4`}
        >
          <SymbolArt id={d.emblem} fill={ink} />
        </svg>
      )}
      {fonts && (
        <>
          <OutlinedText font={fonts.bold} text="OSMANLI GECESİ" x={30} y={58.6} size={2.9} spacing={0.87} anchor="middle" fill={ink} />
          <OutlinedText font={fonts.regular} text="HATIRA" x={30} y={62.2} size={2.35} spacing={0.47} anchor="middle" fill="#8b7b66" />
        </>
      )}
      {logo && <image href={logo} x={18.3} y={64.6} width={23.4} height={8.6} opacity={0.8} />}
    </svg>
  );
});

export const CardBackSvg = forwardRef<SVGSVGElement, FaceProps & { name: string; role: string }>(function CardBackSvg(
  { d, fonts, name, role },
  ref
) {
  const blockY = CARD_MM.h * 0.7;
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${CARD_MM.w} ${CARD_MM.h}`} className="block w-full h-full">
      <rect width={CARD_MM.w} height={CARD_MM.h} fill={PAPER} />
      <Band d={d} y={TOP_Y} />
      <rect x={0} y={blockY} width={CARD_MM.w} height={CARD_MM.h - blockY} fill={d.p.bg} />
      <Band d={d} y={blockY} />
      <rect x={6.26} y={33.5} width={6.26} height={0.52} fill={d.p.motif} />
      {fonts && (
        <>
          <OutlinedText font={fonts.extra} fill={BACK_TEXT.nameColor} {...BACK_TEXT.name(name)} />
          <OutlinedText font={fonts.regular} fill={BACK_TEXT.roleColor} {...BACK_TEXT.role(role)} />
        </>
      )}
    </svg>
  );
});
