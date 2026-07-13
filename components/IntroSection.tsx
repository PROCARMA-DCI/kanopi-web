import fs from 'fs';
import path from 'path';
import { IntroAnimations } from './IntroAnimations';

function readSvg(name: string) {
  const filePath = path.join(process.cwd(), 'public', 'images', name);
  return fs.readFileSync(filePath, 'utf8');
}

// Add more slides here as needed — GSAP will cycle through them right-to-left
const slides = [
  {
    h1: 'Auto coverage that safeguards both you and your finances!',
    p: 'A company committed to saving customers substantial amounts on their coverage while also championing environmental conservation!',
  },
  {
    h1: 'Save more on your vehicle protection than ever before.',
    p: 'Kanopi strips away dealer markups and hidden fees — putting real money back in your pocket.',
  },
  {
    h1: 'Coverage that cares about you and the planet.',
    p: 'Every plan contributes $5 to an environmental charity of your choice. Great coverage. Greater impact.',
  },
];

export function IntroSection() {
  const cloudSvg = readSvg('cloud-anim.svg');
  const leftSvg  = readSvg('scene-left.svg');
  const rightSvg = readSvg('scene-right.svg');

  return (
    <section className="intro">
      <div className="container_animation">

        {/* Cloud SVG — absolutely positioned at top */}
        <div className="box-clouds" dangerouslySetInnerHTML={{ __html: cloudSvg }} />

        {/* Center text content */}
        <div className="text">
          <a href="#" className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-3.svg" alt="Kanopi" width={227} height={71} />
          </a>

          {/* Slider — each .slide contains one h1 + p pair */}
          <div className="intro__slider">
            {slides.map((slide, i) => (
              <div key={i} className={`slide sl${i + 1}`}>
                <h1 className={`tittle sl${i + 1}`}>{slide.h1}</h1>
                <p className={`subtittle sl${i + 1}`}>{slide.p}</p>
              </div>
            ))}
          </div>

          <button className="intro__btn textBtn btn">CHECK YOUR DEAL</button>
        </div>

        {/* Left + Right illustrated scenes — absolute at bottom */}
        <div className="svgAll">
          <div className="left"  dangerouslySetInnerHTML={{ __html: leftSvg }} />
          <div className="right" dangerouslySetInnerHTML={{ __html: rightSvg }} />
        </div>

      </div>

      {/* Mounts GSAP animations client-side */}
      <IntroAnimations />
    </section>
  );
}
