"use client";
import { fetching } from "@/lib/api/client";
import React, { createContext, useContext, useEffect, useState } from "react";

// Shape of one row returned by /api/kanopiDealersAssignedToGroup.
interface initialValues {
  DealerID: number;
  DealerName: string;
}

// What the provider exposes to consumers via useLayout().
type LayoutContextValue = initialValues;

const LayoutContext = createContext<LayoutContextValue | null>(null);

export const useLayout = (): LayoutContextValue => {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used inside a <LayoutProvider>");
  return ctx;
};

const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [DealerID, setDealerID] = useState(0);
  const [DealerName, setDealerName] = useState("");

  useEffect(() => {
    // `active` guards against setState after unmount and against React 18/19's
    // dev double-invoke. Defining the async fn INSIDE the effect is the modern
    // pattern — no missing-dependency warning, nothing captured stalely.
    let active = true;

    const loadDealer = async () => {
      const res = await fetching<initialValues[]>({
        url: "/api/kanopiDealersAssignedToGroup",
        isFormdata: true,
        body: { group_id: 256 },
      });

      if (!active) return;
      if (!res.ok || !res.message?.length) {
        console.error("Failed to load dealer", res.status);
        return;
      }

      setDealerID(res.message[0].DealerID);
      setDealerName(res.message[0].DealerName);
    };

    loadDealer();
    return () => {
      active = false;
    };
  }, []);
  console.log(DealerID, DealerName);
  return (
    <LayoutContext.Provider value={{ DealerID, DealerName }}>
      {children}
    </LayoutContext.Provider>
  );
};

export { LayoutContext };
export default LayoutProvider;
