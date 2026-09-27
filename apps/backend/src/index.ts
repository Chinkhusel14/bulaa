import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app";
import { loadEnv } from "./config/env";

function loadDotEnv() {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");
  if (!existsSync(envPath)) {
    return;
  }
  process.loadEnvFile(envPath);
}

async function main() {
  loadDotEnv();
  const env = loadEnv();
  const app = await buildApp(env);

  await app.listen({ port: env.PORT, host: env.HOST });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
