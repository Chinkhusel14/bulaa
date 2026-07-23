import { buildApp } from "./app";
import { loadEnv } from "./config/env";

async function main() {
  const env = loadEnv();
  const app = await buildApp(env);

  await app.listen({ port: env.PORT, host: env.HOST });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
