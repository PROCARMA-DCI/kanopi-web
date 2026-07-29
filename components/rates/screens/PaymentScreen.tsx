"use client";

import { fetching } from "@/lib/api/client";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { planType } from "../data/coverages";
import { RatesHeader } from "../RatesHeader";
import { useFlow } from "../wizard/FlowProvider";
import { useHeaderDominance } from "../wizard/useHeaderDominance";
import StripeCheckoutCard from "./StripeCheckoutCard";

// One Stripe.js instance per publishable key for the whole session — Stripe
// docs explicitly say not to call loadStripe() more than once per key.
let stripePromiseCache: Promise<Stripe | null> | null = null;

interface CreatePaymentIntentResult {
  clientSecret?: string;
  invoice_no?: string;
  TransactionID?: string;
}

/**
 * No-account · "Payment" (Figma 310:479) — the illustration + headline on
 * the left are static copy; the right column is Stripe's real card form.
 * Sets up the PaymentIntent + Stripe.js instance once on mount, then hands
 * both to <Elements> (StripeCheckoutCard needs that context for
 * useStripe()/useElements() and the Card*Element components to work at all).
 */
export function PaymentScreen({ index }: { index: number }) {
  const flow = useFlow();
  const rootRef = useRef<HTMLElement>(null);
  const selectedCoverage = flow.data.selectedCoverage as planType | null;

  useHeaderDominance(rootRef);

  const [clientSecret, setClientSecret] = useState("");
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">();

  useEffect(() => {
    // `active` (not a permanent ref-lock) guards React 18/19 dev-mode's
    // double effect invoke — a lock that never resets meant setup() could
    // only ever run once per PaymentScreen mount for the rest of the tab's
    // life (and PaymentScreen, once revealed, never unmounts — see
    // NoAccountFlow), so re-testing needed a hard page reload every time
    // instead of just navigating Back then Next again.
    let active = true;

    const setup = async () => {
      if (!selectedCoverage) {
        setStatus("error");
        return;
      }

      const configRes = await fetching<{ publishableKey?: string }>({
        url: "/api/stripe/config",
        method: "GET",
      });
      const publishableKey = configRes.data?.publishableKey;
      if (!active) return;
      if (!configRes.ok || !publishableKey) {
        toast.error("Stripe key not found");
        setStatus("error");
        return;
      }

      if (!stripePromiseCache) stripePromiseCache = loadStripe(publishableKey);

      const intentRes = await fetching<CreatePaymentIntentResult>({
        url: "/api/stripe/create-payment-intent",
        method: "POST",
        badgeLoading: "Loading",
        body: {
          items: [
            {
              title: selectedCoverage.title,
              amount: Math.round(Number(selectedCoverage.price) * 100),
              quantity: 1,
            },
          ],
          metadata: {
            product_id: selectedCoverage.product_id,
            plan_id: selectedCoverage.plan_id,
            price: Number(selectedCoverage.price),
            PaymentThrough: 1, // CARD
            title: selectedCoverage.title,
            invoice_date: new Date().toISOString(),
          },
        },
      });

      if (!active) return;
      const secret = intentRes.message?.clientSecret;
      if (!intentRes.ok || !secret) {
        toast.error("Couldn't start the payment — please try again.");
        setStatus("error");
        return;
      }

      setStripePromise(stripePromiseCache);
      setClientSecret(secret);
      setStatus("ready");
    };

    setup();
    return () => {
      active = false;
    };
  }, [selectedCoverage]);

  return (
    <section
      ref={rootRef}
      id={flow.stepId(index)}
      className="flex min-h-[100dvh] w-full snap-start snap-always flex-col bg-[#fff9f1]"
    >
      <RatesHeader
        title="Payment"
        progress={{ total: flow.total, current: index, completion: 1 }}
      />

      {status === "error" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pt-40.5 text-center">
          <p className="text-[20px] font-bold text-[#2d3d00]">
            We couldn&apos;t start your payment. Please go back and try again.
          </p>
          <button
            type="button"
            onClick={() => flow.back(index)}
            className="cursor-pointer text-[15px] font-semibold text-[#7d8760] underline"
          >
            Back
          </button>
        </div>
      )}

      {status === "ready" && stripePromise && (
        <div className="mx-auto grid w-full max-w-[1200px] flex-1 grid-cols-1 items-center gap-12 px-6 pb-16 pt-40.5 lg:grid-cols-2 lg:divide-x lg:divide-[rgba(125,135,96,0.3)]">
          {/* Left: illustration + headline */}
          <div className="flex flex-col items-start gap-6 lg:pr-12">
            <h1 className="max-w-[400px] text-[32px] font-bold leading-[1.3] text-[#2d3d00]">
              You are one step away from defeating the repair monster!{" "}
              <span className="text-[#a6e00c]">
                Stop overpaying for simple fixes.
              </span>
            </h1>
            <Image
              src="/images/repair-monster.png"
              alt="A pile-of-bills monster, defeated by Camo"
              width={643}
              height={515}
              className="mx-auto h-auto w-full max-w-[520px]"
            />
          </div>

          {/* Right: Stripe card form */}
          <div className="flex flex-col gap-6 lg:pl-12">
            <p className="text-[28px] text-[#7b8466]">Enter Card Information</p>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripeCheckoutCard clientSecret={clientSecret} index={index} />
            </Elements>
            <p className="text-center text-[14px] text-[#2d3d00]">
              By clicking Pay, you agree to the Link Terms and Privacy Policy.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
