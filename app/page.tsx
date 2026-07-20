import { GetCoveredSection } from "@/components/GetCoveredSection";
import { IndustrySection } from "@/components/IndustrySection";
import { IntroSection } from "@/components/IntroSection";
import { PageClient } from "@/components/PageClient";

export default function Home() {
  return (
    <>
      <IntroSection />
      <IndustrySection />
      {/* <SaleSection /> */}
      {/* <CalculatorSection /> */}
      {/* GetCoveredSection gates the rates flow — the Yes/No entry screen only
          appears (and scrolls into view) after GET COVERED is clicked. */}
      <GetCoveredSection />
      <PageClient />
    </>
  );
}
