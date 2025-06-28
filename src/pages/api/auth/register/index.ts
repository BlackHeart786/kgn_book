// /pages/api/auth/register.ts

import { NextApiRequest, NextApiResponse } from 'next/types';
import prisma from '../../../../lib/dbConnect'; 
import bcrypt from "bcrypt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { full_name, username, email, password } = req.body;

  if (!full_name || !username || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Check if email or username is already in use
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email or username already in use" });
    }

    // Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    // Create the user
    await prisma.users.create({
      data: {
        full_name,
        username,
        email,
        password_hash,
        is_active: true, // 👈 Optional: you can require email verification instead
      },
    });

    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}