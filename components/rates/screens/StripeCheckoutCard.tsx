import { useLayout } from "@/app/providers/LayoutContext";
import { useLoader } from "@/app/providers/LoaderContext";
import { Button } from "@/components/ui/button";
import { fetching } from "@/lib/api/client";
import { formatDate } from "@/utils/helpers";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type {
  PaymentIntent,
  StripeCardCvcElementChangeEvent,
  StripeCardExpiryElementChangeEvent,
  StripeCardNumberElementChangeEvent,
  StripeExpressCheckoutElementConfirmEvent,
} from "@stripe/stripe-js";
import { useState } from "react";
import { toast } from "sonner";
import { planType } from "../data/coverages";
import { useFlow } from "../wizard/FlowProvider";
interface StripeCheckoutCardProps {
  clientSecret: string;
  /** This screen's step index — advances the flow once payment is saved. */
  index: number;
}
const StripeCheckoutCard = ({
  clientSecret,
  index,
}: StripeCheckoutCardProps) => {
  const flow = useFlow();
  const { badgeLoading, loading } = useLoader();
  const [expressCheckoutStatus, setExpressCheckoutStatus] = useState<
    "loading" | "ready" | "unavailable"
  >("loading");
  const { DealerID } = useLayout();
  const selectedCoverage = flow.data.selectedCoverage as planType;

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
  const {
    firstName: first_name,
    lastName: last_name,
    email,
    phone,
    zip,
    streetAddress: address,
    apt: unit_address,
    year,
    model,
    make,
    vin,
    mileage: initial_mileage,
    password,
  } = flow.data;
  const plan_id = selectedCoverage?.plan_id;
  const rate_id = selectedCoverage?.reserve_rate_id;
  const coverage_price = selectedCoverage?.price;

  const savePayment = async (paymentIntent: PaymentIntent) => {
    const data = {
      clientSecret,
      first_name,
      last_name,
      email,
      phone,
      zip,
      address,
      unit_address,
      dealer_id: DealerID,
      make,
      model,
      year,
      vin,
      initial_mileage,
      password,
      plan_id,
      rate_id,
      coverage_price,
      payment_date: formatDate(new Date()),
    };

    const res = await fetching({
      url: "/api/saveContract",
      body: data,
      method: "POST",
      isFormdata: true,
      badgeLoading: "Saving",
    });
    if (res) {
      return res;
    }
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
      const result = await savePayment(paymentIntent);
      if (result) {
        flow.next(index, { paymentSuccess: true });
      }
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
      // =================================
      // Wait For Webhook Result
      // =================================
      // const result = await waitForPaymentResult(paymentIntent.id);
      const result = await savePayment(paymentIntent);
      if (result) {
        flow.next(index, { paymentSuccess: true });
      }
    }

    badgeLoading("Saving", false);
  };
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
