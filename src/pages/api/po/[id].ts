import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/dbConnect";

const asDate = (v: unknown) => (v ? new Date(String(v)) : null);
const asNumber = (v: unknown) =>
  v !== null && v !== undefined && v !== "" ? Number(v) : null;

function coerceId(raw: string | string[] | undefined) {
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id) return null;
  // Works for numeric PK or UUID/text PK
  const asNum = Number(id);
  return Number.isNaN(asNum) ? id : (asNum as any);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const poId = coerceId(req.query.id);
  if (poId === null) return res.status(400).json({ error: "Missing purchase order id" });

  try {
    if (req.method === "GET") {
      const po = await prisma.purchase_orders.findUnique({
        where: { id: poId },
        include: { purchase_order_items: true },
      });
      if (!po) return res.status(404).json({ error: "Purchase order not found" });
      return res.status(200).json(po);
    }

    if (req.method === "PUT") {
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
        // Each incoming item may include `id` for updates; absence => create
        purchase_order_items,
      } = req.body ?? {};

      const incoming: any[] = Array.isArray(purchase_order_items) ? purchase_order_items : [];

      // Fetch existing item ids for delete detection
      const existing = await prisma.purchase_order_items.findMany({
        where: { purchase_order_id: poId },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((x) => x.id));
      const incomingIds = new Set(incoming.filter((i) => i?.id != null).map((i) => i.id));
      const toDelete = [...existingIds].filter((x) => !incomingIds.has(x));

      // Build mutations
      const updateOps = incoming
        .filter((i) => i?.id != null)
        .map((i) =>
          prisma.purchase_order_items.update({
            where: { id: i.id },
            data: {
              product_name: i.product_name,
              description: i.description,
              quantity: asNumber(i.quantity),
              rate: asNumber(i.rate),
              tax_rate: asNumber(i.tax_rate),
              amount: asNumber(i.amount),
              total_amount: asNumber(i.total_amount),
            },
          })
        );

      const createOps = incoming
        .filter((i) => i?.id == null)
        .map((i) =>
          prisma.purchase_order_items.create({
            data: {
              purchase_order_id: poId,
              product_name: i.product_name,
              description: i.description,
              quantity: asNumber(i.quantity),
              rate: asNumber(i.rate),
              tax_rate: asNumber(i.tax_rate),
              amount: asNumber(i.amount),
              total_amount: asNumber(i.total_amount),
            },
          })
        );

      const deleteOps =
        toDelete.length > 0
          ? [prisma.purchase_order_items.deleteMany({ where: { id: { in: toDelete as any[] } } })]
          : [];

      // Run everything in a single transaction (header first)
      await prisma.$transaction([
        prisma.purchase_orders.update({
          where: { id: poId },
          data: {
            vendor_id,
            po_number,
            order_date: asDate(order_date),
            expected_delivery: asDate(expected_delivery),
            billing_address,
            status,
            memo,
            discount: asNumber(discount),
            shipping_cost: asNumber(shipping_cost),
            subtotal: asNumber(subtotal),
            total_amount: asNumber(total_amount),
            currency,
          },
        }),
        ...deleteOps,
        ...updateOps,
        ...createOps,
      ]);

      const fresh = await prisma.purchase_orders.findUnique({
        where: { id: poId },
        include: { purchase_order_items: true },
      });

      return res.status(200).json(fresh);
    }

    if (req.method === "DELETE") {
      // If your FK is ON DELETE CASCADE, you can delete the parent only.
      // Otherwise, delete children first:
      await prisma.$transaction([
        prisma.purchase_order_items.deleteMany({ where: { purchase_order_id: poId } }),
        prisma.purchase_orders.delete({ where: { id: poId } }),
      ]);
      return res.status(204).end();
    }

    res.setHeader("Allow", "GET, PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error(`[PO ${req.method}] Error:`, err);
    return res.status(500).json({ error: err?.message ?? "Internal Server Error" });
  }
}
