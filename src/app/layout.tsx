import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const gilroy = localFont({
  src: [
    { path: "../../public/fonts/Gilroy-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Gilroy-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/Gilroy-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/Gilroy-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/Gilroy-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../../public/fonts/Gilroy-Black.ttf", weight: "900", style: "normal" },
  ]
});

export const metadata: Metadata = {
  title: "Osmanlı Gecesi · Boyunluk Tasarımı",
  description: "Ankara Tıbbiyeliler Osmanlı Gecesi boyunluk ve yaka kartı tasarım aracı",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${gilroy.className} antialiased`}>{children}</body>
    </html>
  );
}
