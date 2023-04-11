import { getToken } from "next-auth/jwt";
import { NextRequestWithAuth, withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";


const myMiddleware = async (req: NextRequestWithAuth) => {
    const pathname = req.nextUrl.pathname;
    
    // manage route protection
    const isAuth = await getToken({ req });
    const isLoginPage = pathname.startsWith("/login");

    const sensitiveRoutes = ["/dashboard"];

    const isAccessingSensitiveRoute = sensitiveRoutes.some(route => pathname.startsWith(route));

    if (isLoginPage) {
        if (isAuth) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        return NextResponse.next();
    }

    if (!isAuth && isAccessingSensitiveRoute) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }
}

export default withAuth(
    myMiddleware,
    {
        callbacks: {
            //! this callback is necessary, because if we don't add it then there will be infinite redirecting
            async authorized() {
                return true
            },
        }
    }
)

export const config = {
    matcher: ["/", "/login", "/dashboard/:path*"]
}