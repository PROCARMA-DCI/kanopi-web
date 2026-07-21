import type { Metadata } from "next";
import { Caveat, Lato, Poppins, Geist } from "next/font/google";
import "./globals.css";
import LayoutProvider from "./providers/LayoutContext";
import LoaderProvider from "./providers/LoaderContext";
import ScrollProvider from "./ScrollProvider";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kanopi",
  description: "",
  icons: {
    icon: "/images/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "snap-y", "snap-proximity", lato.variable, caveat.variable, poppins.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Loader outermost so any provider/component can trigger the overlay;
            then app data + app-wide smooth scroll. */}
        <LoaderProvider>
          <LayoutProvider>
            <ScrollProvider>{children}</ScrollProvider>
          </LayoutProvider>
        </LoaderProvider>
      </body>
    </html>
  );
}
