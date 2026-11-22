import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/** The signed-in session, or null. Cached for the duration of one request. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** The signed-in user's id, or null when nobody is signed in. */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user.id ?? null;
}
