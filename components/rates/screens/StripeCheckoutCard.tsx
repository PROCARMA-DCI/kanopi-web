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
import { planType } from "../data/coverages";
import { useFlow } from "../wizard/FlowProvider";

interface StripeCheckoutCardProps {
  clientSecret: string;
  /** From PaymentScreen's POST /kanopi/stage — the webhook uses this same
   * id to find the staged contract data once Stripe confirms payment. */
  tempId: string;
  /** This screen's step index — advances the flow once the contract is saved. */
  index: number;
  /** Backend uses manual capture — on a failed contract save it CANCELS
   * the PaymentIntent (no charge happens), so recovering means asking
   * PaymentScreen for a brand new one, never resubmitting this same
   * clientSecret. */
  onRetryPayment: () => void;
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
  onRetryPayment,
}: StripeCheckoutCardProps) => {
  const flow = useFlow();
  const { scrollTo } = useScroll();
  const { badgeLoading, loading } = useLoader();
  const [expressCheckoutStatus, setExpressCheckoutStatus] = useState<
    "loading" | "ready" | "unavailable"
  >("loading");
  const selectedCoverage = flow.data.selectedCoverage as planType;
  const coverage_price = selectedCoverage?.price;

  // Set once Stripe actually confirms this authorization (this component's
  // PaymentIntent is manual-capture — see onRetryPayment). From that point
  // on, this SAME clientSecret must never be confirmed again. Recovering
  // from a failure means PaymentScreen creating a brand new PaymentIntent,
  // which remounts this whole component (see the <Elements key> it uses),
  // not resubmitting from here.
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [saveError, setSaveError] = useState("");
  // Distinguishes "we know it failed, the charge was voided, safe to pay
  // again" from "we don't know yet, don't offer to charge again" (the
  // webhook might still land after the poll gives up).
  const [pollOutcome, setPollOutcome] = useState<"failed" | "timeout" | "">("");
  const [cardError, setCardError] = useState("");
  const pollActive = useRef(false);
  // Guards against a double-submit (fast double click, or the Enter key
  // firing while a confirm is already in flight) triggering
  // confirmCardPayment/confirmPayment twice on the same PaymentIntent —
  // the loader's `loading` flag alone isn't synchronous enough to catch
  // a second click in the same tick.
  const submittingRef = useRef(false);

  // Stripe's real error object always has a `.code` — a canceled
  // PaymentIntent (e.g. abandoned past its window, or already used) can
  // never be confirmed again; no retry button can fix that, only a fresh
  // PaymentIntent (i.e. reloading this screen) can.
  const describeStripeError = (error: { code?: string; message?: string }) => {
    if (error.code === "payment_intent_unexpected_state") {
      return "This payment session has expired or was already used. Please refresh the page to start a new one.";
    }
    return error.message || "Something went wrong processing your card.";
  };

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
        setPollOutcome("failed");
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
    setPollOutcome("timeout");
    setSaveError(
      "This is taking longer than expected — your card was authorized but we haven't confirmed the contract yet. Tap below to check again.",
    );
  };

  // pay with Apple Pay / Google Pay (Stripe's ExpressCheckoutElement) — the
  // flow is the same as a card payment, but the confirm is done through
  // Stripe's own button instead of our own form submit.
  const handleExpressCheckoutConfirm = async (
    event: StripeExpressCheckoutElementConfirmEvent,
  ) => {
    if (!stripe || !elements || submittingRef.current) return;
    submittingRef.current = true;
    setCardError("");

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
      setCardError(describeStripeError(error));
      submittingRef.current = false;
      return;
    }

    // "requires_capture" is the EXPECTED status here, not an edge case —
    // the backend uses manual capture (authorize now, capture/cancel later
    // from the webhook once it knows whether saveContract succeeded), so
    // the card is never actually charged at this point yet.
    if (
      paymentIntent?.status === "succeeded" ||
      paymentIntent?.status === "requires_capture"
    ) {
      setPaymentConfirmed(true);
      await pollForResult();
    } else {
      submittingRef.current = false;
    }
  };

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();

    if (!stripe || !elements || submittingRef.current) return;

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) return;

    submittingRef.current = true;
    setCardError("");
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
      setCardError(describeStripeError(error));
      badgeLoading("Saving", false);
      submittingRef.current = false;
      return;
    }

    // "requires_capture" is the EXPECTED status here, not an edge case —
    // the backend uses manual capture (authorize now, capture/cancel later
    // from the webhook once it knows whether saveContract succeeded), so
    // the card is never actually charged at this point yet.
    if (
      paymentIntent.status === "succeeded" ||
      paymentIntent.status === "requires_capture"
    ) {
      setPaymentConfirmed(true);
      await pollForResult();
    } else {
      badgeLoading("Saving", false);
      submittingRef.current = false;
    }
  };

  // Re-poll without re-charging — used when the poll simply timed out and
  // the real outcome is still unknown (the webhook may yet land).
  const handleCheckAgain = () => {
    setSaveError("");
    pollForResult();
  };

  // The card was only AUTHORIZED, never actually charged (manual capture —
  // see onRetryPayment's doc comment). A "failed" contract save means the
  // backend already canceled that authorization, so recovering means a
  // brand new PaymentIntent, not resubmitting this one.
  if (paymentConfirmed) {
    return (
      <div className="space-y-4 rounded-lg border border-[#a6e00c] bg-[#fffaf3] p-4">
        <p className="font-bold text-[#2d3d00]">
          {pollOutcome === "failed"
            ? "We couldn't finish setting up your contract."
            : saveError
              ? "Still working on your contract..."
              : "Setting up your contract..."}
        </p>
        {saveError && <p className="text-red-600">{saveError}</p>}

        {pollOutcome === "failed" && (
          <>
            <p className="text-[13px] text-[#7d8760]">
              Your card was not charged. Fix the field above if you need to,
              then try again.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="muted"
                // Index 4 = SignupScreen ("Your Info") in NoAccountFlow,
                // where zip/address/etc. are collected — this component
                // already only makes sense inside that flow.
                onClick={() => scrollTo(flow.stepId(0))}
                className="flex-1 cursor-pointer"
              >
                Edit my info
              </Button>
              <Button
                type="button"
                onClick={onRetryPayment}
                disabled={loading}
                className="flex-1 bg-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Preparing new payment..." : "Try again"}
              </Button>
            </div>
          </>
        )}

        {pollOutcome === "timeout" && (
          <Button
            type="button"
            onClick={handleCheckAgain}
            disabled={loading}
            className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Checking..." : "Check again"}
          </Button>
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

      {cardError && (
        <p className="text-[13px] text-red-600" role="alert">
          {cardError}
        </p>
      )}

      <Button
        type="button"
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
