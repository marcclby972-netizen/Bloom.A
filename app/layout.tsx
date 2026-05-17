import type { Metadata, Viewport } from "next";
import { Geist_Mono, Madimi_One, Montserrat } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

// Display font — usage parcimonieux (logo, hero headlines, prix)
const madimiOne = Madimi_One({
  variable: "--font-madimi",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// Body / UI font — Montserrat is the primary product font.
// CSS variable name kept as --font-menbere to honour the original guideline
// convention; the actual face is Montserrat under the hood.
const menbere = Montserrat({
  variable: "--font-menbere",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bloom — OS pour associés et cofondateurs",
  description:
    "Le temps, l'argent et les règles sur la même page. Pilote ta boîte sans devenir flou.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${madimiOne.variable} ${menbere.variable} ${geistMono.variable} h-full antialiased`}
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
