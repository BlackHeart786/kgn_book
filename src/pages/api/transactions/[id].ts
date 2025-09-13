import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/dbConnect";
import { checkPermission } from "../../../lib/permissions";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = Number(req.query.id);

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "Invalid transaction ID" });
  }
  const { allowed, reason } = await checkPermission(req, res, "financial_edit");

  if (!allowed) {
    return res.status(reason === "unauthenticated" ? 401 : 403).json({
      error:
        reason === "unauthenticated"
          ? "Authentication required."
          : "You do not have permission to view transactions.",
    });
  }

  try {
    if (req.method === "GET") {
      const transaction = await prisma.financial_transactions.findUnique({
        where: { transaction_id: id },
      });

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      const vendor = transaction.vendor_id
        ? await prisma.vendors.findUnique({
            where: { vendor_id: transaction.vendor_id },
            select: { vendor_name: true },
          })
        : null;

      const user = transaction.created_by
        ? await prisma.users.findUnique({
            where: { user_id: transaction.created_by },
            select: { username: true },
          })
        : null;

      return res.status(200).json({
        ...transaction,
        amount: Number(transaction.amount),
        vendorName: vendor?.vendor_name || "N/A",
        creatorName: user?.username || "N/A",
        transaction_date:
          transaction.transaction_date?.toISOString().slice(0, 10) || "",
        created_at: transaction.created_at?.toISOString().slice(0, 10) || "",
        updated_at: transaction.updated_at?.toISOString().slice(0, 10) || "",
      });
    }

    if (req.method === "PUT") {
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
          transaction_date: transaction_date
            ? new Date(transaction_date)
            : undefined,
          type,
          transaction_method,
          amount: amount !== "" ? Number(amount) : null,
          category,
          description,
          project_id: project_id !== "" ? Number(project_id) : null,
          vendor_id: vendor_id !== "" ? Number(vendor_id) : null,
        },
      });

      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      await prisma.financial_transactions.delete({
        where: { transaction_id: id },
      });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
