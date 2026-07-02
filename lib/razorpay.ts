import Razorpay from "razorpay";

/**
 * Initializes the Razorpay client if the environment variables are present.
 * Never hardcodes RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.
 */
export function getRazorpay(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Checks if Razorpay is configured on the server.
 */
export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}
