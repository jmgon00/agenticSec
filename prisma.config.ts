import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import path from "path";

// Load .env.local explicitly (for local development)
const envPath = path.join(process.cwd(), ".env.local");
const result = config({ path: envPath });

if (result.error) {
  // Fallback if .env.local doesn't exist
  config({ path: ".env" });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] || "file:./prisma/dev.db",
  },
});
