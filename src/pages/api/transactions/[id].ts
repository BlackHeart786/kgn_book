import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/dbConnect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);

  if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid transaction ID' });

  try {
    if (req.method === 'GET') {
      const transaction = await prisma.financial_transactions.findUnique({
        where: { transaction_id: id },
        include: {
          vendors: true,
          users: { select: { username: true } },
        },
      });

      if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

      return res.status(200).json({
        ...transaction,
        amount: Number(transaction.amount),
        vendorName: transaction.vendors?.vendor_name || 'N/A',
        creatorName: transaction.users?.username || 'N/A',
        transaction_date: transaction.transaction_date?.toISOString().slice(0, 10) || '',
        created_at: transaction.created_at?.toISOString() || '',
        updated_at: transaction.updated_at?.toISOString() || '',
      });
    }

    if (req.method === 'PUT') {
      const {
        reference_number,
        transaction_date,
        type,
        transaction_method,
        amount,
        category,
        description,
        project_id,
        vendor_id,
      } = req.body;

      await prisma.financial_transactions.update({
        where: { transaction_id: id },
        data: {
          reference_number,
          transaction_date,
          type,
          transaction_method,
          amount: Number(amount),
          category,
          description,
          project_id: project_id ? Number(project_id) : null,
          vendor_id: vendor_id ? Number(vendor_id) : null,
        },
      });

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      await prisma.financial_transactions.delete({
        where: { transaction_id: id },
      });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
