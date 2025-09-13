// src/pages/api/company_details/update.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/dbConnect";
import { checkPermission } from "../../../lib/permissions";
import { IncomingForm, File } from 'formidable';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false, // Must be disabled for file uploads
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Permission check for editing company details
  const { allowed, reason } = await checkPermission(req, res, "edit_company_details");

  if (!allowed) {
    return res
      .status(reason === "unauthenticated" ? 401 : 403)
      .json({
        error:
          reason === "unauthenticated"
            ? "Authentication required."
            : "You do not have permission to edit company details.",
      });
  }

  try {
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

    // Find the first company record to update
    const company = await prisma.company_details.findFirst();
    if (!company) {
      return res.status(404).json({ error: "Company details not found." });
    }

    let logoBuffer = null;
    const logoFile = files.logo?.[0] as File | undefined;

    // Check if a new logo file was provided
    if (logoFile) {
      logoBuffer = await fs.readFile(logoFile.filepath);
      await fs.unlink(logoFile.filepath); // Clean up the temporary file
    }

    // Prepare the data for the update, handling potential undefined fields
    const dataToUpdate: any = {};
    if (fields.company_name?.[0]) dataToUpdate.company_name = fields.company_name[0];
    if (fields.address?.[0]) dataToUpdate.address = fields.address[0];
    if (fields.city?.[0]) dataToUpdate.city = fields.city[0];
    if (fields.state?.[0]) dataToUpdate.state = fields.state[0];
    if (fields.pin_code?.[0]) dataToUpdate.pin_code = fields.pin_code[0];
    if (fields.country?.[0]) dataToUpdate.country = fields.country[0];
    if (fields.phone?.[0]) dataToUpdate.phone = fields.phone[0];
    if (fields.email?.[0]) dataToUpdate.email = fields.email[0];
    if (fields.gst_no?.[0]) dataToUpdate.gst_no = fields.gst_no[0];
    if (fields.registration_number?.[0]) dataToUpdate.registration_number = fields.registration_number[0];
    if (fields.is_own_company?.[0]) dataToUpdate.is_own_company = fields.is_own_company[0] === 'true';

    // Conditionally add the new logo buffer
    if (logoBuffer !== null) {
      dataToUpdate.logo = logoBuffer;
    }

    // Add the update timestamp
    dataToUpdate.updated_at = new Date();

    // Use update() with a unique identifier from the found company
    const updatedCompany = await prisma.company_details.update({
      where: { id: company.id },
      data: dataToUpdate,
    });

    return res.status(200).json({
      ...updatedCompany,
      logo: updatedCompany.logo ? 'Logo updated' : null,
    });
  } catch (error: any) {
    console.error("Error updating company details:", error);
    return res.status(500).json({
      error: "Failed to update company details.",
      details: error.message,
    });
  }
}