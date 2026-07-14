"use client";

import { useState } from "react";
import { Footer } from "./Footer";
import { Popup } from "./Popup";

export function PageClient() {
  const [popup, setPopup] = useState<"charity" | "thankyou" | null>(null);
  const [savedPrice, setSavedPrice] = useState("");
  const [savedOther, setSavedOther] = useState("");

  function handleUpload(other: string, price: string) {
    setSavedOther(other);
    setSavedPrice(price);
    setPopup("charity");
  }

  function handleCharitySubmit() {
    setPopup("thankyou");
  }

  return (
    <>
      {/* <CoverageSection onUpload={handleUpload} /> */}

      <Popup
        isOpen={popup === "charity"}
        variant="charity"
        price={savedPrice}
        other={savedOther}
        onClose={() => setPopup(null)}
        onSubmit={handleCharitySubmit}
      />
      <Popup
        isOpen={popup === "thankyou"}
        variant="thankyou"
        onClose={() => setPopup(null)}
      />

      <Footer />
    </>
  );
}
