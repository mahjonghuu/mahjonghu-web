import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/$/, "");
const EMPLOYEE_LANDING = "/dashboard/booking";
const OWNER_ONLY_PREFIXES = [
  "/dashboard/outlet",
  "/dashboard/advertisements",
  "/dashboard/table",
  "/dashboard/revenue",
  "/dashboard/employees",
];

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

function loginRedirect(request: NextRequest) {
  return redirectTo(request, "/dashboard/login");
}

/** Owner-only pages that employees must not open. */
function isOwnerOnlyPath(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname === "/dashboard/" ||
    OWNER_ONLY_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

/** Validates dashboard sessions and keeps employees inside their allowed routes. */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/dashboard/login";
  const token = request.cookies.get("ownerToken")?.value;
  if (!token) {
    return isLoginPage ? NextResponse.next() : loginRedirect(request);
  }

  let authResponse: Response;
  try {
    authResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return new NextResponse(
      "Authentication service is temporarily unavailable.",
      {
        status: 503,
      },
    );
  }

  if (authResponse.status >= 500) {
    return new NextResponse(
      "Authentication service is temporarily unavailable.",
      {
        status: 503,
      },
    );
  }

  if (authResponse.ok) {
    const session = (await authResponse.json().catch(() => null)) as {
      role?: unknown;
    } | null;
    if (session?.role !== "owner" && session?.role !== "employee") {
      return new NextResponse(
        "Authentication service returned an invalid session.",
        {
          status: 503,
        },
      );
    }
    if (isLoginPage) {
      return redirectTo(
        request,
        session.role === "employee" ? EMPLOYEE_LANDING : "/dashboard",
      );
    }
    if (session.role === "employee" && isOwnerOnlyPath(pathname)) {
      return redirectTo(request, EMPLOYEE_LANDING);
    }
    return NextResponse.next();
  }

  const response = isLoginPage ? NextResponse.next() : loginRedirect(request);
  response.cookies.delete("ownerToken");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
