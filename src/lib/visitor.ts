import { cookies } from "next/headers";

export const VISITOR_COOKIE = "fundsim_visitor";

// src/proxy.ts assigns this cookie on every visitor's first request, before
// any page or Server Function runs. Reading it here should never miss — if
// it does, proxy's matcher doesn't cover this route, which is a bug in
// proxy.ts's config, not something to paper over with a fallback identity
// (that would silently create a fresh, empty fund instead of surfacing the
// misconfiguration).
export async function getVisitorId(): Promise<string> {
  const store = await cookies();
  const id = store.get(VISITOR_COOKIE)?.value;
  if (!id) {
    throw new Error(
      "No visitor cookie found — proxy.ts should have set one before this ran. " +
        "Check its matcher covers this route."
    );
  }
  return id;
}
