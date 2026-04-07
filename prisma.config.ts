import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const directUrl = (process.env.DIRECT_URL ?? "")
  .trim()
  .replace(/^["']|["']$/g, "")
  .trim();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  datasource: {
    url: directUrl,
  },
});
