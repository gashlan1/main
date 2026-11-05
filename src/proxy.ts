import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// The public website lives at the root. Only the staff portal and its APIs
// need the session cookie; the real check (signature + user lookup) happens
// in the portal layout and in each route handler.
const PUBLIC_API = ["/api/intake", "/api/health"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPortal = pathname === "/portal" || pathname.startsWith("/portal/");
  const isPrivateApi = pathname.startsWith("/api/") && !PUBLIC_API.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isPortal && !isPrivateApi) return NextResponse.next();

  if (!request.cookies.get(SESSION_COOKIE)) {
    if (isPrivateApi) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    const url = new URL("/login", request.url);
    if (pathname !== "/portal") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/portal", "/api/:path*"],
};
