import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";
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

function getPoolConfig(connectionString: string): PoolConfig {
  const poolConfig: PoolConfig = { connectionString };

  try {
    const connectionUrl = new URL(connectionString);
    const hostname = connectionUrl.hostname.toLowerCase();

    // Supabase pooler connections can present a certificate chain that Node
    // does not validate by default in serverless environments.
    if (
      hostname.endsWith(".supabase.co") ||
      hostname.endsWith(".supabase.com")
    ) {
      // Remove SSL query settings from the URL so pg uses the explicit `ssl`
      // config below instead of forcing stricter URL-derived defaults.
      connectionUrl.searchParams.delete("sslmode");
      connectionUrl.searchParams.delete("sslcert");
      connectionUrl.searchParams.delete("sslkey");
      connectionUrl.searchParams.delete("sslrootcert");
      poolConfig.connectionString = connectionUrl.toString();
      poolConfig.ssl = { rejectUnauthorized: false };
    }
  } catch {
    // Fall back to the raw connection string if parsing fails.
  }

  return poolConfig;
}

function createPrismaClient() {
  const connectionString = getConnectionString();
  const pool = new Pool(getPoolConfig(connectionString));
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
