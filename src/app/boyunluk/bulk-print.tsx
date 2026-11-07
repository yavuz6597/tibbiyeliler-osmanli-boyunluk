"use client";

// Toplu kart baskısı: isim listesinden tek PDF.
// Ön yüz ve isimsiz arka yüz zemini PDF'e birer kez (600 dpi) gömülür; her kişinin adı/görevi
// vektör eğri olarak üstüne çizilir. Böylece 300 kişilik PDF bile hafif kalır, yazılar keskin olur.

import { useMemo, useRef, useState, type RefObject } from "react";
import { Download } from "lucide-react";
import type opentype from "opentype.js";
import { BACK_TEXT, CARD_MM, CardBackSvg, textPaths, type TextSpec } from "./card-svg";
import type { Design } from "./live-badge";

type Fonts = { regular: opentype.Font; bold: opentype.Font; extra: opentype.Font };
type Person = { name: string; role: string };
type Layout = "tekli" | "a4";

const DPI = 600;

export function parsePeople(raw: string, defaultRole: string): Person[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name, role] = l.split(/\t|;|,/).map((x) => x.trim());
      return { name, role: role || defaultRole };
    })
    .filter((p) => p.name);
}

async function rasterize(el: SVGSVGElement, dpi: number) {
  const W = Math.round((CARD_MM.w / 25.4) * dpi);
  const H = Math.round((CARD_MM.h / 25.4) * dpi);
  const clone = el.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(W));
  clone.setAttribute("height", String(H));
  clone.removeAttribute("class");
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  await img.decode();
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  c.getContext("2d")!.drawImage(img, 0, 0, W, H);
  return c.toDataURL("image/png");
}

const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];

type Doc = InstanceType<typeof import("jspdf").jsPDF>;

/** opentype eğrilerini jsPDF yol komutlarına çevirip doldurur (ox, oy: kartın sayfadaki köşesi). */
function drawText(doc: Doc, font: opentype.Font, spec: TextSpec, color: string, ox: number, oy: number) {
  const ops: { op: string; c: number[] }[] = [];
  let px = 0;
  let py = 0;
  for (const path of textPaths(font, spec)) {
    for (const c of path.commands) {
      if (c.type === "M") {
        ops.push({ op: "m", c: [ox + c.x, oy + c.y] });
        [px, py] = [c.x, c.y];
      } else if (c.type === "L") {
        ops.push({ op: "l", c: [ox + c.x, oy + c.y] });
        [px, py] = [c.x, c.y];
      } else if (c.type === "C") {
        ops.push({ op: "c", c: [ox + c.x1, oy + c.y1, ox + c.x2, oy + c.y2, ox + c.x, oy + c.y] });
        [px, py] = [c.x, c.y];
      } else if (c.type === "Q") {
        // ikinci derece eğriyi kübiğe çevir
        const c1x = px + (2 / 3) * (c.x1 - px);
        const c1y = py + (2 / 3) * (c.y1 - py);
        const c2x = c.x + (2 / 3) * (c.x1 - c.x);
        const c2y = c.y + (2 / 3) * (c.y1 - c.y);
        ops.push({ op: "c", c: [ox + c1x, oy + c1y, ox + c2x, oy + c2y, ox + c.x, oy + c.y] });
        [px, py] = [c.x, c.y];
      } else if (c.type === "Z") {
        ops.push({ op: "h", c: [] });
      }
    }
  }
  if (!ops.length) return;
  doc.setFillColor(...hexRgb(color));
  doc.path(ops);
  doc.fill();
}

function cropMarks(doc: Doc, x: number, y: number, w: number, h: number) {
  const a = 1; // karttan uzaklık
  const L = 2.5; // işaret boyu
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.1);
  for (const cx of [x, x + w]) {
    doc.line(cx, y - a - L, cx, y - a);
    doc.line(cx, y + h + a, cx, y + h + a + L);
  }
  for (const cy of [y, y + h]) {
    doc.line(x - a - L, cy, x - a, cy);
    doc.line(x + w + a, cy, x + w + a + L, cy);
  }
}

export default function BulkPrint({
  d,
  fonts,
  logo,
  ready,
  frontRef,
  defaultRole,
  fileBase,
}: {
  d: Design;
  fonts: Fonts | null;
  logo: string | null;
  ready: boolean;
  frontRef: RefObject<SVGSVGElement | null>;
  defaultRole: string;
  fileBase: string;
}) {
  const [raw, setRaw] = useState("Ahmet Yılmaz\nAyşe Demir; Organizasyon\nMehmet Kaya\tKonuşmacı");
  const [layout, setLayout] = useState<Layout>("tekli");
  const [busy, setBusy] = useState<string | null>(null);
  const bgRef = useRef<SVGSVGElement>(null);
  const people = useMemo(() => parsePeople(raw, defaultRole), [raw, defaultRole]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setRaw(await f.text());
    e.target.value = "";
  };

  const generate = async () => {
    if (!fonts || !frontRef.current || !bgRef.current || !people.length) return;
    setBusy("Görseller hazırlanıyor…");
    try {
      const [{ jsPDF }, front, back] = await Promise.all([
        import("jspdf"),
        rasterize(frontRef.current, DPI),
        rasterize(bgRef.current, DPI),
      ]);
      setBusy("PDF oluşturuluyor…");
      const { w: CW, h: CH } = CARD_MM;
      const putBack = (doc: Doc, p: Person, x: number, y: number) => {
        doc.addImage(back, "PNG", x, y, CW, CH, "arka", "FAST");
        drawText(doc, fonts.extra, BACK_TEXT.name(p.name), BACK_TEXT.nameColor, x, y);
        drawText(doc, fonts.regular, BACK_TEXT.role(p.role), BACK_TEXT.roleColor, x, y);
      };

      let doc: Doc;
      if (layout === "tekli") {
        // Matbaa: her kart 60×90 mm sayfa, sırayla ön – arka
        doc = new jsPDF({ unit: "mm", format: [CW, CH], orientation: "portrait", compress: true });
        people.forEach((p, i) => {
          if (i > 0) doc.addPage([CW, CH], "portrait");
          doc.addImage(front, "PNG", 0, 0, CW, CH, "on", "FAST");
          doc.addPage([CW, CH], "portrait");
          putBack(doc, p, 0, 0);
        });
      } else {
        // A4: 3×3 kart, kesim işaretli. Çift taraflı (uzun kenardan çevirme) için arka sayfada sütunlar aynalanır.
        doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
        const gap = 5;
        const mx = (210 - (3 * CW + 2 * gap)) / 2;
        const my = (297 - (3 * CH + 2 * gap)) / 2;
        const slot = (c: number, r: number) => [mx + c * (CW + gap), my + r * (CH + gap)] as const;
        for (let s = 0; s < people.length; s += 9) {
          const chunk = people.slice(s, s + 9);
          if (s > 0) doc.addPage("a4", "portrait");
          chunk.forEach((_, i) => {
            const [x, y] = slot(i % 3, Math.floor(i / 3));
            doc.addImage(front, "PNG", x, y, CW, CH, "on", "FAST");
            cropMarks(doc, x, y, CW, CH);
          });
          doc.addPage("a4", "portrait");
          chunk.forEach((p, i) => {
            const [x, y] = slot(2 - (i % 3), Math.floor(i / 3));
            putBack(doc, p, x, y);
            cropMarks(doc, x, y, CW, CH);
          });
        }
      }
      doc.save(`${fileBase}-${layout === "tekli" ? "matbaa-60x90" : "a4-3x3"}-${people.length}kisi.pdf`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="mt-6 rounded-2xl bg-white border border-[#e2d7c2] p-5">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold text-lg">Toplu kart baskısı</h2>
          <p className="text-sm text-[#6b5d4c]">
            Her satıra bir kişi. Görev için isimden sonra <b>;</b> ya da <b>,</b> koyun; Excel&apos;den iki sütun yapıştırmak da olur.
            Görev yazılmazsa “{defaultRole}” kullanılır.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={!ready || !people.length || !!busy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2b2117] text-white text-sm disabled:opacity-50"
        >
          <Download size={16} /> {busy ?? `PDF indir (${people.length} kişi)`}
        </button>
      </div>

      <div className="grid md:grid-cols-[1fr_280px] gap-5">
        <div>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full border border-[#e2d7c2] rounded-lg p-3 text-sm font-mono"
            placeholder={"Ad Soyad\nAd Soyad; Görev"}
          />
          <div className="flex items-center justify-between text-xs text-[#8b7b66] mt-1">
            <label className="cursor-pointer underline">
              .txt / .csv dosyasından yükle
              <input type="file" accept=".txt,.csv,text/plain,text/csv" onChange={onFile} className="hidden" />
            </label>
            <span>{people.length} kişi</span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="text-xs font-bold tracking-widest text-[#8d6620]">PDF DÜZENİ</div>
          {(
            [
              ["tekli", "Matbaa – her kart ayrı sayfa", "60×90 mm sayfalar, sırayla ön ve arka yüz. Kartı basan matbaalar bunu ister."],
              ["a4", "A4 – sayfada 9 kart", "Kesim işaretli, çift taraflı. Ofis yazıcısında basıp kesmek için; arka sayfa uzun kenardan çevrilecek şekilde aynalanır."],
            ] as const
          ).map(([k, t, desc]) => (
            <label
              key={k}
              className={`block rounded-lg border p-3 cursor-pointer ${layout === k ? "border-[#8d6620] bg-[#f6ead0]" : "border-[#e2d7c2]"}`}
            >
              <input type="radio" name="layout" className="mr-2" checked={layout === k} onChange={() => setLayout(k)} />
              <b>{t}</b>
              <div className="text-xs opacity-70 mt-1">{desc}</div>
            </label>
          ))}
          {people.length > 0 && (
            <div className="text-xs text-[#8b7b66]">
              İlk kişi: <b>{people[0].name}</b> · {people[0].role}
            </div>
          )}
        </div>
      </div>

      {/* isimsiz arka yüz zemini – PDF'te tek sefer gömülür */}
      <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden>
        <div style={{ width: 230, height: 345 }}>
          <CardBackSvg ref={bgRef} d={d} fonts={fonts} logo={logo} name="" role="" />
        </div>
      </div>
    </section>
  );
}
