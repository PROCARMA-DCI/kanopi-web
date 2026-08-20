"use client";

import { Input } from "@/components/ui/input";
import { fetching } from "@/lib/api/client";
import { useState } from "react";
import { toast } from "sonner";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

// Real shape of POST /kanopiLogin's success response — drives
// DashboardScreen's theming/profile/coverage cards directly, no demo data.
export interface CoverageImageItem {
  imageurl: string;
  heading: string;
  content: string;
  dateRange: string;
}

export interface KanopiCustomerInfo {
  CustomerID: string;
  FirstName: string;
  LastName: string;
  Phone: string;
  MainAddress: string;
  AptNo: string | null;
  City: string;
}

// Real shape of one row from POST /checkAlreadyPurchasedPlanForEmail —
// this is what DashboardScreen's coverage cards actually show (loginData's
// own CoverageImages field is unrelated design/asset config, not the
// customer's actual purchased plans).
export interface PurchasedPlan {
  plan_id: string;
  title: string;
  term: string;
  year: string;
  make: string;
  model: string;
  duration: string;
  price: number;
  purchase_date: string;
  image: string;
}
export interface dashboard {
  CustomerInfo: KanopiCustomerInfo;
  Plans: PurchasedPlan[];
}

export interface KanopiLoginData {
  AppBackgrounColor?: string;
  AppTextColor?: string;
  AppButtonColor?: string;
  DeActiveMenuColor?: string;
  TextBodyColor?: string;
  ActiveMenuColor?: string;
  OutlineButtonColor?: string;
  MainScreenLogoTop?: string;
  MainScreenProfile?: string;
  lottieURL?: string;
  lottieTime?: number;
  DashboardImages?: string[];
  CoverageImages?: CoverageImageItem[];
  CustomerInfo?: KanopiCustomerInfo;
}

/**
 * Yes-account · Step 1 — sign in against the real backend
 * (POST /kanopiLogin, form data), then on success load whatever plans are
 * already on file for that email (checkAlreadyPurchasedPlanForEmail). Both
 * get saved into THIS flow's data — YesAccountFlow's own <FlowProvider> —
 * which is exactly why they don't need explicit clearing anywhere: RatesFlow
 * only ever mounts one of NoAccountFlow/YesAccountFlow at a time (see the
 * `flowKey === ...` conditionals there), so switching the entry choice
 * fully unmounts this flow's provider and wipes this data with it — there's
 * nothing stale left to delete.
 */
export function LoginScreen({ index }: { index: number }) {
  const flow = useFlow();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const filled = [email, password].filter((v) => v.trim() !== "").length;
  const completion = filled / 2;
  const canAdvance = completion === 1;

  return (
    <ScreenShell
      id={flow.stepId(index)}
      index={index}
      total={flow.total}
      completion={completion}
      title="Welcome back"
      question="Sign in and we'll pull up your details."
      canAdvance={canAdvance}
      nextLabel="Log in"
      onNext={async () => {
        setError("");

        const loginRes = await fetching<KanopiLoginData>({
          url: "/api/kanopiLogin",
          method: "POST",
          isFormdata: true,
          body: { username: email, password },
          badgeLoading: "Signing in",
        });

        if (!loginRes.ok || loginRes.success !== 1) {
          const message =
            (loginRes.message as string) ||
            "Invalid email or password — please try again.";
          setError(message);
          toast.error(message);
          return;
        }

        // The response's JSON is flat ({ success, message: {...} }), not
        // nested under "data" — fetching()'s message?? data alias already
        // lands the whole object on .message, same as /kanopi/payment-status
        // elsewhere in this app.
        const loginData = loginRes.message as KanopiLoginData;

        const plansRes = await fetching<dashboard>({
          url: "/api/kanopiDashboard",
          method: "POST",
          isFormdata: true,
          body: { email },
          badgeLoading: "Loading your plans",
        });
        const plans = plansRes.message?.Plans;
        const purchasedPlans = Array.isArray(plans) ? plans : [];

        flow.next(index, {
          email,
          loginData,
          purchasedPlans,
        });
      }}
      onBack={() => flow.back(index)}
    >
      <div className="grid grid-cols-1 gap-4">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <p className="mt-2 text-[13px] text-red-600" role="alert">
          {error}
        </p>
      )}
    </ScreenShell>
  );
}
