import { createNeonAuth } from "@neon/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const secret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!baseUrl || !secret || secret.length < 32) {
  throw new Error("NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET (32+ chars) must be set");
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: { secret },
});
