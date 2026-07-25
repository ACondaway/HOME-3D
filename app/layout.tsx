import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACondawayUNo · The Living Index",
  description:
    "一个可以自由探索的中英双语三维个人主页。A bilingual 3D personal homepage for music, fitness, reading, research, making, and everyday life.",
  applicationName: "The Living Index",
  keywords: [
    "个人主页",
    "Three.js",
    "3D Portfolio",
    "交互设计",
    "数字房间",
  ],
  openGraph: {
    title: "ACondawayUNo · The Living Index",
    description:
      "把生活、好奇与正在发生的作品放进一间可探索的双语三维房间。An explorable bilingual room for a life and its work.",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: "ACondawayUNo · The Living Index",
    description:
      "Explore music, fitness, reading, research, making, and everyday life through the objects in a bilingual 3D room.",
  },
  alternates: {
    languages: {
      "zh-CN": "/?lang=zh",
      en: "/?lang=en",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111c19",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
