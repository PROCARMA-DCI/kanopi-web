"use client";

import { useLayout } from "@/app/providers/LayoutContext";
import { useLoader } from "@/app/providers/LoaderContext";
import { fetching } from "@/lib/api/client";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { buildContractPayload } from "../buildContractPayload";
import { planType } from "../data/coverages";
import { RatesHeader } from "../RatesHeader";
import { useFlow } from "../wizard/FlowProvider";
import { useHeaderDominance } from "../wizard/useHeaderDominance";
import StripeCheckoutCard from "./StripeCheckoutCard";

const paymentTestMode = true;

// One Stripe.js instance per publishable key for the whole session — Stripe
// docs explicitly say not to call loadStripe() more than once per key.
let stripePromiseCache: Promise<Stripe | null> | null = null;

interface CreatePaymentIntentResult {
  clientSecret?: string;
  paymentIntentId?: string;
}

/**
 * No-account · "Payment" (Figma 310:479) — the illustration + headline on
 * the left are static copy; the right column is Stripe's real card form.
 *
 * Setup, in order:
 *  1. POST /kanopi/stage with the full contract payload — none of that
 *     data (name, address, password, etc.) needs to touch Stripe. Gets
 *     back a temp_id.
 *  2. Create the PaymentIntent with that temp_id in its metadata.
 *  3. Hand clientSecret + the Stripe.js instance to <Elements>
 *     (StripeCheckoutCard needs that context for useStripe()/useElements()
 *     and the Card*Element components to work at all) — plus tempId, so
 *     it can poll for the webhook's result after Stripe confirms payment.
 */
export function PaymentScreen({ index }: { index: number }) {
  const flow = useFlow();
  const rootRef = useRef<HTMLElement>(null);
  const { DealerID } = useLayout();
  const { badgeLoading: setBadgeLoading } = useLoader();
  const selectedCoverage = flow.data.selectedCoverage as planType | null;

  useHeaderDominance(rootRef);

  const [clientSecret, setClientSecret] = useState("");
  const [tempId, setTempId] = useState<string>("");
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">();
  // Bumped every time a NEW PaymentIntent is actually created — used as
  // <Elements key>, since Elements does not react to a changed
  // clientSecret prop on its own; it only picks up a new one on remount.
  const [piVersion, setPiVersion] = useState(0);

  // PaymentScreen, once revealed, never unmounts (see NoAccountFlow) — so a
  // plain mount-only effect can only ever stage/create the PaymentIntent
  // once. Read the LATEST flow.data through a ref (not the effect's own
  // closure) so re-runs triggered below always see the current data, not
  // whatever it was the first time this screen appeared.
  const flowDataRef = useRef(flow.data);
  useEffect(() => {
    flowDataRef.current = flow.data;
  }, [flow.data]);
  // Key of the payload actually staged last time — lets a re-run skip
  // re-staging/re-creating the PaymentIntent when nothing changed, and
  // re-do both when it did (e.g. Back → fix zip → forward again).
  const stagedPayloadKeyRef = useRef("");
  const runningRef = useRef(false);
  // Lets handleRetryPayment (a JSX event handler, outside the effect) call
  // the same setup() the effect uses, instead of duplicating it.
  const setupRef = useRef<() => void>(() => {});

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let active = true;

    const setup = async () => {
      if (!selectedCoverage) {
        setStatus("error");
        return;
      }
      if (runningRef.current) return;

      const payload = buildContractPayload(
        flowDataRef.current,
        DealerID,
        selectedCoverage,
      );
      const payloadKey = JSON.stringify(payload);
      if (payloadKey === stagedPayloadKeyRef.current) return;

      runningRef.current = true;
      // On so there's IMMEDIATE feedback the retry click registered, not
      // just once create-payment-intent starts — staging + fetching the
      // Stripe config happen first and were previously silent.
      setBadgeLoading("Loading", true);

      // try/catch: any thrown error here (a rejected fetch from a
      // dropped/restarted backend, for instance) used to die as a silent
      // unhandled rejection — no toast, no state change, indistinguishable
      // from the click doing nothing at all.
      try {
        // Stage the contract data first — the PaymentIntent only ever
        // carries a reference (temp_id) to it, never the data itself.
        const stageRes = await fetching<{ temp_id?: string }>({
          url: `/api/kanopi/stage${paymentTestMode ? "?test=true" : ""}`,
          method: "POST",
          body: payload,
        });
        if (!active) return;
        // The endpoint's JSON is flat ({ success, temp_id }), not nested
        // under "data"/"message" — read it straight off the result. Cast
        // because ApiResult's index signature types unlisted fields as
        // `unknown`, not the shape passed to fetching<T>().
        const stagedTempId = stageRes?.temp_id as string | undefined;
        if (!stageRes.ok || !stagedTempId) {
          toast.error("Couldn't prepare your contract — please try again.");
          setStatus("error");
          return;
        }

        const configRes = await fetching<{ publishableKey?: string }>({
          url: `/api/stripe/config${paymentTestMode ? "?test=true" : ""}`,
          method: "GET",
        });
        const publishableKey = configRes.data?.publishableKey;
        if (!active) return;
        if (!configRes.ok || !publishableKey) {
          toast.error("Stripe key not found");
          setStatus("error");
          return;
        }

        if (!stripePromiseCache)
          stripePromiseCache = loadStripe(publishableKey);

        const intentRes = await fetching<CreatePaymentIntentResult>({
          url: `/api/stripe/create-payment-intent${paymentTestMode ? "?test=true" : ""}`,
          method: "POST",
          body: {
            items: [
              {
                title: selectedCoverage.title,
                amount: Math.round(Number(selectedCoverage.price) * 100),
                quantity: 1,
              },
            ],
            metadata: {
              temp_id: stagedTempId,
              product_id: selectedCoverage.product_id,
              plan_id: selectedCoverage.plan_id,
              rate_id: selectedCoverage.reserve_rate_id,
              coverage_price: Number(selectedCoverage.price),
              PaymentThrough: 1, // CARD
              title: selectedCoverage.title,
              invoice_date: new Date().toISOString(),
            },
          },
        });

        if (!active) return;

        const secret = intentRes.data?.clientSecret;

        if (!intentRes.ok || !secret) {
          toast.error("Couldn't start the payment — please try again.");
          setStatus("error");
          return;
        }

        stagedPayloadKeyRef.current = payloadKey;
        setStripePromise(stripePromiseCache);
        setClientSecret(secret);
        setTempId(stagedTempId);
        setStatus("ready");
        // A genuinely new PaymentIntent — bump so <Elements key> remounts
        // and actually picks it up (see the piVersion comment above).
        setPiVersion((v) => v + 1);
      } catch {
        if (active) {
          toast.error("Couldn't start the payment — please try again.");
          setStatus("error");
        }
      } finally {
        setBadgeLoading("Loading", false);
        runningRef.current = false;
      }
    };

    setupRef.current = setup;
    setup();

    // Re-check every time this screen becomes the active view again —
    // covers Back → edit an earlier screen → scroll forward again,
    // which doesn't remount PaymentScreen and wouldn't otherwise call
    // /api/kanopi/stage a second time.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setup();
      },
      { threshold: 0.5 },
    );
    io.observe(el);

    return () => {
      active = false;
      io.disconnect();
    };
  }, [selectedCoverage, DealerID, setBadgeLoading]);

  // The old PaymentIntent is dead once the backend has voided it (contract
  // save failed under manual capture — see StripeCheckoutCard), so "try
  // again" here means a brand new PaymentIntent, not resubmitting the same
  // one. stagedPayloadKeyRef is cleared first so setup() doesn't just skip
  // the re-run for having "already staged this exact data".
  const handleRetryPayment = () => {
    stagedPayloadKeyRef.current = "";
    setupRef.current();
  };

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
            <Elements
              key={piVersion}
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <StripeCheckoutCard
                clientSecret={clientSecret}
                tempId={tempId}
                index={index}
                onRetryPayment={handleRetryPayment}
              />
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
