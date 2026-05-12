import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

// Single source of truth: monorepo root .env feeds both CLI and runtime.
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Check the monorepo root .env file.",
  );
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: connectionString,
  },
  adapter: async () => new PrismaPg({ connectionString }),
});
