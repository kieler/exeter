import { defineConfig } from "prisma/config";
import { loadEnv } from "./src/lib/env/load-env";

loadEnv(process.env.APP_ENV ?? null);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
