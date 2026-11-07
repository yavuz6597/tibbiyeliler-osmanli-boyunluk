# Osmanlı Gecesi · Boyunluk ve Yaka Kartı

Ankara Tıbbiyeliler Osmanlı Gecesi için boyunluk (lanyard) ve yaka kartı tasarım aracı. Next.js 16, Tailwind 4.

- `/boyunluk`: renk, zemin motifi ve boyun ortası sembolü seçimi; canlı ve askıda mockup
- Şerit baskı dosyası: 900 × 20 mm, SVG/PNG
- Kart: 60 × 90 mm, ön/arka SVG (yazılar eğriye çevrili) ve 300 dpi PNG
- Toplu kart baskısı: isim listesinden PDF (matbaa için her kart ayrı sayfa veya A4'te 3×3, kesim işaretli)

## Geliştirme

```bash
npm install
npm run dev
```

## Kaynaklar

- `public/motifler/`: tuğra ve zemin motifleri (müşteriden)
- `src/components/ui/lanyard-badge.tsx`: 21st.dev Lanyard Badge bileşeni (Osmanlı deseni için uyarlandı)
- `public/fonts/`: Gilroy
