/**
 * Server-only environment access. Throws loudly at first use if a required
 * variable is missing, rather than failing with a confusing error deep in a
 * request handler.
 */
import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`,
    );
  }
  return value;
}

export const env = {
  get DATABASE_URL() {
    return required("DATABASE_URL");
  },
  /** The PIN that unlocks the app. */
  get APP_PIN() {
    const pin = required("APP_PIN");
    if (pin.length < 6) {
      throw new Error(
        "APP_PIN must be at least 6 characters. A short PIN can be brute-forced.",
      );
    }
    return pin;
  },
  /** Key used to sign the session cookie. Rotating it logs out every device. */
  get SESSION_SECRET() {
    const secret = required("SESSION_SECRET");
    if (secret.length < 16) {
      throw new Error(
        "SESSION_SECRET must be at least 16 characters. Generate one with: " +
          `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
      );
    }
    return secret;
  },
};
