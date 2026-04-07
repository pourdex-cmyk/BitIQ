import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { getEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getConnectionString() {
  const candidates = [
    getEnv("DATABASE_URL"),
    getEnv("POSTGRES_PRISMA_URL"),
    getEnv("POSTGRES_URL"),
    getEnv("DIRECT_URL"),
    getEnv("POSTGRES_URL_NON_POOLING"),
  ];

  const connectionString = candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0
  );

  if (!connectionString) {
    throw new Error(
      "Missing Postgres connection string. Set DATABASE_URL, POSTGRES_PRISMA_URL, POSTGRES_URL, DIRECT_URL, or POSTGRES_URL_NON_POOLING."
    );
  }

  return connectionString;
}

function createPrismaClient() {
  const connectionString = getConnectionString();
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
