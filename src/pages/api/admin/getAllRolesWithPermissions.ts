import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../pages/api/auth/[...nextauth]";
import prisma from "../../../lib/dbConnect";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.is_ceo) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const roles = await prisma.roles.findMany({
      include: {
        role_permissions: {
          include: {
            permissions: {
              select: {
                permission_id: true,
                permission_name: true,
              },
            },
          },
        },
      },
    });

    // Format response for easier frontend use
    const formattedRoles = roles.map((role) => ({
      role_id: role.role_id,
      role_name: role.role_name,
      description: role.description,
      permissions: role.role_permissions.map((rp) => rp.permissions),
    }));

    return res.status(200).json(formattedRoles);
  } catch (error) {
    console.error("Error fetching roles with permissions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
