import fs from 'fs';
import path from 'path';
import { SaleSectionClient } from './SaleSectionClient';

function readSvg(filename: string): string {
  return fs.readFileSync(path.join(process.cwd(), 'public', 'images', filename), 'utf8');
}

export function SaleSection() {
  const leftSvg = readSvg('sale-left.svg');
  const rightSvg = readSvg('sale-right.svg');

  return (
    <section className="sale" id="sale">
      <div className="sale__inner">
        <div className="sale__box">
          <h2 className="sale__title anim-center">
            Check your deal &amp; see what you can save.
          </h2>
          <p className="sale__text anim-center">
            To express our gratitude for your assistance in furthering our mission, we will
            contribute $5 to the funds and causes listed below. We wholeheartedly support these
            initiatives and aspire to collectively make a positive impact.
          </p>

          <SaleSectionClient />

          {/* Sales slip icon */}
          <svg
            className="sale__img anim-center"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 185.85 122.54"
          >
            <g id="sale_img">
              <g id="SALES_SLIP_ICON">
                <rect x="82.69" y="20.95" width="79.83" height="100.09" rx="13.65" ry="13.65" fill="#e3e0d1" strokeWidth="0"/>
                <path d="m82.69,40.73v-6.29c0-7.45,6.04-13.49,13.49-13.49h52.85c7.45,0,13.49,6.04,13.49,13.49v36.93" fill="#e8e5d6" stroke="#93866c" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="3"/>
                <line x1="82.69" y1="57.66" x2="82.69" y2="61.45" fill="#f0ede0" stroke="#93866c" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="3"/>
                <path d="m162.51,107.19v.36c0,7.45-6.04,13.49-13.49,13.49h-52.85c-7.45,0-13.49-6.04-13.49-13.49v-53.69" fill="none" stroke="#93866c" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="3"/>
                <line x1="99.19" y1="35.06" x2="146" y2="35.06" fill="none" stroke="#93866c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/>
                <line x1="132.24" y1="46.69" x2="146" y2="46.69" fill="none" stroke="#93866c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/>
                <line x1="99.19" y1="46.69" x2="122.6" y2="46.69" fill="none" stroke="#93866c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/>
                <line x1="117.78" y1="58.32" x2="146" y2="58.32" fill="none" stroke="#93866c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/>
                <line x1="99.19" y1="58.32" x2="109.43" y2="58.32" fill="none" stroke="#93866c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/>
                <line x1="99.19" y1="69.95" x2="129.56" y2="69.95" fill="none" stroke="#93866c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/>
                <line x1="99.19" y1="81.57" x2="133.58" y2="81.57" fill="none" stroke="#93866c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/>
                <circle cx="152.88" cy="88.68" r="20.34" fill="#fff9f1" strokeWidth="0"/>
                <line x1="167.26" y1="103.66" x2="182.85" y2="119.25" fill="none" stroke="#93866c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/>
                <line x1="173.21" y1="109.62" x2="182.85" y2="119.25" fill="none" stroke="#93866c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6"/>
                <path d="m95.49,105.7l2.52-2.52c1.08-1.08,2.89-.91,3.74.36l1.58,2.35c.95,1.41,3.02,1.44,4,.05,0,0,1.17-2.6,3.67-2.6l18.55.14" fill="none" stroke="#93866c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/>
                <path d="m173.21,88.68c0,11.23-9.1,20.34-20.34,20.34s-20.34-9.1-20.34-20.34,9.1-20.34,20.34-20.34c6.73,0,12.69,3.27,16.39,8.3" fill="none" stroke="#93866c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/>
                <g id="sale_arrow">
                  <path d="m59.82,49.09C2.48,49.09,1.5,1.5,1.5,1.5" fill="none" stroke="#93866c" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="3"/>
                  <polyline points="54.7 43.25 60.3 49.04 54.42 54.93" fill="none" stroke="#93866c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"/>
                </g>
              </g>
            </g>
          </svg>

          <p className="sale__word h2-style anim-center">or</p>

          <div className="sale__bottom-text anim-center">
            <p>Complete the <a href="#calculator"><strong>swift savings</strong></a> calculator.</p>
          </div>
        </div>

        {/* Animated characters */}
        <div className="sale__box-anim">
          <div
            className="sale__left-anim anim-left"
            dangerouslySetInnerHTML={{ __html: leftSvg }}
          />
          <div
            className="sale__right-anim anim-right"
            dangerouslySetInnerHTML={{ __html: rightSvg }}
          />
        </div>
      </div>
    </section>
  );
}
