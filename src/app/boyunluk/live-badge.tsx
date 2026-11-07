"use client";

// 21st.dev LanyardBadge'i Osmanlı Gecesi deseniyle besleyen sarmalayıcı.
// Seçili motif bir SVG karosu olarak çizilir, resme çevrilir ve şeride doku olarak basılır.

import { useEffect, useId, useRef, useState } from "react";
import LanyardBadge from "@/components/ui/lanyard-badge";
import { STRAP_W, SYMBOL_HALF_W, SymbolArt, StrapDefs, StrapSegment, useInlineSrc, type Motif, type Palette } from "./motifs";

export type Design = { p: Palette; motif: Motif; emblem: string; subtle: boolean; orig?: boolean };

const PX_PER_MM = 10;

function useStrapTile(d: Design) {
  const ref = useRef<SVGSVGElement>(null);
  const [tile, setTile] = useState<{ img: HTMLImageElement; key: string } | null>(null);
  const inlined = useInlineSrc(d.motif.img?.src);
  const ready = !d.motif.img || !!inlined;
  const key = `${d.p.id}-${d.motif.id}-${d.subtle ? 1 : 0}-${d.orig ? 1 : 0}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || !ready) return;
    const xml = new XMLSerializer().serializeToString(el);
    const img = new Image();
    let alive = true;
    img.onload = () => alive && setTile({ img, key });
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
    return () => {
      alive = false;
    };
  }, [key, ready]);

  const w = d.motif.w;
  const svg = (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={w * PX_PER_MM}
      height={STRAP_W * PX_PER_MM}
      viewBox={`0 0 ${w} ${STRAP_W}`}
    >
      <StrapDefs uid="tile" p={d.p} motif={d.motif} subtle={d.subtle} orig={d.orig} />
      <StrapSegment uid="tile" p={d.p} x0={0} x1={w} />
    </svg>
  );
  return { svg, tile };
}

function Band({ d }: { d: Design }) {
  const uid = "b" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg viewBox={`-65 0 130 ${STRAP_W}`} className="block w-full h-auto" preserveAspectRatio="xMidYMid slice">
      <StrapDefs uid={uid} p={d.p} motif={d.motif} subtle={d.subtle} orig={d.orig} />
      <StrapSegment uid={uid} p={d.p} x0={-65} x1={65} />
    </svg>
  );
}

export function CardFront({ d }: { d: Design }) {
  // kart kremi üzerinde okunaklı koyu ton: şerit zemini (İznik'te kobalt)
  const ink = d.p.id === "iznik" ? d.p.motif : d.p.bg;
  return (
    <div className="relative h-full w-full flex flex-col bg-[#FBF7EE] text-[#2b2117]">
      <div className="pt-[18%]" />
      <Band d={d} />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
        {SYMBOL_HALF_W[d.emblem] && (
          <svg
            viewBox={`${-(SYMBOL_HALF_W[d.emblem] + 0.3)} -8.2 ${(SYMBOL_HALF_W[d.emblem] + 0.3) * 2} 16.4`}
            style={{ width: `${(88 * (SYMBOL_HALF_W[d.emblem] + 0.3)) / 12.7}%` }}
            aria-label="Sembol"
          >
            <SymbolArt id={d.emblem} fill={ink} />
          </svg>
        )}
        <div className="text-center">
          <div className="text-[11px] tracking-[0.3em] font-bold" style={{ color: ink }}>
            OSMANLI GECESİ
          </div>
          <div className="text-[9px] tracking-[0.2em] text-[#8b7b66] mt-1">HATIRA</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-siyah.png" alt="Ankara Tıbbiyeliler" className="w-[42%] opacity-80" draggable={false} />
      </div>
      <Band d={d} />
      <div className="pb-[6%]" />
    </div>
  );
}

export function CardBack({ d, name, role }: { d: Design; name: string; role: string }) {
  return (
    <div className="relative h-full w-full flex flex-col bg-[#FBF7EE] text-[#2b2117]">
      <div className="pt-[18%]" />
      <Band d={d} />
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="w-6 h-[2px] mb-3" style={{ background: d.p.motif }} />
        <div className="text-2xl font-extrabold leading-tight">{name}</div>
        <div className="text-[10px] tracking-[0.2em] text-[#8b7b66] mt-1 uppercase">{role}</div>
      </div>
      <div className="h-[30%]">
        <div className="h-full w-full" style={{ background: d.p.bg }}>
          <Band d={d} />
        </div>
      </div>
    </div>
  );
}

export default function LiveBadge({
  d,
  name = "Ad Soyad",
  role = "Katılımcı",
  height = "720px",
}: {
  d: Design;
  name?: string;
  role?: string;
  height?: string;
}) {
  const { svg, tile } = useStrapTile(d);
  return (
    <>
      <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden>
        {svg}
      </div>
      <LanyardBadge
        height={height}
        cardWidth={230}
        strapColor={d.p.bg}
        inkColor={d.p.motif}
        strapPattern={tile?.img ?? null}
        strapPatternKey={tile?.key ?? ""}
        front={<CardFront d={d} />}
        back={<CardBack d={d} name={name} role={role} />}
        flipLabels={["Arkasını göster", "Önünü göster"]}
      />
    </>
  );
}
