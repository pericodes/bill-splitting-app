import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/landing/site";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "600", "700"],
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: "Gestión financiera simple, rápida y confiable. Divide gastos compartidos.",
  applicationName: SITE_NAME,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/bill-splitting-app-logo-no-border.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#026ffb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className={`${inter.className} bg-[#f8f9fa] text-[#191c1d] min-h-screen antialiased`} suppressHydrationWarning>
        <Script id="pwa-install-capture" strategy="beforeInteractive">
          {`(function(){window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__pwaDeferredPrompt=e;});window.addEventListener("appinstalled",function(){window.__pwaDeferredPrompt=null;});if("serviceWorker"in navigator){navigator.serviceWorker.register("/sw.js",{scope:"/"});}})();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
