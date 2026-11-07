// Osmanlı Gecesi boyunluk tasarımı – motifler, renk paletleri ve şerit bileşenleri.
// Tüm ölçüler milimetre cinsindendir: şerit genişliği 20 mm.

import { useEffect, useState, type ReactNode } from "react";
import { TUGRA_PATHS } from "./tugra";

export const STRAP_W = 20;

export type Palette = {
  id: string;
  name: string;
  bg: string; // şerit zemini
  motif: string; // motif / altın
  line: string; // kenar çizgileri
};

export const PALETTES: Palette[] = [
  { id: "bordo", name: "Bordo · Altın", bg: "#6B1322", motif: "#D2AD58", line: "#E4C77E" },
  { id: "lacivert", name: "Lacivert · Altın", bg: "#13294A", motif: "#D2AD58", line: "#E4C77E" },
  { id: "zumrut", name: "Zümrüt · Altın", bg: "#0D4636", motif: "#D2AD58", line: "#E4C77E" },
  { id: "gece", name: "Gece · Altın", bg: "#16130F", motif: "#C9A04E", line: "#D9B866" },
  { id: "iznik", name: "İznik · Kobalt", bg: "#F2ECDD", motif: "#1C5A9C", line: "#2C8A86" },
];

export function starPoints(n: number, ro: number, ri: number, rotDeg = -90, cx = 0, cy = 0) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? ri : ro;
    const a = ((rotDeg + (i * 180) / n) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(3)},${(cy + r * Math.sin(a)).toFixed(3)}`);
  }
  return pts.join(" ");
}

// Lale – merkez (0,0), yükseklik ~14 mm
export function Tulip({ fill, stem = true }: { fill: string; stem?: boolean }) {
  return (
    <g fill={fill}>
      <path d="M0 -7 C1.6 -4.8 2 -2 0 1 C-2 -2 -1.6 -4.8 0 -7Z" />
      <path d="M0 1 C-3 0.6 -4.3 -2 -3.8 -5.6 C-2.3 -3.8 -1.2 -1.6 0 1Z" />
      <path d="M0 1 C3 0.6 4.3 -2 3.8 -5.6 C2.3 -3.8 1.2 -1.6 0 1Z" />
      {stem && (
        <>
          <path d="M0 1 C0.35 3 -0.35 5 0 7" stroke={fill} strokeWidth={0.7} fill="none" strokeLinecap="round" />
          <path d="M0 4.4 C-1.8 3.3 -3.2 3.7 -4 2.5 C-3 4.7 -1.6 5.1 0 5.1Z" />
          <path d="M0 5.4 C1.8 4.5 3 4.7 3.8 3.5 C3 5.7 1.6 6.1 0 6.1Z" />
        </>
      )}
    </g>
  );
}

// Hilal (açık tarafı sağa bakar), R = 6
const CRESCENT = "M3.75,-4.684 A6 6 0 1 0 3.75,4.684 A5 5 0 1 1 3.75,-4.684 Z";

export type Motif = {
  id: string;
  name: string;
  desc: string;
  w: number; // desen tekrar boyu (mm)
  render: (p: Palette) => ReactNode;
  /** Müşterinin verdiği SVG motif: şerit bandına (kenar çizgileri arası) sığdırılır. */
  img?: { src: string; vw: number; vh: number; gap: number; rows: number };
  /** Tek motifin tekrar aralığı (mm); boyun ortasında desen bu sınırlarda biter. Varsayılan: w */
  unit?: number;
  /** Kesintisiz örgü: kesilecek doğal sınır yok, uçlar yumuşakça söner */
  continuous?: boolean;
};

const BAND_Y = 2.2;
const BAND_H = STRAP_W - BAND_Y * 2;
const imgMotif = (id: string, name: string, desc: string, src: string, vw: number, vh: number, gap: number, rows = 1, extra: Partial<Motif> = {}): Motif => ({
  id,
  name,
  desc,
  w: (BAND_H * vw) / (vh / rows) + gap,
  render: () => null,
  img: { src, vw, vh, gap, rows },
  ...extra,
});

// SVG dosyalarını data-URL olarak satır içine alır: dışa aktarılan SVG/PNG ve canlı şerit dokusu
// harici dosyaya bağlı kalmasın diye.
const inlineCache = new Map<string, string>();
export function useInlineSrc(src?: string) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!src || inlineCache.has(src)) return;
    let alive = true;
    fetch(src)
      .then((r) => r.text())
      .then((t) => {
        inlineCache.set(src, "data:image/svg+xml;charset=utf-8," + encodeURIComponent(t));
        if (alive) force((n) => n + 1);
      });
    return () => {
      alive = false;
    };
  }, [src]);
  return src ? inlineCache.get(src) ?? null : null;
}

export const MOTIFS: Motif[] = [
  imgMotif("rumi", "Rumi Desen", "Kesintisiz rumi-hatayi örgüsü (motif-1)", "/motifler/motif-1.svg", 2906.4, 1667.11, 0, 1, { continuous: true }),
  imgMotif("sems", "Şemse", "Tekrarlanan tek şemse/rozet (motif2)", "/motifler/motif2.svg", 112.51, 114.23, 3),
  imgMotif("rozet", "Rozet Dizisi", "İnce çizgili altın rozetler (motif-3)", "/motifler/motif-3.svg", 35.29, 35.29, 0, 2, { unit: BAND_H }),
  {
    id: "cintemani",
    name: "Çintemani",
    desc: "Üç benek + kaplan çizgisi; kaftanlardan gelen klasik Osmanlı motifi",
    w: 26,
    render: (p) => (
      <>
        {[
          [5.3, 8],
          [9.7, 8],
          [7.5, 12],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r={2.05} fill={p.motif} />
            <circle cx={x + 0.55} cy={y - 0.35} r={1.35} fill={p.bg} />
          </g>
        ))}
        <path
          d="M13.2 8.3 q2.7 -2.4 5.4 0 t5.4 0"
          stroke={p.motif}
          strokeWidth={1.1}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M13.2 12.3 q2.7 -2.4 5.4 0 t5.4 0"
          stroke={p.motif}
          strokeWidth={1.1}
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    id: "lale",
    name: "Lale",
    unit: 16,
    desc: "Ters-düz lale dizisi; Lale Devri ve İznik çinilerine gönderme",
    w: 32,
    render: (p) => (
      <>
        <g transform="translate(8 10)">
          <Tulip fill={p.motif} />
        </g>
        <g transform="translate(24 10) rotate(180)">
          <Tulip fill={p.motif} />
        </g>
        <circle cx={16} cy={6.5} r={0.65} fill={p.motif} />
        <circle cx={16} cy={13.5} r={0.65} fill={p.motif} />
        <circle cx={0} cy={6.5} r={0.65} fill={p.motif} />
        <circle cx={32} cy={13.5} r={0.65} fill={p.motif} />
      </>
    ),
  },
];

export type EmblemDef = { id: string; name: string; desc: string };
export const EMBLEMS: EmblemDef[] = [
  { id: "tugra", name: "Tuğra", desc: "Verdiğiniz tuğra (Besmele), altın" },
  { id: "ayyildiz", name: "Ay-Yıldız", desc: "Hilal ve yıldız" },
  { id: "lale", name: "Lale", desc: "Tek büyük lale" },
  { id: "yok", name: "Sembolsüz", desc: "Sadece kesintisiz desen" },
];

// Sembolün yarım genişliği (mm); hepsi ~15.5 mm yüksekliğinde, merkez (0,0)
export const SYMBOL_HALF_W: Record<string, number> = { tugra: 12.4, ayyildiz: 10.5, lale: 4.9 };

// Kutusuz, büyük sembol
export function SymbolArt({ id, fill }: { id: string; fill: string }) {
  if (id === "tugra") return <Tugra fill={fill} />;
  if (id === "ayyildiz")
    return (
      <>
        <g transform="translate(-2.6 0) scale(1.3)">
          <path d={CRESCENT} fill={fill} />
        </g>
        <polygon points={starPoints(5, 3.4, 1.36, 180, 6, 0)} fill={fill} />
      </>
    );
  if (id === "lale")
    return (
      <g transform="scale(1.1)">
        <Tulip fill={fill} />
      </g>
    );
  return null;
}

// Boyun ortasına gelen şemse + sembol
// Tuğra: merkez (0,0), yükseklik h mm
export function Tugra({ fill, h = 15.5 }: { fill: string; h?: number }) {
  const k = h / TUGRA_BOX.h;
  return (
    <g transform={`scale(${k}) translate(${-(TUGRA_BOX.x + TUGRA_BOX.w / 2)} ${-(TUGRA_BOX.y + TUGRA_BOX.h / 2)})`} fill={fill}>
      {TUGRA_PATHS.map((d, i) => (
        <path key={i} d={d} fillRule="evenodd" clipRule="evenodd" />
      ))}
    </g>
  );
}
// Tuğranın viewBox içindeki gerçek sınırları
const TUGRA_BOX = { x: 379.1, y: 183.6, w: 4063.3, h: 2621.5 }; // getBBox ile ölçüldü

// Boyun ortasında desenin bittiği yer (merkezden mm). Desen bir motifin sınırında biter,
// böylece sembolün arkasında kesik motif / kare kalmaz.
export function emblemGap(id: string | undefined, motif: Motif) {
  const hw = id ? SYMBOL_HALF_W[id] : undefined;
  if (!hw) return 0;
  const need = hw + 4.5;
  if (motif.continuous) return need;
  const unit = motif.unit ?? motif.w;
  const r = (motif.w / 2) % unit;
  return r >= need ? r : r + Math.ceil((need - r) / unit) * unit;
}

// Boyun ortası sembolü: kutusuz, büyük; iki yanında küçük baklava
export function Emblem({ id, p, gap }: { id: string; p: Palette; gap: number }) {
  const hw = SYMBOL_HALF_W[id];
  if (!hw) return null;
  const dx = Math.min((hw + gap) / 2, hw + 4);
  return (
    <g transform={`translate(0 ${STRAP_W / 2})`}>
      <polygon points={`${-dx - 2},0 ${-dx},-1.5 ${-dx + 2},0 ${-dx},1.5`} fill={p.motif} />
      <polygon points={`${dx - 2},0 ${dx},-1.5 ${dx + 2},0 ${dx},1.5`} fill={p.motif} />
      <SymbolArt id={id} fill={p.motif} />
    </g>
  );
}

// Bir SVG içinde bir kez kullanılır: desen + parlaklık tanımları
export function StrapDefs({
  uid,
  p,
  motif,
  subtle,
  orig = false,
}: {
  uid: string;
  p: Palette;
  motif: Motif;
  subtle: boolean;
  /** SVG motiflerde dosyanın kendi renklerini kullan */
  orig?: boolean;
}) {
  const href = useInlineSrc(motif.img?.src);
  const im = motif.img;
  const iw = im ? motif.w - im.gap : 0;
  const image = im && href && (
    <svg x={im.gap / 2} y={BAND_Y} width={iw} height={BAND_H} viewBox={`0 0 ${im.vw} ${im.vh / im.rows}`} preserveAspectRatio="none">
      <image href={href} width={im.vw} height={im.vh} />
    </svg>
  );
  return (
    <defs>
      {im && href && !orig && (
        <mask id={`${uid}-m`} maskUnits="userSpaceOnUse" x={0} y={0} width={motif.w} height={STRAP_W} style={{ maskType: "alpha" }}>
          {image}
        </mask>
      )}
      <pattern
        id={`${uid}-pat`}
        x={-motif.w / 2}
        y={0}
        width={motif.w}
        height={STRAP_W}
        patternUnits="userSpaceOnUse"
      >
        <rect width={motif.w} height={STRAP_W} fill={p.bg} />
        <g opacity={subtle ? 0.42 : 1}>
          {im ? (
            href &&
            (orig ? image : <rect width={motif.w} height={STRAP_W} fill={p.motif} mask={`url(#${uid}-m)`} />)
          ) : (
            motif.render(p)
          )}
        </g>
      </pattern>
      <linearGradient id={`${uid}-fadeL`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={p.bg} stopOpacity="0" />
        <stop offset="1" stopColor={p.bg} stopOpacity="1" />
      </linearGradient>
      <linearGradient id={`${uid}-fadeR`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={p.bg} stopOpacity="1" />
        <stop offset="1" stopColor={p.bg} stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.18" />
        <stop offset="0.3" stopColor="#fff" stopOpacity="0.1" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.22" />
      </linearGradient>
    </defs>
  );
}

// Şeridin bir parçası: x0..x1, y 0..20 (yerel koordinat)
export function StrapSegment({
  uid,
  p,
  x0,
  x1,
  emblem,
  motif,
  sheen = false,
}: {
  uid: string;
  p: Palette;
  x0: number;
  x1: number;
  emblem?: string;
  /** emblem verildiğinde desenin nerede biteceğini hesaplamak için */
  motif?: Motif;
  sheen?: boolean;
}) {
  const w = x1 - x0;
  const gap = emblem && motif ? emblemGap(emblem, motif) : 0;
  const fade = 10;
  const pat = `url(#${uid}-pat)`;
  return (
    <g>
      {gap > 0 ? (
        <>
          <rect x={x0} y={0} width={w} height={STRAP_W} fill={p.bg} />
          {x0 < -gap && <rect x={x0} y={0} width={-gap - x0} height={STRAP_W} fill={pat} />}
          {x1 > gap && <rect x={gap} y={0} width={x1 - gap} height={STRAP_W} fill={pat} />}
          {motif?.continuous && (
            <>
              <rect x={-gap - fade} y={0} width={fade} height={STRAP_W} fill={`url(#${uid}-fadeL)`} />
              <rect x={gap} y={0} width={fade} height={STRAP_W} fill={`url(#${uid}-fadeR)`} />
            </>
          )}
        </>
      ) : (
        <rect x={x0} y={0} width={w} height={STRAP_W} fill={pat} />
      )}
      <line x1={x0} x2={x1} y1={1.6} y2={1.6} stroke={p.line} strokeWidth={0.45} />
      <line x1={x0} x2={x1} y1={STRAP_W - 1.6} y2={STRAP_W - 1.6} stroke={p.line} strokeWidth={0.45} />
      {emblem && <Emblem id={emblem} p={p} gap={gap} />}
      {sheen && <rect x={x0} y={0} width={w} height={STRAP_W} fill={`url(#${uid}-sheen)`} />}
    </g>
  );
}
