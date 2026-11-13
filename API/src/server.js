import { config } from './config.js';
import { createDatabase } from './db/client.js';
import { createApp } from './app.js';

const { db } = createDatabase(config.databaseUrl);
const app = createApp(db);

app.listen(config.port, () => {
  console.log(`[api] listening on http://localhost:${config.port}`);
  console.log(`[api] allowing browser origins: ${config.corsOrigins.join(', ')}`);
});
