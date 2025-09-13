import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/dbConnect";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const {
        customer_id,
        customer_name,
        customer_address,
        invoice_number,
        invoice_date,
        due_date,
        payment_terms,
        status,
        memo,
        discount,
        shipping_cost,
        subtotal,
        total_amount,
        currency,
        invoice_items,
      } = req.body;

      // Creating invoice with items in one go
      const invoice = await prisma.invoices.create({
        data: {
          customer_id,
          customer_name,
          customer_address,
          invoice_number,
          invoice_date: new Date(invoice_date),
          due_date: new Date(due_date),
          payment_terms,
          status,
          memo,
          discount,
          shipping_cost,
          subtotal,
          total_amount,
          currency,
          invoice_items: {
            create: invoice_items.map((item: any) => ({
              product_name: item.product_name,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
              total_amount: item.total_amount,
            })),
          },
        },
        include: {
          invoice_items: true,
        },
      });

      return res.status(201).json(invoice);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
