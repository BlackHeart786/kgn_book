import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/dbConnect";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (req.method === "GET") {
      const invoice = await prisma.invoices.findUnique({
        where: { id: parseInt(id as string) },
        include: { invoice_items: true },
      });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      return res.status(200).json(invoice);
    }

    if (req.method === "DELETE") {
      const deletedInvoice = await prisma.invoices.delete({
        where: { id: parseInt(id as string) },
      });

      return res
        .status(200)
        .json({ message: "Invoice deleted successfully", deletedInvoice });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Error handling invoice:", error);
    return res.status(500).json({ error: error.message });
  }
}
