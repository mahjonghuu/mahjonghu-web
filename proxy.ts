import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

function loginRedirect(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/dashboard/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

/** Validates dashboard sessions through the backend before serving dashboard routes. */
export async function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/dashboard/login";
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
    return new NextResponse("Authentication service is temporarily unavailable.", {
      status: 503,
    });
  }

  if (authResponse.ok) {
    if (!isLoginPage) return NextResponse.next();
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }
  if (authResponse.status >= 500) {
    return new NextResponse("Authentication service is temporarily unavailable.", {
      status: 503,
    });
  }

  const response = isLoginPage ? NextResponse.next() : loginRedirect(request);
  response.cookies.delete("ownerToken");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
