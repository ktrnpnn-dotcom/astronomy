import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400"],
});

export const metadata: Metadata = {
  title: "Небо сейчас",
  description: "Что можно увидеть в небе прямо сейчас и куда смотреть.",
  applicationName: "Небо сейчас",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Небо сейчас",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`h-full ${plex.className}`}>
      <body className={`min-h-full ${plex.className}`}>{children}</body>
    </html>
  );
}
