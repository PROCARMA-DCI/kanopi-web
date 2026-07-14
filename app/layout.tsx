import type { Metadata } from "next";
import { Lato, Caveat, Poppins } from "next/font/google";
import "./globals.css";
import ScrollProvider from "./ScrollProvider";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lato.variable} ${caveat.variable} ${poppins.variable} h-full antialiased snap-y snap-proximity`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* App-wide smooth scroll — any client component can call useScroll(). */}
        <ScrollProvider>{children}</ScrollProvider>
      </body>
    </html>
  );
}
