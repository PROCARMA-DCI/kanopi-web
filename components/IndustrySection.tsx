import fs from 'fs';
import path from 'path';
import Image from 'next/image';

function readSvg(name: string) {
  return fs.readFileSync(path.join(process.cwd(), 'public', 'images', name), 'utf8');
}

const items = [
  {
    img: '/icons/industry-1.svg',
    title: 'Commissions + Dealer Markups',
    text: 'Chances are you are paying double what your coverage is worth just to line the pockets of "your local dealer."',
  },
  {
    img: '/icons/industry-2.svg',
    title: 'Clunky Claims Process',
    text: "Filing a claim shouldn't be harder than buying one. Kanopi simplifies the process to get you back on the road.",
  },
  {
    img: '/icons/industry-3.svg',
    title: 'Lack of Transparency',
    text: 'Stop being taken advantage of and know what your contract actually covers in an emergency.',
  },
];

export function IndustrySection() {
  const animSvg = readSvg('industry-anim.svg');
  const animSvgM = readSvg('industry-anim-mobile.svg');

  return (
    <section className="industry">
      <h2 className="industry__title">A $42 Billion industry</h2>
      <p className="industry__subtitle">because you&apos;re paying more than you should.</p>

      <div className="industry__text">
        <p>
          Most vehicle service contracts are sold at the time of sale of a car to you. There are lots
          of commissions and fees added to the final product that have no benefit to you as the
          consumer. <strong>Kanopi removes all of these.</strong>
        </p>
      </div>

      <div className="industry__list">
        <p className="industry__list-text">60% OF YOUR TOTAL COST</p>

        {items.map((item, i) => (
          <div key={item.title} style={{ display: 'contents' }}>
            <div className="item-industry">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="item-industry__img" src={item.img} width={160} height={160} alt={item.title} />
              <h4 className="item-industry__title">{item.title}</h4>
              <p className="item-industry__text">{item.text}</p>
            </div>
            {i < items.length - 1 && (
              <div className="industry__list-arrow">
                <Image src="/icons/arrow.svg" width={35} height={13} alt="" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop animated SVG — bear travels across cable on scroll */}
      <div className="industry__wrapper-img" dangerouslySetInnerHTML={{ __html: animSvg }} />

      {/* Mobile animated SVG */}
      <div className="industry__wrapper-imgM" dangerouslySetInnerHTML={{ __html: animSvgM }} />

      <p className="industry__tagline">
        Kanopi cuts out the middle man,{' '}
        <strong>saving you $$$</strong>, and reinvesting in our planet.
      </p>
    </section>
  );
}
