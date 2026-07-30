# Payment Flow — Integration Guide (Mobile)

Stripe payment with **manual capture**: the card is only _authorized_ when the customer taps Pay.
It is only actually _charged_ after our backend confirms the contract saved successfully. If saving
fails, the authorization is voided automatically — the customer is never charged for a failed save.

## Step-by-step

### 1. Collect required fields (on your form)

| Field             | Type   | Notes                                                     |
| ----------------- | ------ | --------------------------------------------------------- |
| `first_name`      | string |                                                           |
| `last_name`       | string |                                                           |
| `email`           | string |                                                           |
| `phone`           | string |                                                           |
| `address`         | string | street address                                            |
| `city`            | string |                                                           |
| `zip`             | string |                                                           |
| `unit_address`    | string | optional (apt/unit)                                       |
| `dealer_id`       | number |                                                           |
| `make_id`         | string | **vehicle make name**, e.g. `"Toyota"` — not a numeric ID |
| `model_id`        | string | **vehicle model name**, e.g. `"Camry"` — not a numeric ID |
| `year_id`         | string | e.g. `"2020"`                                             |
| `vin`             | string |                                                           |
| `initial_mileage` | string |                                                           |
| `password`        | string |                                                           |
| `plan_id`         | string | plan                                                      |
| `rate_id`         | number | `reserve_rate_id`                                         |
| `coverage_price`  | number | `price`                                                   |

<!-- base url production is "https://fastapi.mypcp.us" -->

### 2. Stage the contract — `POST /kanopi/stage`

<!--example: https://fastapi.mypcp.us/kanopi/stage -->

Send **all** fields from step 1 as the JSON body.

```json
// Response
{ "success": 1, "temp_id": "2f74b7e2-2764-4767-888b-dde18b4ac33b" }
```

Save `temp_id` — every following call needs it. **None of this data ever goes to Stripe.**

### 3. Get the Stripe publishable key — `GET /stripe/config`

```json
// Response
{ "publishableKey": "pk_..." }
```

Use it to init the Stripe SDK (once per app session — don't re-init per payment).

### 4. Create the PaymentIntent — `POST /stripe/create-payment-intent`

```json
// Request
{
  "items": [{ "title": "<plan title>", "amount": 120500, "quantity": 1 }],
  "metadata": {
    "temp_id": "<temp_id from step 2>",
    "product_id": 1,
    "plan_id": "<plan_id>",
    "rate_id": 1173,
    "coverage_price": 1205,
    "PaymentThrough": 1,
    "title": "<plan title>",
    "invoice_date": "2026-07-30T12:00:00.000Z"
  }
}
```

- `amount` is in **cents** (`price * 100`, rounded).
- `metadata.temp_id` is mandatory — it's how the webhook finds this contract later.

```json
// Response
{
  "message": "Payment intent created successfully",
  "data": { "clientSecret": "...", "paymentIntentId": "..." }
}
```

### 5. Confirm the card with Stripe's SDK

Use `clientSecret` from step 4 with Stripe's native confirm-payment call (whatever your platform's Stripe SDK provides — `confirmPayment`/`confirmCardPayment` equivalent).

**Expected result status: `requires_capture`** — not `succeeded`. This is correct and expected (manual capture). Treat `requires_capture` OR `succeeded` as "confirmed, now poll for the real result." Any other status/error = show the error, do not poll.

### 6. Poll for the real outcome — `GET /kanopi/payment-status/{temp_id}`

Poll every ~1.5s, up to ~12 times (~18s total).

```json
// Response
{ "success": 1, "contract_status": "pending" | "succeeded" | "failed", "message": "..." }
```

| `contract_status` | Meaning                                                                       | What to do                                                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pending`         | Webhook hasn't landed yet                                                     | Wait, poll again                                                                                                                                                                      |
| `succeeded`       | Contract saved, card actually captured                                        | Show success screen                                                                                                                                                                   |
| `failed`          | Save rejected (e.g. bad zip) — **card was NOT charged**, authorization voided | Show `message`, let customer fix info, then go back to **step 1** for a brand new payment attempt (new `temp_id` + new PaymentIntent — never reuse the old `clientSecret`, it's dead) |

If all 12 attempts stay `pending` (timeout, outcome still unknown): show "still checking" and offer a **manual re-poll** of this same endpoint — do **not** restart the payment, since the webhook may still land.

## Key rules

1. **Never reuse a `clientSecret` after confirming it once.** Once Stripe returns `requires_capture`/`succeeded`, that PaymentIntent is done — success or failure, it never gets confirmed again. A failed contract save means the card was never actually charged, so retrying is a **whole new flow from step 1**, not a resubmission.
2. **`contract_status` is the source of truth**, not the client-side Stripe confirm result. The Stripe SDK only tells you the card was authorized — whether the customer actually gets the service depends on whether the contract saved, which only the webhook knows.
3. Guard against double-tapping "Pay" — don't let a second confirm fire while one is already in flight on the same PaymentIntent.
