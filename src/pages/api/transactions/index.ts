import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/dbConnect";
import { checkPermission } from "../../../lib/permissions";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Check permissions properly
  const { allowed, reason } = await checkPermission(req, res, "financial_view");

  if (!allowed) {
    return res
      .status(reason === "unauthenticated" ? 401 : 403)
      .json({
        error:
          reason === "unauthenticated"
            ? "Authentication required."
            : "You do not have permission to view transactions.",
      });
  }

  const { keyword = "", date = "", page = "1" } = req.query;
  const currentPage = Number(page);
  const itemsPerPage = 10;

  if (isNaN(currentPage) || currentPage < 1) {
    return res.status(400).json({ error: "Invalid page number." });
  }

  const whereClause: any = {};

  if (keyword) {
    whereClause.OR = [
      { description: { contains: keyword.toString(), mode: "insensitive" } },
      { category: { contains: keyword.toString(), mode: "insensitive" } },
    ];
  }

  if (date) {
    const parsedDate = new Date(date.toString());
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format." });
    }
    whereClause.transaction_date = parsedDate;
  }

  try {
    const total = await prisma.financial_transactions.count({
      where: whereClause,
    });

    const transactions = await prisma.financial_transactions.findMany({
      where: whereClause,
      orderBy: {
        transaction_date: "desc",
      },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
    });

    return res.status(200).json({
      transactions,
      currentPage,
      totalPages: Math.ceil(total / itemsPerPage),
    });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({
      error: "Failed to fetch transactions.",
      details: error.message,
    });
  }
}
