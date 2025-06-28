import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "../../../lib/dbConnect";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  username: string;
  is_ceo: boolean;
  is_active: boolean;
  permissions: string[];
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        if (!credentials?.email || !credentials.password) return null;

        // Fetch user + roles + permissions in one query
        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
          include: {
            user_roles_user_roles_user_idTousers: {
              include: {
                roles: {
                  include: {
                    role_permissions: {
                      include: { permissions: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (!user || !user.is_active) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );
        if (!isValid) return null;

        const rawPermissions =
          user.user_roles_user_roles_user_idTousers.flatMap((ur) =>
            ur.roles.role_permissions.map(
              (rp) => rp.permissions.permission_name
            )
          ) || [];

        const permissions: string[] = rawPermissions.filter(
          (p): p is string => p !== null
        );

        return {
          id: user.user_id.toString(),
          name: user.full_name,
          email: user.email,
          username: user.username,
          is_ceo: user.is_ceo ?? false,
          is_active: user.is_active ?? false,
          permissions,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 3 * 24 * 60 * 60, 
  },

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: ExtendedUser }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.username = user.username;
        token.is_ceo = user.is_ceo;
        token.is_active = user.is_active;
        token.permissions = user.permissions;
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.username = token.username as string;
        session.user.is_ceo = token.is_ceo as boolean;
        session.user.is_active = token.is_active as boolean;
        session.user.permissions = token.permissions as string[];
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);
