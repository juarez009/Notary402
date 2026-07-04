import { buildApp } from "./app.ts";

const port = Number(process.env.NOTARY402_API_PORT ?? 3001);
const host = process.env.NOTARY402_API_HOST ?? "0.0.0.0";

const app = buildApp();

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
