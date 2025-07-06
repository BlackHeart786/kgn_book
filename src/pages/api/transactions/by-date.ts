import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/dbConnect';
import { checkPermission } from '../../../lib/permissions';

// Decimal / BigInt serialization helper
function replacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (
    value &&
    typeof value === 'object' &&
    'toNumber' in value &&
    typeof (value as any).toNumber === 'function'
  ) {
    return (value as any).toNumber();
  }
  return value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { allowed } = await checkPermission(req, res, 'payment_view');
  if (!allowed) return;

  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'Missing `start` or `end` date.' });
  }

  try {
    const transactions = await prisma.financial_transactions.findMany({
      where: {
        transaction_date: {
          gte: new Date(start as string),
          lte: new Date(end as string),
        },
      },
      include: {
        vendor: true,
      },
      orderBy: {
        transaction_date: 'desc',
      },
    });

    res.status(200).json(JSON.parse(JSON.stringify(transactions, replacer)));
  } catch (error: any) {
    console.error('Error fetching transactions by date:', error);
    res.status(500).json({ error: 'Failed to fetch transactions.', details: error.message });
  }
}
