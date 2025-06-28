import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import prisma from "../../lib/dbConnect";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: {
      user_id: true,
      username: true,
      full_name: true,
      email: true,
      is_active: true,
      is_ceo: true,
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

  if (!user) return res.status(404).json({ error: "User not found" });

  const permissions = user.user_roles_user_roles_user_idTousers.flatMap((ur) =>
    ur.roles.role_permissions.map((rp) => rp.permissions.permission_name)
  );

  res.status(200).json({
    id: user.user_id,
    username: user.username,
    name: user.full_name,
    email: user.email,
    is_active: user.is_active,
    is_ceo: user.is_ceo,
    permissions,
  });
}
