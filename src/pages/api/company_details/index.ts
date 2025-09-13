import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/dbConnect';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const company = await prisma.company_details.findFirst();

      if (!company) {
        return res.status(404).json({ error: 'Company details not found' });
      }

      // Convert the logo Buffer to a base64 string if it exists
      let logoBase64 = null;
      if (company.logo) {
        logoBase64 = `data:image/jpeg;base64,${Buffer.from(company.logo).toString('base64')}`;
      }

      // Return all company data with the logo as base64
      return res.status(200).json({
        ...company,
        logo: logoBase64
      });
      
    } catch (error) {
      console.error('Failed to fetch company details:', error);
      return res.status(500).json({ error: 'Failed to fetch company details' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}