// /lib/permissions.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../pages/api/auth/[...nextauth]';
import prisma from './dbConnect';

export async function getUserPermissions(email: string): Promise<string[]> {
  const user = await prisma.users.findUnique({
    where: { email },
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

  if (!user) return [];

  return user.user_roles_user_roles_user_idTousers.flatMap((ur) =>
    ur.roles.role_permissions.map((rp) => rp.permissions.permission_name)
  );
}

export async function checkPermission(
  req: NextApiRequest,
  res: NextApiResponse,
  requiredPermission: string
): Promise<{ allowed: boolean; session?: any; reason?: "unauthenticated" | "forbidden" }> {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.email) {
    return { allowed: false, reason: "unauthenticated" };
  }

  if (session.user.is_ceo) return { allowed: true, session };

  const freshPermissions = await getUserPermissions(session.user.email);
  const hasPermission = freshPermissions.includes(requiredPermission);

  if (!hasPermission) {
    return { allowed: false, reason: "forbidden" };
  }

  return { allowed: true, session };
}

