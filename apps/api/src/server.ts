import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.port, env.host, () => {
  console.log(`Zaa API listening on http://${env.host}:${env.port}`);
});
