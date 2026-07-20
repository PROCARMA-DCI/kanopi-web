import fs from "fs";
import path from "path";

function readSvg(filename: string): string {
  return fs.readFileSync(
    path.join(process.cwd(), "public", "images", filename),
    "utf8",
  );
}

export function CalculatorSection() {
  const carSvg = readSvg("calculator-car.svg");

  return (
    <section className="calculator" id="calculator">
      {/* <div className="calculator__fake calculator__fake-1" id="fake-1" />
      <div className="calculator__fake calculator__fake-2" id="fake-2" />
      <div className="calculator__fake calculator__fake-3" id="fake-3" />
      <div className="calculator__fake calculator__fake-4" id="fake-4" /> */}

      <div className="calculator__inner">
        {/* <div className="calculator__box">
          <h2 className="calculator__title anim-left">
            How much did you pay for...
          </h2>

          <div className="calculator__fields">
            <div className="calculator__box-input calculator__box-input-1">
              <p className="calculator__input-text anim-left">
                Vehicle Service Contract (Mechanical Coverage)
              </p>
              <div className="calculator__wrapper-input">
                <input className="calculator__input" type="text" data-input />
                <div className="calculator__wrapper-hint">
                  <Image
                    className="calculator__hint"
                    src="/icons/hint.svg"
                    width={24}
                    height={24}
                    alt="hint"
                  />
                  <p className="calculator__hint-text">
                    This is the cost of your mechanical breakdown protection
                    plan.
                  </p>
                </div>
              </div>
            </div>

            <div className="calculator__box-input calculator__box-input-2">
              <p className="calculator__input-text">
                Tire &amp; Wheel Protection
              </p>
              <div className="calculator__wrapper-input">
                <input className="calculator__input" type="text" data-input />
              </div>
            </div>

            <div className="calculator__box-input calculator__box-input-3">
              <p className="calculator__input-text">Windshield Protection</p>
              <div className="calculator__wrapper-input">
                <input className="calculator__input" type="text" data-input />
              </div>
            </div>

            <div className="calculator__box-input calculator__box-input-4">
              <p className="calculator__input-text">Paint Protection</p>
              <div className="calculator__wrapper-input">
                <input className="calculator__input" type="text" data-input />
              </div>
            </div>
          </div>

          <div className="calculator__box-price">
            <p className="calculator__text-price">Total</p>
            <p className="calculator__price h2-style">
              $<span className="calculator__price-text">0</span>
            </p>
          </div>
        </div> */}

        <div className="calculator__img">
          <div
            className="calculator__img-inner"
            dangerouslySetInnerHTML={{ __html: carSvg }}
          />
        </div>
      </div>
    </section>
  );
}
