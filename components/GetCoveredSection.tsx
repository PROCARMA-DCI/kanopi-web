import fs from "fs";
import path from "path";
import { GetCoveredClient } from "./GetCoveredClient";

/**
 * "Coverage where you need it." (Figma KANOPI-POWERTRAIN-SCHEM-01).
 *
 * Server half: reads the real car_animation.json Lottie (part highlights +
 * their repair-cost labels are already baked into the animation itself) and
 * hands the parsed JSON to the client half, which plays it, runs the
 * entrance animation, and gates the rates flow behind the GET COVERED
 * button.
 */
export function GetCoveredSection() {
  const carAnimation = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public", "lottie", "car_animation.json"),
      "utf8",
    ),
  );

  return <GetCoveredClient carAnimation={carAnimation} />;
}
