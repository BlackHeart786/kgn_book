import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import prisma from "../../lib/dbConnect";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: {
        is_ceo: true,
        user_roles_user_roles_user_idTousers: {
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: { permissions: { select: { permission_name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const permissions = user.user_roles_user_roles_user_idTousers.flatMap((ur) =>
      ur.roles.role_permissions.map((rp) => rp.permissions.permission_name)
    );

    res.status(200).json({
      permissions,
      is_ceo: user.is_ceo,
    });
  } catch (error) {
    console.error("Error fetching fresh permissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
