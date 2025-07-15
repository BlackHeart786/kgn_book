import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/dbConnect';
import { checkPermission } from '../../../lib/permissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { allowed } = await checkPermission(req, res, 'payment_view');
  if (!allowed) return;

  const { keyword = '', date = '', page = '1' } = req.query;
  const currentPage = Number(page) || 1;
  const itemsPerPage = 10;

  const whereClause: any = {};

  if (keyword) {
    whereClause.OR = [
      { description: { contains: keyword.toString(), mode: 'insensitive' } },
      { category: { contains: keyword.toString(), mode: 'insensitive' } },
    ];
  }

  if (date) {
    whereClause.transaction_date = new Date(date.toString());
  }

  try {
    const total = await prisma.financial_transactions.count({ where: whereClause });

    const transactions = await prisma.financial_transactions.findMany({
      where: whereClause,
      orderBy: {
        transaction_date: 'desc',
      },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
    });

    res.status(200).json({
      transactions,
      currentPage,
      totalPages: Math.ceil(total / itemsPerPage),
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions.', details: error.message });
  }
}
