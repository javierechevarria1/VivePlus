import type { Metadata } from "next";
import Script from "next/script";
import AnaliticaConsentida from "@/frontend/src/components/AnaliticaConsentida";
import AuthGate from "@/frontend/src/components/auth-gate";
import AuthSessionProvider from "@/frontend/src/components/AuthSessionProvider";
import CookieBanner from "@/frontend/src/components/CookieBanner";
import ChatNotifier from "@/frontend/src/components/ChatNotifier";
import "./globals.css";
import { CartProvider } from "@/frontend/src/components/CartContext";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vivemas.es';
const metadataBaseUrl = URL.canParse(siteUrl) ? new URL(siteUrl) : new URL('https://vivemas.es');

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl,
  title: {
    default: "VIVE+ - Cuidado de personas mayores en Santander",
    template: "%s | VIVE+",
  },
  description: "Conectamos a personas mayores con organizaciones que combaten la soledad no deseada. Cuidadores profesionales, actividades sociales y recursos en Santander.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "VIVE+",
    title: "VIVE+ - Cuidado de personas mayores en Santander",
    description: "Conectamos a personas mayores con organizaciones que combaten la soledad no deseada. Cuidadores profesionales, actividades sociales y recursos en Santander.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "VIVE+ logo" }],
  },
  twitter: {
    card: "summary",
    title: "VIVE+ - Cuidado de personas mayores en Santander",
    description: "Conectamos a personas mayores con organizaciones que combaten la soledad no deseada. Cuidadores profesionales, actividades sociales y recursos en Santander.",
    images: ["/logo.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#EC4899",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VIVE+",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description: "Plataforma de cuidado y acompañamiento para personas mayores de 55 años en Santander.",
  areaServed: {
    "@type": "City",
    name: "Santander",
    "@id": "https://www.wikidata.org/wiki/Q12225",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    availableLanguage: "Spanish",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <AuthSessionProvider>
          <CartProvider>
            <AuthGate>
              {children}
            </AuthGate>
            <ChatNotifier />
            <AnaliticaConsentida />
            <CookieBanner />
          </CartProvider>
        </AuthSessionProvider>
        <Script id="sw-register">{`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function(err) {
                console.log('SW error:', err);
              });
            });
          }
        `}</Script>
      </body>
    </html>
  );
}
