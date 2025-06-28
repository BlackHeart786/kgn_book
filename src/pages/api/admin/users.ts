// pages/api/admin/users.ts
import { getServerSession } from "next-auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "../../../lib/dbConnect";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.is_ceo) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (req.method === "GET") {
    const users = await prisma.users.findMany({
      select: {
        user_id: true,
        full_name: true,
        email: true,
        is_active: true,
        is_ceo: true,
        user_roles_user_roles_user_idTousers: {
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: {
                    permissions: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return res.status(200).json(users);
  }

}
