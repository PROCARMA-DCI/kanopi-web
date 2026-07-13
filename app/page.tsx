import { IntroSection } from '@/components/IntroSection';
import { IndustrySection } from '@/components/IndustrySection';
import { SaleSection } from '@/components/SaleSection';
import { CalculatorSection } from '@/components/CalculatorSection';
import { PageClient } from '@/components/PageClient';

export default function Home() {
  return (
    <>
      <IntroSection />
      <IndustrySection />
      <SaleSection />
      <CalculatorSection />
      <PageClient />
    </>
  );
}
