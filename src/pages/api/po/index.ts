import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/dbConnect";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const purchaseOrder = await prisma.purchase_orders.findMany({
        include: {
          purchase_order_items: true,
        },
        orderBy: {
          order_date: "desc",
        },
      });

      return res.status(200).json(purchaseOrder);
    } catch (error: any) {
      console.error("Error fetching purchaseOrder:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
