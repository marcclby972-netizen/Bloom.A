import type { Metadata, Viewport } from "next";
import { Geist_Mono, Madimi_One, Montserrat } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

// Montserrat — police unique du produit. Sert pour body ET display
// (les "headlines" héritent simplement d'un weight 700/800 + spacing
// négatif, on garde une seule famille pour la cohérence).
const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Brand mark — réservé STRICTEMENT au mot "Bloom" dans le logo / header.
// N'importez nulle part ailleurs.
const madimiOne = Madimi_One({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

// `--font-display` est aliasé sur Montserrat pour la rétro-compat — toutes
// les références existantes (h1/h2/h3 dans dashboard/settings/calendrier
// etc.) restent valides et basculent automatiquement vers Montserrat.
// Idem pour les vieux noms `--font-madimi` / `--font-menbere`.
const fontVars = [
  montserrat.variable,
  madimiOne.variable,
  geistMono.variable,
  `[--font-display:var(--font-body)]`,
  `[--font-madimi:var(--font-brand)]`,
  `[--font-menbere:var(--font-body)]`,
].join(" ")

export const metadata: Metadata = {
  title: "Bloom — OS pour associés et cofondateurs",
  description:
    "Le temps, l'argent et les règles sur la même page. Pilote ta boîte sans devenir flou.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0E0E10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${fontVars} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
