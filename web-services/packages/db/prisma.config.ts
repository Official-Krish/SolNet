import { defineConfig } from "@prisma/config";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, ".env") });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
