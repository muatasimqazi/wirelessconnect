/**
 * Stripe server-side client — singleton.
 *
 * Import ONLY in Server Components, Server Actions, and Route Handlers.
 * Never import in Client Components or files bundled for the browser.
 */

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required environment variable: STRIPE_SECRET_KEY");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  typescript: true,
});
