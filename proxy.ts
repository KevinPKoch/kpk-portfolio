import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js runs this function for every request matched by `config.matcher`.
// This file replaces the old `middleware.ts` in newer Next versions.
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Only protect /work/*, but allow the unlock page and API routes.
  const isProtectedWorkRoute =
    pathname.startsWith("/work") &&
    !pathname.startsWith("/work/unlock") &&
    !pathname.startsWith("/api");

  if (!isProtectedWorkRoute) {
    return NextResponse.next();
  }

  const hasAccess = req.cookies.get("case_access")?.value === "1";
  if (hasAccess) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/work/unlock";
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/work/:path*"],
};
