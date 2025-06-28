import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      username: string;
      is_ceo: boolean;
      is_active: boolean;
      permissions: string[];
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    email: string;
    name?: string;
    username: string;
    is_ceo: boolean;
    is_active: boolean;
    permissions: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    is_ceo: boolean;
    email: string;
    username: string;
    is_active: boolean;
    permissions: string[];
  }
}
