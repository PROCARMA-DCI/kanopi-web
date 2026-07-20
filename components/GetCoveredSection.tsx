import fs from "fs";
import path from "path";
import { GetCoveredClient } from "./GetCoveredClient";

/**
 * "Coverage where you need it." (Figma KANOPI-POWERTRAIN-SCHEM-01).
 *
 * Server half: reads the jeep schematic SVG (the same calculator-car.svg —
 * its #car_powertrain / #car_tires / … overlays are what we animate instead
 * of the original Lottie) and hands it to the client half, which renders the
 * layout, runs the GSAP part-callout loop, and gates the rates flow behind
 * the GET COVERED button.
 */
export function GetCoveredSection() {
  const carSvg = fs.readFileSync(
    path.join(process.cwd(), "public", "images", "calculator-car.svg"),
    "utf8",
  );

  return <GetCoveredClient carSvg={carSvg} />;
}
