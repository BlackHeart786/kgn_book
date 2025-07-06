import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/dbConnect';
import { checkPermission } from '../../../lib/permissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { allowed, session } = await checkPermission(req, res, 'payment_edit');
  if (!allowed) return;

  try {
    const {
      project_id,
      transaction_date,
      amount,
      transaction_method,
      category,
      description,
      reference_number,
      vendor_id,
      type,
    } = req.body;

    // Validate required fields
    if (
      !transaction_date ||
      typeof amount !== 'number' ||
      isNaN(amount) ||
      !transaction_method ||
      !category
    ) {
      return res.status(400).json({
        error: 'Missing or invalid fields: transaction_date, amount, transaction_method, category',
      });
    }

    const payload = {
      project_id: project_id ?? null,
      transaction_date: new Date(transaction_date),
      amount,
      transaction_method: String(transaction_method),
      category: String(category),
      description: description ?? null,
      reference_number: reference_number ?? null,
      vendor_id: vendor_id ?? null,
      created_by: parseInt(session.user.id), // Cast to Int
      type: type ?? 'spend',
    };

    console.log('🧾 Payload being inserted:', payload);

    const created = await prisma.financial_transactions.create({ data: payload });

    return res.status(201).json(created);
  } catch (error: any) {
    console.error('💥 Prisma error:', error);
    return res.status(500).json({
      error: 'Failed to create transaction',
      details: error.message || 'Unknown server error',
    });
  }
}
