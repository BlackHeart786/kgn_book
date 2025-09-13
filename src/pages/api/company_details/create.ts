import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/dbConnect';
import { checkPermission } from '../../../lib/permissions';
import { IncomingForm, File } from 'formidable';
import fs from 'fs/promises'; // Use the promise-based fs module

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Check permissions
    const { allowed, reason } = await checkPermission(req, res, 'edit_company_details');
    if (!allowed) {
      return res.status(reason === 'unauthenticated' ? 401 : 403).json({
        error: reason === 'unauthenticated'
          ? 'Authentication required.'
          : 'You do not have permission to create company details.',
      });
    }

    const form = new IncomingForm();

    const { fields, files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          return reject(err);
        }
        resolve({ fields, files });
      });
    });

    let logoBuffer = null;
    const logoFile = files.logo?.[0] as File | undefined; // Access the file and type it correctly
    
    if (logoFile) {
      logoBuffer = await fs.readFile(logoFile.filepath);
      await fs.unlink(logoFile.filepath); // Use the promise-based unlink to clean up the temp file
    }

    // Correctly handle the fields, which are now arrays
    const company_name = fields.company_name?.[0];
    const address = fields.address?.[0];
    const city = fields.city?.[0];
    const state = fields.state?.[0];
    const pin_code = fields.pin_code?.[0];
    const country = fields.country?.[0];
    const phone = fields.phone?.[0];
    const email = fields.email?.[0];
    const gst_no = fields.gst_no?.[0];
    const registration_number = fields.registration_number?.[0];
    const is_own_company = fields.is_own_company?.[0] === 'true';

    // Create company
    const company = await prisma.company_details.create({
      data: {
        company_name,
        address,
        city,
        state,
        pin_code,
        country,
        phone,
        email,
        gst_no,
        registration_number,
        logo: logoBuffer,
        is_own_company,
      },
    });

    return res.status(201).json({
      ...company,
      logo: company.logo ? 'Logo uploaded' : null,
    });

  } catch (error) {
    console.error('Failed to create company:', error);
    return res.status(500).json({ error: 'Failed to create company' });
  }
}