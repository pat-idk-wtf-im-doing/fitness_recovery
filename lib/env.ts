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
};
