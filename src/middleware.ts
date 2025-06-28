import { withAuth } from "next-auth/middleware";

// Middleware that protects all pages (except the public ones)
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
   
    "/((?!api/auth|login|register|_next/static|_next/image|favicon.ico).*)",
  ],
};
