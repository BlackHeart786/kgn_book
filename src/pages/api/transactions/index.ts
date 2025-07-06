// /pages/api/transactions/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/dbConnect';
import { checkPermission } from '../../../lib/permissions';

// Serialize BigInt / Decimal values
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

  try {
    const transactions = await prisma.financial_transactions.findMany({
      include: {
        vendor: true,
      },
      orderBy: {
        transaction_date: 'desc',
      },
    });

    res.status(200).json(JSON.parse(JSON.stringify(transactions, replacer)));
  } catch (err: any) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions.', details: err.message });
  }
}
