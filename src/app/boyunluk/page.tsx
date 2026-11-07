"use client";

import { useId, useRef, useState } from "react";
import { Download } from "lucide-react";
import {
  EMBLEMS,
  MOTIFS,
  PALETTES,
  STRAP_W,
  StrapDefs,
  StrapSegment,
  type Motif,
  type Palette,
} from "./motifs";
import LiveBadge from "./live-badge";
import { CARD_MM, CardBackSvg, CardFrontSvg, useCardReady } from "./card-svg";
import BulkPrint from "./bulk-print";

const safe = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "");

type Design = { p: Palette; motif: Motif; emblem: string; subtle: boolean; orig?: boolean };

/* ---------------- Mockup: askıya asılmış boyunluk ---------------- */

function Strip({
  uid,
  p,
  from,
  to,
}: {
  uid: string;
  p: Palette;
  from: [number, number];
  to: [number, number];
}) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <g transform={`translate(${from[0]} ${from[1]}) rotate(${ang.toFixed(3)}) translate(0 ${-STRAP_W / 2})`}>
      <StrapSegment uid={uid} p={p} x0={0} x1={len} sheen />
    </g>
  );
}

function Mockup({ d, sway }: { d: Design; sway: boolean }) {
  const uid = "m" + safe(useId());
  const { p } = d;
  const cx = 130;
  const rodY = 46;
  return (
    <svg viewBox="52 22 156 504" className="w-full h-full">
      <StrapDefs uid={uid} p={p} motif={d.motif} subtle={d.subtle} orig={d.orig} />
      <defs>
        <linearGradient id={`${uid}-rod`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a5a33" />
          <stop offset="0.45" stopColor="#c08a58" />
          <stop offset="1" stopColor="#5b3a20" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3dc9a" />
          <stop offset="0.5" stopColor="#c99a3e" />
          <stop offset="1" stopColor="#8d6620" />
        </linearGradient>
        <linearGradient id={`${uid}-fold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.35" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
        <filter id={`${uid}-sh`} x="-30%" y="-10%" width="160%" height="130%">
          <feDropShadow dx="3" dy="5" stdDeviation="3.5" floodColor="#2a1d10" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* askı çubuğu */}
      <rect x={58} y={rodY - 5} width={144} height={10} rx={5} fill={`url(#${uid}-rod)`} />
      <circle cx={58} cy={rodY} r={7} fill={`url(#${uid}-gold)`} />
      <circle cx={202} cy={rodY} r={7} fill={`url(#${uid}-gold)`} />

      <g filter={`url(#${uid}-sh)`}>
        <g className={sway ? "lanyard-sway" : undefined} style={{ transformOrigin: `${cx}px ${rodY}px` }}>
          <Strip uid={uid} p={p} from={[cx - 34, rodY]} to={[cx - 6, 398]} />
          <Strip uid={uid} p={p} from={[cx + 34, rodY]} to={[cx + 6, 398]} />

          {/* metal kıskaç + karabina */}
          <rect x={cx - 15} y={390} width={30} height={13} rx={2.5} fill={`url(#${uid}-gold)`} />
          <line x1={cx - 12} x2={cx + 12} y1={396.5} y2={396.5} stroke="#7a571b" strokeWidth={0.6} />
          <circle cx={cx} cy={409} r={4.6} fill="none" stroke={`url(#${uid}-gold)`} strokeWidth={2} />

          {/* yaka kartı */}
          <g>
            <rect x={cx - 29} y={428} width={58} height={90} rx={4} fill="#FBF7EE" stroke="#d9cdb4" strokeWidth={0.6} />
            <rect x={cx - 8} y={432} width={16} height={3.6} rx={1.8} fill="#00000030" />
            <g transform={`translate(${cx - 29} 440) scale(${58 / 96} 0.55)`}>
              <StrapSegment uid={uid} p={p} x0={0} x1={96} />
            </g>
            <image href="/logo-siyah.png" x={cx - 24} y={458} width={48} height={17.6} />
            <line x1={cx - 18} x2={cx + 18} y1={489} y2={489} stroke={p.motif} strokeWidth={0.5} />
            <text x={cx} y={499} textAnchor="middle" fontSize={5.4} fontWeight={700} fill="#2b2117">
              Ad Soyad
            </text>
            <text x={cx} y={507} textAnchor="middle" fontSize={3.4} fill="#7b6a55" letterSpacing={0.6}>
              OSMANLI GECESİ
            </text>
          </g>
          <path
            d={`M${cx - 3.6} 412 C${cx - 7.5} 418 ${cx - 6.5} 427 ${cx} 434 C${cx + 6.5} 427 ${cx + 7.5} 418 ${cx + 3.6} 412Z`}
            fill={`url(#${uid}-gold)`}
          />
        </g>

        {/* çubuğun üstünden geçen kısım – sembol tam burada, boyun ortası */}
        <g transform={`translate(${cx} ${rodY - STRAP_W / 2})`}>
          <StrapSegment uid={uid} p={p} x0={-46} x1={46} emblem={d.emblem} motif={d.motif} />
          <rect x={-46} y={0} width={92} height={STRAP_W} fill={`url(#${uid}-fold)`} />
        </g>
      </g>
    </svg>
  );
}

/* ---------------- Düz baskı görünümü ---------------- */

const FlatStrap = ({
  d,
  from,
  to,
  svgRef,
  pad = 2,
}: {
  d: Design;
  from: number;
  to: number;
  svgRef?: React.Ref<SVGSVGElement>;
  pad?: number;
}) => {
  const uid = "f" + safe(useId());
  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${from - pad} ${-pad} ${to - from + pad * 2} ${STRAP_W + pad * 2}`}
      className="w-full h-auto block"
    >
      <StrapDefs uid={uid} p={d.p} motif={d.motif} subtle={d.subtle} orig={d.orig} />
      <StrapSegment uid={uid} p={d.p} x0={from} x1={to} emblem={d.emblem} motif={d.motif} />
    </svg>
  );
};

/* ---------------- Sayfa ---------------- */

export default function BoyunlukPage() {
  const [paletteId, setPaletteId] = useState("bordo");
  const [motifId, setMotifId] = useState("rumi");
  const [emblem, setEmblem] = useState("tugra");
  const [subtle, setSubtle] = useState(false);
  const [orig, setOrig] = useState(false);
  const [sway, setSway] = useState(true);
  const [view, setView] = useState<"canli" | "aski">("canli");
  const printRef = useRef<SVGSVGElement>(null);
  const frontRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<SVGSVGElement>(null);
  const [name, setName] = useState("Ad Soyad");
  const [role, setRole] = useState("Katılımcı");
  const [busy, setBusy] = useState<string | null>(null);

  const d: Design = {
    p: PALETTES.find((x) => x.id === paletteId)!,
    motif: MOTIFS.find((x) => x.id === motifId)!,
    emblem,
    subtle,
    orig,
  };

  const fileBase = `boyunluk-${paletteId}-${motifId}-${emblem}`;

  const exportSvg = () => {
    const el = printRef.current;
    if (!el) return;
    const clone = el.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("viewBox", `-450 0 900 ${STRAP_W}`);
    clone.setAttribute("width", "900mm");
    clone.setAttribute("height", `${STRAP_W}mm`);
    clone.removeAttribute("class");
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${fileBase}-900x20mm.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportPng = () => {
    const el = printRef.current;
    if (!el) return;
    const pxPerMm = 12;
    const W = 900 * pxPerMm;
    const H = STRAP_W * pxPerMm;
    const clone = el.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("viewBox", `-450 0 900 ${STRAP_W}`);
    clone.setAttribute("width", String(W));
    clone.setAttribute("height", String(H));
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" })
    );
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      c.getContext("2d")!.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = `${fileBase}-${pxPerMm}px-mm.png`;
      a.click();
    };
    img.src = url;
  };

  // Kart: 60 × 90 mm vektör SVG; PNG aynı SVG'den 300 dpi (709 × 1063 px) üretilir.
  const card = useCardReady(d);
  const cardSvgString = (el: SVGSVGElement, w: string, h: string) => {
    const clone = el.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", w);
    clone.setAttribute("height", h);
    clone.removeAttribute("class");
    return new XMLSerializer().serializeToString(clone);
  };
  const download = (href: string, name: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    a.click();
  };
  const exportCard = async (which: "on" | "arka", fmt: "svg" | "png") => {
    const el = (which === "on" ? frontRef : backRef).current;
    if (!el || !card.ready) return;
    const base = `kart-${which}-${paletteId}-${motifId}-${emblem}-60x90mm`;
    if (fmt === "svg") {
      const url = URL.createObjectURL(
        new Blob([cardSvgString(el, `${CARD_MM.w}mm`, `${CARD_MM.h}mm`)], { type: "image/svg+xml" })
      );
      download(url, `${base}.svg`);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    setBusy(which);
    try {
      const W = 709;
      const H = 1063;
      const img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(cardSvgString(el, String(W), String(H)));
      await img.decode();
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      c.getContext("2d")!.drawImage(img, 0, 0, W, H);
      download(c.toDataURL("image/png"), `${base}-300dpi.png`);
    } finally {
      setBusy(null);
    }
  };

  const onExportClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { which, fmt } = e.currentTarget.dataset as { which: "on" | "arka"; fmt: "svg" | "png" };
    void exportCard(which, fmt);
  };

  const chip = (active: boolean) =>
    `px-3 py-2 rounded-lg text-sm border transition text-left ${
      active ? "border-[#8d6620] bg-[#f6ead0] text-[#3a2a12]" : "border-[#e2d7c2] bg-white hover:bg-[#faf5ea] text-[#4a3f33]"
    }`;

  return (
    <main className="min-h-screen bg-[#F1EBDF] text-[#2b2117]">
      <style>{`
        @keyframes lanyardSway { 0%,100% { transform: rotate(-1deg) } 50% { transform: rotate(1deg) } }
        .lanyard-sway { transform-box: view-box; animation: lanyardSway 4.8s ease-in-out infinite; }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-6">
          <p className="text-xs tracking-[0.25em] text-[#8d6620] font-semibold">ANKARA TIBBİYELİLER · OSMANLI GECESİ</p>
          <h1 className="text-3xl font-extrabold mt-1">Boyunluk Tasarımı</h1>
          <p className="text-[#6b5d4c] mt-1 text-sm">
            Yazısız, motifli zemin · boyun ortasında Osmanlı sembolü · günlük kullanıma uygun 20 mm şerit
          </p>
        </header>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Kontroller */}
          <aside className="space-y-5">
            <section>
              <h2 className="text-xs font-bold tracking-widest text-[#8d6620] mb-2">RENK</h2>
              <div className="grid grid-cols-1 gap-2">
                {PALETTES.map((x) => (
                  <button key={x.id} onClick={() => setPaletteId(x.id)} className={chip(paletteId === x.id) + " flex items-center gap-3"}>
                    <span className="flex">
                      <span className="w-5 h-5 rounded-l" style={{ background: x.bg }} />
                      <span className="w-5 h-5 rounded-r" style={{ background: x.motif }} />
                    </span>
                    {x.name}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xs font-bold tracking-widest text-[#8d6620] mb-2">ZEMİN MOTİFİ</h2>
              <div className="grid gap-2">
                {MOTIFS.map((m) => (
                  <button key={m.id} onClick={() => setMotifId(m.id)} className={chip(motifId === m.id)}>
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-xs opacity-70">{m.desc}</div>
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer">
                <input type="checkbox" checked={subtle} onChange={(e) => setSubtle(e.target.checked)} />
                Sade mod (motif daha soluk – günlük kullanım için)
              </label>
              {MOTIFS.find((m) => m.id === motifId)?.img && (
                <label className="flex items-center gap-2 mt-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={orig} onChange={(e) => setOrig(e.target.checked)} />
                  Motifin kendi renkleri (tek renk yerine)
                </label>
              )}
            </section>

            <section>
              <h2 className="text-xs font-bold tracking-widest text-[#8d6620] mb-2">BOYUN ORTASI SEMBOLÜ</h2>
              <div className="grid grid-cols-2 gap-2">
                {EMBLEMS.map((e) => (
                  <button key={e.id} onClick={() => setEmblem(e.id)} className={chip(emblem === e.id)}>
                    <div className="font-semibold">{e.name}</div>
                    <div className="text-[11px] opacity-70 leading-tight">{e.desc}</div>
                  </button>
                ))}
              </div>
            </section>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={sway} onChange={(e) => setSway(e.target.checked)} />
              Sallanma animasyonu
            </label>
          </aside>

          {/* Mockup */}
          <section className="relative rounded-2xl bg-gradient-to-b from-[#FBF8F1] to-[#E9E0CE] border border-[#e2d7c2] shadow-sm overflow-hidden">
            <div className="absolute left-4 top-4 z-20 flex rounded-full bg-white/80 border border-[#e2d7c2] p-1 text-sm">
              {([
                ["canli", "Canlı (sürükle, çevir)"],
                ["aski", "Askıda · sembol görünür"],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  className={`px-3 py-1.5 rounded-full ${view === k ? "bg-[#2b2117] text-white" : "text-[#4a3f33]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {view === "canli" ? (
              <LiveBadge d={d} />
            ) : (
              <div className="h-[720px] max-w-[440px] mx-auto py-4 pt-14">
                <Mockup d={d} sway={sway} />
              </div>
            )}
          </section>
        </div>

        {/* Baskı görünümü */}
        <section className="mt-8 rounded-2xl bg-white border border-[#e2d7c2] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="font-bold text-lg">Baskı dosyası · 900 × 20 mm</h2>
              <p className="text-sm text-[#6b5d4c]">Şeridin açılmış hali. Sembol tam ortada (boyun arkası), uçlar kıskaca girer.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportSvg} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2b2117] text-white text-sm">
                <Download size={16} /> SVG (matbaa)
              </button>
              <button onClick={exportPng} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2b2117] text-sm">
                <Download size={16} /> PNG
              </button>
            </div>
          </div>

          <FlatStrap d={d} from={-450} to={450} svgRef={printRef} />
          <div className="flex justify-between text-[11px] text-[#8b7b66] mt-1">
            <span>← kıskaç ucu</span>
            <span>boyun ortası</span>
            <span>kıskaç ucu →</span>
          </div>

          <h3 className="font-semibold mt-6 mb-2 text-sm">Boyun ortası detay (ortadaki 24 cm)</h3>
          <FlatStrap d={d} from={-120} to={120} />
        </section>

        {/* Kart baskı */}
        <section className="mt-6 rounded-2xl bg-white border border-[#e2d7c2] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="font-bold text-lg">Kart baskı dosyası · 60 × 90 mm</h2>
              <p className="text-sm text-[#6b5d4c]">
                SVG vektör (yazılar eğriye çevrili, matbaa için önerilen) veya PNG 300 dpi. Delik yeri ve köşe yuvarlatma kesimde yapılır.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["on", "arka"] as const).map((w) =>
                (["svg", "png"] as const).map((f) => (
                  <button
                    key={w + f}
                    data-which={w}
                    data-fmt={f}
                    onClick={onExportClick}
                    disabled={!card.ready || !!busy}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${
                      f === "svg" ? "bg-[#2b2117] text-white" : "border border-[#2b2117]"
                    }`}
                  >
                    <Download size={16} />
                    {busy === w && f === "png" ? "Hazırlanıyor…" : `${w === "on" ? "Ön" : "Arka"} yüz ${f.toUpperCase()}`}
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <label className="flex flex-col gap-1">
              Arka yüz – isim
              <input value={name} onChange={(e) => setName(e.target.value)} className="border border-[#e2d7c2] rounded-lg px-3 py-1.5" />
            </label>
            <label className="flex flex-col gap-1">
              Arka yüz – görev
              <input value={role} onChange={(e) => setRole(e.target.value)} className="border border-[#e2d7c2] rounded-lg px-3 py-1.5" />
            </label>
          </div>
          <div className="flex flex-wrap gap-6">
            <figure>
              <div style={{ width: 230, height: 345 }} className="shadow-md">
                <CardFrontSvg ref={frontRef} d={d} fonts={card.fonts} logo={card.logo} />
              </div>
              <figcaption className="text-xs text-[#8b7b66] mt-2 text-center">Ön yüz</figcaption>
            </figure>
            <figure>
              <div style={{ width: 230, height: 345 }} className="shadow-md">
                <CardBackSvg ref={backRef} d={d} fonts={card.fonts} logo={card.logo} name={name} role={role} />
              </div>
              <figcaption className="text-xs text-[#8b7b66] mt-2 text-center">Arka yüz</figcaption>
            </figure>
          </div>
        </section>

        <BulkPrint
          d={d}
          fonts={card.fonts}
          logo={card.logo}
          ready={card.ready}
          frontRef={frontRef}
          defaultRole={role}
          fileBase={`kart-${paletteId}-${motifId}-${emblem}`}
        />

        <section className="mt-6 text-sm text-[#5b4e3f] grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/60 border border-[#e2d7c2] p-4">
            <b>Baskı:</b> Çift yüz süblimasyon, saten polyester. Altın tonu süblimasyonda hardal-sarı çıkar; gerçek
            yaldız istenirse sembol için varak/hot-stamp önerilir.
          </div>
          <div className="rounded-xl bg-white/60 border border-[#e2d7c2] p-4">
            <b>Donanım:</b> Altın renk kıskaç + karabina. Günlük kullanım için boyun ortasına emniyet (breakaway)
            klipsi eklenirse sembol klipsin hemen yanına kaydırılır.
          </div>
          <div className="rounded-xl bg-white/60 border border-[#e2d7c2] p-4">
            <b>Ölçü:</b> 20 mm şerit, toplam 90 cm. 25 mm seçilirse motifler aynı kalır, sembol daha rahat okunur.
          </div>
        </section>
      </div>
    </main>
  );
}
