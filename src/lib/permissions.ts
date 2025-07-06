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
): Promise<{ allowed: boolean; session?: any }> {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.email) {
    res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    return { allowed: false };
  }

  if (session.user.is_ceo) return { allowed: true, session };

  const freshPermissions = await getUserPermissions(session.user.email);
  const hasPermission = freshPermissions.includes(requiredPermission);

  if (!hasPermission) {
    res.status(403).json({
      error: `Access denied. Missing permission: ${requiredPermission}`,
    });
    return { allowed: false };
  }

  return { allowed: true, session };
}
