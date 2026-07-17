"use client";
import { fetching } from "@/lib/api/client";
import React, { createContext, useContext, useEffect, useState } from "react";

// Shape of one row returned by /api/kanopiDealersAssignedToGroup.

export interface MakeType {
  id: string;
  name: string;
}
export interface ModelType {
  ModelID: string;
  ModelName: string;
}

interface initialValues {
  DealerID: number;
  DealerName: string;
}

// What the provider exposes to consumers via useLayout().
interface LayoutContextValue extends initialValues {
  makes: MakeType[];
  setMakes: React.Dispatch<React.SetStateAction<MakeType[]>>;
  fetchMakes: () => Promise<void>;
  fetchModelAgainstMake: (make_id: string) => Promise<void>;
  models: ModelType[];
}

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
  const [makes, setMakes] = useState<MakeType[]>([]);
  const [models, setModels] = useState<ModelType[]>([]);

  useEffect(() => {
    // `active` guards against setState after unmount and against React 18/19's
    // dev double-invoke. Defining the async fn INSIDE the effect is the modern
    // pattern — no missing-dependency warning, nothing captured stalely.
    let active = true;

    const loadDealer = async () => {
      // This endpoint is POST-only and expects `group_id` as form data —
      // a GET returns 404 "Unknown method" from the backend.
      const res = await fetching<initialValues[]>({
        url: "/api/kanopiDealersAssignedToGroup",
        method: "POST",
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
  const fetchMakes = async () => {
    // GET — params go in the query string (fetching handles that). This
    // endpoint returns the list under `data`.
    const res = await fetching<MakeType[]>({
      url: "/api/contracts/getMakes",
      method: "GET",
    });

    if (!res.ok || !res.data?.length) {
      console.error("Failed to load makes", res.status);
      return;
    }
    setMakes(res.data);
  };
  const fetchModelAgainstMake = async (make_id: string) => {
    // GET — params go in the query string (fetching handles that). This
    // endpoint returns the list under `data`.
    const res = await fetching<ModelType[]>({
      url: "/api/contracts/getModels/" + make_id,
      method: "GET",
    });

    if (!res.ok || !res.data?.length) {
      console.error("Failed to load makes", res.status);
      return;
    }
    setModels(res.data);
  };
  return (
    <LayoutContext.Provider
      value={{
        DealerID,
        DealerName,
        makes,
        setMakes,
        fetchMakes,
        fetchModelAgainstMake,
        models,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export { LayoutContext };
export default LayoutProvider;
