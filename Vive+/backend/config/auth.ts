import NextAuth from "next-auth/next";

export const handler = NextAuth({
  providers: [],
  secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET!,
  pages: {
    signIn: "/",
    error: "/",
  },
});
