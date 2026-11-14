import { config } from './config.js';
import { createDatabase } from './db/client.js';
import { createApp } from './app.js';
import { createSmsSender } from './sms/index.js';

const { db } = createDatabase(config.databaseUrl);
const sms = createSmsSender();
const app = createApp(db, { sms });

app.listen(config.port, () => {
  console.log(`[api] listening on http://localhost:${config.port}`);
  console.log(`[api] allowing browser origins: ${config.corsOrigins.join(', ')}`);
  console.log(
    sms
      ? `[api] referral SMS via ${sms.name}`
      : '[api] referral SMS is not configured (SMS_PROVIDER unset) - referral links cannot be sent',
  );
});
