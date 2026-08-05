import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { VISITOR_COOKIE } from "@/lib/visitor";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Runs before every page and Server Function (Proxy defaults to the Node.js
// runtime in this Next version, so it can talk to Postgres directly — no
// Edge-runtime workaround needed). On a visitor's first request, mints an
// anonymous Visitor row and a matching long-lived cookie; every later
// request already has the cookie, so this is a no-op pass-through.
//
// This is the whole identity model: no email, no password, nothing to
// recover. Clearing the cookie or switching browsers/devices permanently
// loses access to that fund — expected in this phase, not a bug.
export async function proxy(request: NextRequest) {
  if (request.cookies.has(VISITOR_COOKIE)) return NextResponse.next();

  const visitor = await prisma.visitor.create({ data: {} });
  const response = NextResponse.next();
  response.cookies.set(VISITOR_COOKIE, visitor.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
  return response;
}

export const config = {
  // Every real page and Server Function, minus static assets — those never
  // read the visitor cookie, so there's nothing to assign it for.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
