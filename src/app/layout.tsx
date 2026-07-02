import type { Metadata, Viewport } from "next"
import { Toaster } from "@/components/ui/sonner"
import { SessionProvider } from "@/components/session-provider"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "R&amp;L Fashion",
  description: "Sistem Manajemen Produksi & Penjualan Fashion",
  manifest: "/manifest.json",
  icons: { icon: "/icon-app.png", apple: "/icon-app.png" },
  appleWebApp: { capable: true, title: "R&L Fashion", statusBarStyle: "black-translucent" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f59e0b",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full antialiased">
      <head>
        <link rel="apple-touch-icon" href="/icon-app.png" />
        {/* iPhone X / XS / 11 Pro / 12 Pro / 13 Pro / 14 Pro */}
        <link rel="apple-touch-startup-image" href="/icon-512.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/icon-512.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        {/* iPhone 11 / XR */}
        <link rel="apple-touch-startup-image" href="/icon-512.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        {/* iPhone 12 / 13 / 14 */}
        <link rel="apple-touch-startup-image" href="/icon-512.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 2)" />
        {/* iPhone SE */}
        <link rel="apple-touch-startup-image" href="/icon-512.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        {/* iPad */}
        <link rel="apple-touch-startup-image" href="/icon-512.png" media="(device-width: 768px) and (device-height: 1024px)" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="h-full">
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
        <SpeedInsights />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(reg => console.log('SW registered:', reg.scope))
                  .catch(err => console.log('SW registration failed:', err));
              });
            }
          `
        }} />
      </body>
    </html>
  )
}
