import { getUser } from "@/lib/auth";
import { PATH_SIGN_IN } from "@/routes";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const user = await getUser(request.headers);

  if (!user) {
    const baseURL = process.env.BETTER_AUTH_URL?.trim();

    if (!baseURL) {
      throw new Error("BETTER_AUTH_URL is not set.");
    }

    return NextResponse.redirect(new URL(PATH_SIGN_IN, baseURL));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth(?:/|$)|api/batch(?:/|$)|api/register(?:/|$)|auth/sign-in(?:/|$)|embed(?:/|$)|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
