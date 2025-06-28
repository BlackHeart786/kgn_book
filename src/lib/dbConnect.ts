
import { PrismaClient } from "../generated/prisma";
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient; // Declared, but not necessarily assigned immediately

// Check if a PrismaClient instance already exists globally.
// If not, create a new one.
if (process.env.NODE_ENV === "production") {
  try {
    prisma = new PrismaClient(); // Assignment happens here
    console.log("Prisma Client connected successfully in production.");
  } catch (error) {
    console.error("Error connecting Prisma Client in production:", error);
    
    process.exit(1); // Exiting process if Prisma fails in production
  }
} else {
  // In development, use the global object to store the PrismaClient instance
  // to preserve it across hot-reloads.
  if (!global.prisma) {
    try {
      global.prisma = new PrismaClient();
      console.log(
        "Prisma Client connected successfully in development (new instance)."
      );
    } catch (error) {
      console.error(
        "Error connecting Prisma Client in development (new instance):",
        error
      );
      // In development, throwing the error is useful to see immediate feedback
      // and prevent further execution with a broken client.
      throw error;
    }
  } else {
    console.log("Prisma Client reused existing connection in development.");
  }
  prisma = global.prisma; // Assignment happens here (from global.prisma)
}

export default prisma;
