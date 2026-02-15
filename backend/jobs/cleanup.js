const Upload = require('../models/Upload');
const cron = require('node-cron');

/**
 * Runs every minute – purges expired / used-up uploads from
 * both the database and the local filesystem.
 */
function startCleanupJob() {
  cron.schedule('* * * * *', () => {
    try {
      const expired = Upload.findExpired();
      if (expired.length === 0) return;
      const count = Upload.purge(expired);
      console.log(`[Cleanup] Purged ${count} expired upload(s).`);
    } catch (err) {
      console.error('[Cleanup] Error during purge:', err);
    }
  });

  console.log('[Cleanup] Background cleanup job scheduled (every minute).');
}

module.exports = { startCleanupJob };
