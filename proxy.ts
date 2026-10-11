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
  if (request.nextUrl.pathname === "/dashboard/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get("ownerToken")?.value;
  if (!token) return loginRedirect(request);

  let authResponse: Response;
  try {
    authResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return new NextResponse("Layanan autentikasi sementara tidak tersedia.", {
      status: 503,
    });
  }

  if (authResponse.ok) return NextResponse.next();
  if (authResponse.status >= 500) {
    return new NextResponse("Layanan autentikasi sementara tidak tersedia.", {
      status: 503,
    });
  }

  const response = loginRedirect(request);
  response.cookies.delete("ownerToken");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
