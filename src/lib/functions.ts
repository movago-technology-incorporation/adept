import { functionBaseUrl } from "@neon/env";

export async function callHelloFunction(): Promise<{ message: string; url: string }> {
  const url = functionBaseUrl("hello");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to call Neon function: ${res.status} ${res.statusText}`);
  }
  const message = await res.text();
  return { message, url };
}
