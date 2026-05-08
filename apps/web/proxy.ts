import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;

function isAlwaysAllowedPath(pathname: string) {
    if (pathname.startsWith("/api")) return true;
    if (pathname.startsWith("/_next")) return true;
    if (pathname === "/__blocked") return true;
    if (pathname === "/favicon.ico") return true;
    if (pathname === "/robots.txt") return true;
    if (pathname === "/sitemap.xml") return true;
    if (pathname === "/manifest.json") return true;
    if (PUBLIC_FILE.test(pathname)) return true;
    return false;
}

function isWishlistPath(pathname: string) {
    return pathname === "/wishlist" || pathname.startsWith("/wishlist/");
}

function isLandingPath(pathname: string) {
    return pathname === "/";
}

function isAuthPath(pathname: string) {
    const authPaths = [
        "/login",
        "/register",
        "/join",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/welcome",
    ];

    return authPaths.some((authPath) => pathname === authPath || pathname.startsWith(`${authPath}/`));
}

export default function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (isAlwaysAllowedPath(pathname)) return NextResponse.next();
    if (isAuthPath(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/wishlist/success";
        url.search = "";
        return NextResponse.redirect(url);
    }
    if (isLandingPath(pathname)) return NextResponse.next();
    if (isWishlistPath(pathname)) return NextResponse.next();

    const url = request.nextUrl.clone();
    url.pathname = "/__blocked";
    url.searchParams.set("from", pathname);
    return NextResponse.rewrite(url);
}

export const config = {
    matcher: ["/((?!.*\\.).*)"],
};
