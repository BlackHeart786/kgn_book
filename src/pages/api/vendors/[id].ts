import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/dbConnect";
import { checkPermission } from "../../../lib/permissions";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Decimal } from "@prisma/client/runtime/library";
import Joi from "joi";

// Joi schema for validating PUT request body for Vendors
const vendorUpdateSchema = Joi.object({
  vendor_name: Joi.string().trim().min(2).max(255).optional(),
  gst_no: Joi.string().trim().max(15).optional().allow(null, ''),
  email: Joi.string().email().trim().max(255).optional().allow(null, ''),
  phone: Joi.string().trim().max(20).optional().allow(null, ''),
  address: Joi.string().trim().max(500).optional().allow(null, ''),
  bank_name: Joi.string().trim().max(255).optional().allow(null, ''),
  bank_account_number: Joi.string().trim().max(50).optional().allow(null, ''),
  ifsc_code: Joi.string().trim().max(11).optional().allow(null, ''),
  is_active: Joi.boolean().optional(),
});

/**
 * Recursively converts Prisma special types (BigInt, Decimal) to serializable formats
 */
function serializePrismaData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'bigint') {
    return data.toString() as any;
  }

  if (Decimal.isDecimal(data)) {
    return data.toNumber() as any;
  }

  if (Array.isArray(data)) {
    return data.map(serializePrismaData) as any;
  }

  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serializePrismaData((data as any)[key]);
      }
    }
    return result;
  }

  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "Invalid vendor ID provided." });
  }

  // Permission check for "vendor_edit"
  const { allowed, reason } = await checkPermission(req, res, "vendor_edit");
  if (!allowed) {
    const statusCode = reason === "unauthenticated" ? 401 : 403;
    const errorMessage = reason === "unauthenticated"
      ? "Authentication required."
      : "You do not have permission to perform this action.";
    return res.status(statusCode).json({ error: errorMessage });
  }

  try {
    switch (req.method) {
      case "GET":
        return await handleGetVendor(res, id);
      case "PUT":
        return await handleUpdateVendor(req, res, id);
      case "DELETE":
        return await handleDeleteVendor(res, id);
      default:
        return res.status(405).json({ error: `Method ${req.method} not allowed.` });
    }
  } catch (err) {
    handleError(err, res);
  }
}

async function handleGetVendor(res: NextApiResponse, id: number) {
  const vendor = await prisma.vendors.findUnique({
    where: { vendor_id: id },
  });

  if (!vendor) {
    return res.status(404).json({ error: "Vendor not found." });
  }

  console.log(`[API] Fetched Vendor ID ${id}`);

  // Convert all special Prisma types to serializable formats
  const serializedVendor = serializePrismaData({
    ...vendor,
    created_at: vendor.created_at?.toISOString(),
    updated_at: vendor.updated_at?.toISOString(),
  });

  return res.status(200).json(serializedVendor);
}

async function handleUpdateVendor(req: NextApiRequest, res: NextApiResponse, id: number) {
  const { error, value: validatedBody } = vendorUpdateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      error: "Validation failed.",
      details: error.details.map((detail) => ({
        field: detail.context?.label || detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  const updatedVendor = await prisma.vendors.update({
    where: { vendor_id: id },
    data: validatedBody,
  });

  console.log(`[API] Updated Vendor ID ${id}`);

  return res.status(200).json(serializePrismaData(updatedVendor));
}

async function handleDeleteVendor(res: NextApiResponse, id: number) {
  await prisma.vendors.delete({
    where: { vendor_id: id },
  });

  console.log(`[API] Deleted Vendor ID: ${id}`);
  return res.status(200).json({
    success: true,
    message: `Vendor with ID ${id} successfully deleted.`,
  });
}

function handleError(err: unknown, res: NextApiResponse) {
  console.error("[API Error]", err);

  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2025":
        return res.status(404).json({ error: "Vendor not found for the requested operation." });
      case "P2002":
        return res.status(409).json({
          error: "A vendor with this unique field already exists.",
          details: err.meta,
        });
      default:
        return res.status(500).json({
          error: "Database operation failed.",
          details: err.message,
        });
    }
  }

  return res.status(500).json({
    error: "An unexpected server error occurred.",
  });
}