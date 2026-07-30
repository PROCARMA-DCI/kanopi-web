import { useLoader } from "@/app/providers/LoaderContext";
import { useScroll } from "@/app/ScrollProvider";
import { Button } from "@/components/ui/button";
import { fetching } from "@/lib/api/client";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type {
  StripeCardCvcElementChangeEvent,
  StripeCardExpiryElementChangeEvent,
  StripeCardNumberElementChangeEvent,
  StripeExpressCheckoutElementConfirmEvent,
} from "@stripe/stripe-js";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { planType } from "../data/coverages";
import { useFlow } from "../wizard/FlowProvider";

interface StripeCheckoutCardProps {
  clientSecret: string;
  /** From PaymentScreen's POST /kanopi/stage — the webhook uses this same
   * id to find the staged contract data once Stripe confirms payment. */
  tempId: string;
  /** This screen's step index — advances the flow once the contract is saved. */
  index: number;
}

// How long to poll /kanopi/payment-status before giving up and telling the
// customer to check back — the webhook is usually near-instant, but Stripe
// can take a few seconds, and the contract server itself could be slow.
const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 12; // ~18s

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const StripeCheckoutCard = ({
  clientSecret,
  tempId,
  index,
}: StripeCheckoutCardProps) => {
  const flow = useFlow();
  const { scrollTo } = useScroll();
  const { badgeLoading, loading } = useLoader();
  const [expressCheckoutStatus, setExpressCheckoutStatus] = useState<
    "loading" | "ready" | "unavailable"
  >("loading");
  const selectedCoverage = flow.data.selectedCoverage as planType;
  const coverage_price = selectedCoverage?.price;

  // Set once Stripe actually confirms the charge. From that point on the
  // card is charged — no matter what the webhook/contract-save does, we
  // must never run confirmCardPayment/confirmPayment again, or the
  // customer gets double-charged. A save failure (e.g. bad zip) only ever
  // retries the SAVE, never Stripe.
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [saveError, setSaveError] = useState("");
  const pollActive = useRef(false);

  const [cardState, setCardState] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });

  const isFormComplete = Object.values(cardState).every(Boolean);

  const handleElementChange =
    (field: keyof typeof cardState) =>
    (
      event:
        | StripeCardNumberElementChangeEvent
        | StripeCardExpiryElementChangeEvent
        | StripeCardCvcElementChangeEvent,
    ) => {
      setCardState((prev) => ({ ...prev, [field]: event.complete }));
    };
  const stripe = useStripe();
  const elements = useElements();

  // The real answer to "did this succeed" is the webhook's result (it's
  // the one that actually calls saveContract), not Stripe's client-side
  // confirmation — so after Stripe confirms, we poll for THAT result
  // instead of trying to save from the browser ourselves.
  const pollForResult = async () => {
    pollActive.current = true;
    badgeLoading("Saving", true);

    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
      if (!pollActive.current) return;

      // The endpoint's JSON is flat — { success, contract_status, message }
      // — not nested under "data", so it comes back through fetching()'s
      // spread as a top-level (untyped) field, not the .data/.message
      // alias. It's "contract_status", not "status" — fetching()'s own
      // ApiResult already reserves "status" for the HTTP status code and
      // would silently overwrite a same-named field from the backend.
      const res = await fetching({
        url: `/api/kanopi/payment-status/${tempId}`,
        method: "GET",
      });
      const status = res.contract_status as
        | "pending"
        | "succeeded"
        | "failed"
        | undefined;

      if (status === "succeeded") {
        badgeLoading("Saving", false);
        flow.next(index, { paymentSuccess: true });
        return;
      }

      if (status === "failed") {
        badgeLoading("Saving", false);
        setSaveError(
          (res.message as string) ||
            "We couldn't save your contract — please check your info and try again.",
        );
        return;
      }

      // Still "pending" (webhook hasn't landed yet) — wait and check again.
      await sleep(POLL_INTERVAL_MS);
    }

    badgeLoading("Saving", false);
    setSaveError(
      "This is taking longer than expected. Your payment went through — tap below to check again.",
    );
  };

  const handleExpressCheckoutConfirm = async (
    event: StripeExpressCheckoutElementConfirmEvent,
  ) => {
    if (!stripe || !elements) return;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (error) {
      event.paymentFailed({ reason: "fail" });
      toast.error(error.message);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      setPaymentConfirmed(true);
      await pollForResult();
    }
  };

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) return;

    badgeLoading("Saving", true);
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardNumberElement,
        },
      },
    );

    if (error) {
      toast.error("Error: " + error.message);
      badgeLoading("Saving", false);
      return;
    }

    if (paymentIntent.status === "succeeded") {
      setPaymentConfirmed(true);
      await pollForResult();
    } else {
      badgeLoading("Saving", false);
    }
  };

  // The card is already charged at this point — this only ever retries
  // the SAVE (immediately, instead of waiting on Stripe's own slow
  // webhook-retry schedule), never Stripe again.
  const handleRetrySave = async () => {
    setSaveError("");
    badgeLoading("Saving", true);
    const res = await fetching({
      url: `/api/kanopi/retry-save/${tempId}`,
      method: "POST",
    });
    badgeLoading("Saving", false);

    if (res.ok && res.success === 1) {
      flow.next(index, { paymentSuccess: true });
      return;
    }

    setSaveError(
      (res.message as string) ||
        "Still couldn't save your contract — please check your info and try again.",
    );
  };

  // Once Stripe has actually charged the card, never show the card form
  // again (resubmitting it would try to charge a second time) — only
  // ever a retry of saving the contract, with whatever's currently staged.
  if (paymentConfirmed) {
    return (
      <div className="space-y-4 rounded-lg border border-[#a6e00c] bg-[#fffaf3] p-4">
        <p className="font-bold text-[#2d3d00]">
          {saveError
            ? "Payment received — we just need to finish setting up your contract."
            : "Payment received — setting up your contract..."}
        </p>
        {saveError && <p className="text-red-600">{saveError}</p>}
        {saveError && (
          <>
            <p className="text-[13px] text-[#7d8760]">
              If that&apos;s a field you need to fix (like your zip code),
              edit it below, then try saving again — you won&apos;t be
              charged twice.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="muted"
                // Index 4 = SignupScreen ("Your Info") in NoAccountFlow,
                // where zip/address/etc. are collected — this component
                // already only makes sense inside that flow.
                onClick={() => scrollTo(flow.stepId(4))}
                className="flex-1 cursor-pointer"
              >
                Edit my info
              </Button>
              <Button
                type="button"
                onClick={handleRetrySave}
                disabled={loading}
                className="flex-1 bg-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Saving..." : "Try saving again"}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <form className="space-y-4">
      {/* ============================================================
            >>> APPLE PAY / GOOGLE PAY INTEGRATION — START <<<
            Uses Stripe's ExpressCheckoutElement, which renders Apple Pay
            and Google Pay as separate native buttons - each one only
            when the current browser/device actually supports that
            specific wallet (Apple Pay: Safari + Wallet card, Google Pay:
            Chrome signed into a Google account with a saved card). This
            is NOT a bug - it mirrors how every real checkout works.
        ============================================================= */}
      <div
        className={
          expressCheckoutStatus === "unavailable" ? "hidden" : "space-y-3"
        }
      >
        {/* Skeleton shown only until Stripe reports readiness, so the
              customer sees "checking payment options" instead of jumping
              straight to the card form and assuming there's nothing else. */}
        {expressCheckoutStatus === "loading" && (
          <div className="h-11 w-full animate-pulse rounded-lg bg-gray-100" />
        )}

        <div className={expressCheckoutStatus === "loading" ? "hidden" : ""}>
          <ExpressCheckoutElement
            onReady={({ availablePaymentMethods }) => {
              setExpressCheckoutStatus(
                availablePaymentMethods ? "ready" : "unavailable",
              );
            }}
            onConfirm={handleExpressCheckoutConfirm}
            options={{
              buttonHeight: 44,
              layout: { maxColumns: 2, maxRows: 1 },
              paymentMethods: {
                applePay: "always",
                googlePay: "always",
                amazonPay: "never",

                // ===========================================
                // Other payment options (disabled)
                // Flip to "auto" to enable once the payment
                // method is configured on the Stripe backend.
                // ===========================================
                link: "never", // Stripe Link (one-click saved card checkout)
                paypal: "never", // PayPal
                klarna: "never", // Klarna (buy now, pay later)
              },
            }}
          />
        </div>

        {expressCheckoutStatus === "ready" && (
          <div className="relative flex items-center py-1">
            <div className="grow border-t border-gray-200" />
            <span className="mx-3 text-xs text-gray-400 uppercase">
              Or pay with card
            </span>
            <div className="grow border-t border-gray-200" />
          </div>
        )}
      </div>
      {/* >>> APPLE PAY / GOOGLE PAY INTEGRATION — END <<< */}

      <div className="border rounded-lg p-3">
        <CardNumberElement onChange={handleElementChange("cardNumber")} />
      </div>

      <div className="flex gap-3">
        <div className="flex-1 border rounded-lg p-3">
          <CardExpiryElement onChange={handleElementChange("cardExpiry")} />
        </div>
        <div className="flex-1 border rounded-lg p-3">
          <CardCvcElement onChange={handleElementChange("cardCvc")} />
        </div>
      </div>

      <Button
        type="submit"
        onClick={handleSubmit}
        disabled={loading || !isFormComplete}
        className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? "Processing..." : `Pay $${coverage_price}`}
      </Button>
    </form>
  );
};

export default StripeCheckoutCard;
