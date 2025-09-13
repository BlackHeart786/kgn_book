import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/dbConnect";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
 console.log("backed data",req.body);
 
  try {
    const {
      vendor_id,
      po_number,
      order_date,
      expected_delivery,
      billing_address,
      status,
      memo,
      discount,
      shipping_cost,
      subtotal,
      total_amount,
      currency,
      purchase_order_items,
    } = req.body;

    const po = await prisma.purchase_orders.create({
      data: {
        vendor_id,
        po_number,
        order_date: order_date ? new Date(order_date) : null,
        expected_delivery: expected_delivery ? new Date(expected_delivery) : null,
        billing_address,
        status,
        memo,
        discount,
        shipping_cost,
        subtotal,
        total_amount,
        currency,
        purchase_order_items: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          create: (purchase_order_items ?? []).map((item: any) => ({
            product_name: item.product_name,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            tax_rate: item.tax_rate,
            amount: item.amount,
            total_amount: item.total_amount,
          })),
        },
      },
      include: { purchase_order_items: true },
    });

    res.status(201).json(po);
  } catch (err: any) {
    console.error("Error creating purchase order:", err);
    res.status(500).json({ error: err?.message ?? "Internal Server Error" });
  }
}
