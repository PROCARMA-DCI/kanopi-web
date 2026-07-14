import { IndustrySection } from "@/components/IndustrySection";
import { IntroSection } from "@/components/IntroSection";
import { PageClient } from "@/components/PageClient";
import { RatesFlow } from "@/components/rates/RatesFlow";

export default function Home() {
  return (
    <>
      <IntroSection />
      <IndustrySection />
      <RatesFlow />
      {/* <SaleSection /> */}
      {/* <CalculatorSection /> */}
      <PageClient />
    </>
  );
}
