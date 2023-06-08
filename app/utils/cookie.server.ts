import { createCookie } from "@remix-run/node"; // or cloudflare/deno

export const session = createCookie("wallet", {
  maxAge: 604_800, // one week
});