import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/dbConnect";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const invoices = await prisma.invoices.findMany({
        include: {
          invoice_items: true,
        },
        orderBy: {
          invoice_date: "desc",
        },
      });

      return res.status(200).json(invoices);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
