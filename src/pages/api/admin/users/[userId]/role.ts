import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]";
import prisma from "../../../../../lib/dbConnect";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow PUT method
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Authorize CEO only
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.is_ceo) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  // Validate params
  const { userId } = req.query;
  const { role_id } = req.body;

  const parsedUserId = Number(userId);
  const parsedRoleId = Number(role_id);

  if (isNaN(parsedUserId) || isNaN(parsedRoleId)) {
    return res.status(400).json({ error: "Invalid userId or role_id" });
  }

  try {
    // Remove existing roles for the user
    await prisma.user_roles.deleteMany({
      where: { user_id: parsedUserId },
    });

    // Assign the new role
    await prisma.user_roles.create({
      data: {
        user_id: parsedUserId,
        role_id: parsedRoleId,
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
