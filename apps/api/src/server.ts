import { buildApp } from "./app.js";

const app = buildApp();
const port = Number(process.env.API_PORT || 3001);

await app.listen({ port, host: "0.0.0.0" });
console.log(`Notary402 API listening on http://localhost:${port}`);
