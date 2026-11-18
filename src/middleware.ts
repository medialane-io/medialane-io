import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, resolveLocale, type LocaleInfo } from "@medialane/ui/i18n";

export function handleRequest(request: NextRequest, locales: readonly LocaleInfo[] = LOCALES) {
  const { pathname, search } = request.nextUrl;
  const resolved = resolveLocale(
    {
      pathname,
      cookie: request.cookies.get(LOCALE_COOKIE)?.value,
      acceptLanguage: request.headers.get("accept-language"),
    },
    locales,
  );

  const prefixed = pathname === `/${resolved.locale}` || pathname.startsWith(`/${resolved.locale}/`);
  if (resolved.redirectTo) {
    const url = new URL(resolved.redirectTo + search, request.url);
    return vary(NextResponse.redirect(url, prefixed ? 308 : 307), !prefixed);
  }
  if (prefixed) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${pathname}`;
  return vary(NextResponse.rewrite(url), true);
}

function vary(response: NextResponse, depends: boolean) {
  if (depends) response.headers.set("Vary", "Accept-Language, Cookie");
  return response;
}

export function middleware(request: NextRequest) {
  return handleRequest(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
