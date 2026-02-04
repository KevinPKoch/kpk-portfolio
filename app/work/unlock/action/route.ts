// app/work/unlock/action/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();

  const expected = process.env.CASE_PASS;
  if (!expected || password !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  // Cookie "bis gelöscht" -> ohne expires/maxAge = Session Cookie
  // Wenn du willst, dass es auch Browser-Restarts überlebt, setze maxAge z.B. 30 Tage
  res.cookies.set("case_access", "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // maxAge: 60 * 60 * 24 * 30, // optional: 30 Tage
  });

  return res;
}
