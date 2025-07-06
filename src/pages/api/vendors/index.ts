import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/dbConnect';
import { checkPermission } from '../../../lib/permissions';

// Helper: BigInt and Prisma.Decimal serializer
function replacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (
    value &&
    typeof value === 'object' &&
    'toNumber' in value &&
    typeof (value as any).toNumber === 'function'
  ) {
    return (value as any).toNumber();
  }
  return value;
}

// GET /api/vendors
async function handleGetVendors(req: NextApiRequest, res: NextApiResponse) {
  const { allowed } = await checkPermission(req, res, 'vendor_view');
  if (!allowed) return;

  const { id, name } = req.query;

  try {
    let result;

    if (id) {
      const vendorId = parseInt(id as string);
      if (isNaN(vendorId)) {
        return res.status(400).json({ error: 'Invalid vendor ID.' });
      }

      result = await prisma.vendors.findUnique({
        where: { vendor_id: vendorId },
      });

      if (!result) {
        return res.status(404).json({ error: `Vendor with ID ${vendorId} not found.` });
      }
    } else if (name) {
      result = await prisma.vendors.findMany({
        where: {
          vendor_name: { contains: name as string, mode: 'insensitive' },
        },
        orderBy: { created_at: 'desc' },
      });

      if (result.length === 0) {
        return res.status(404).json({ error: `No vendors found matching "${name}".` });
      }
    } else {
      result = await prisma.vendors.findMany({ orderBy: { created_at: 'desc' } });
    }

    res.status(200).json(JSON.parse(JSON.stringify(result, replacer)));
  } catch (error: any) {
    console.error('Error in GET /vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors.', details: error.message });
  }
}

// POST /api/vendors
async function handlePostVendor(req: NextApiRequest, res: NextApiResponse) {
  const { allowed } = await checkPermission(req, res, 'vendor_edit');
  if (!allowed) return;

  const {
    vendor_name,
    gst_no,
    vendor_type,
    email,
    phone,
    address,
    bank_name,
    bank_account_number,
    ifsc_code,
    is_active,
    created_by,
    payables,
  } = req.body;

  if (!vendor_name || !email) {
    return res.status(400).json({ error: 'Vendor name and email are required.' });
  }

  try {
    const newVendor = await prisma.vendors.create({
      data: {
        vendor_name,
        gst_no,
        vendor_type,
        email,
        phone: phone || null,
        address,
        bank_name,
        bank_account_number,
        ifsc_code,
        is_active: typeof is_active === 'boolean' ? is_active : true,
        created_by: created_by ? parseInt(created_by) : null,
        payables: payables ? parseFloat(payables) : null,
      },
    });

    res.status(201).json(JSON.parse(JSON.stringify(newVendor, replacer)));
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Vendor with this name or email already exists.',
      });
    }

    console.error('Error in POST /vendors:', error);
    res.status(500).json({ error: 'Failed to create vendor.', details: error.message });
  }
}

// Main API handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      await handleGetVendors(req, res);
      break;
    case 'POST':
      await handlePostVendor(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
