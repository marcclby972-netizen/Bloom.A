import type { Metadata, Viewport } from "next";
import {
  Geist_Mono, Madimi_One, Montserrat, Bricolage_Grotesque,
} from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

// Display font — headlines, hero, section titles (per brandguidline.md §2.2)
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

// Body / UI font — primary product font
const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Brand mark — logo "Bloom" only (extremely parcimonious)
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

// Legacy aliases kept so existing `--font-madimi` / `--font-menbere`
// usages in components keep rendering. New code should use the canonical
// `--font-display`, `--font-body`, `--font-brand` instead.
const fontVars = [
  bricolage.variable,
  montserrat.variable,
  madimiOne.variable,
  geistMono.variable,
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
