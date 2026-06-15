/**
 * Cron entry point for Render cron jobs.
 * Syncs ESPN World Cup results and exits.
 */
import 'dotenv/config';
import { syncResults } from '../src/services/espnSync.js';

const result = await syncResults();

if (result.synced.length > 0) {
  console.log('✅ Synced:', result.synced);
} else {
  console.log('ℹ️  No new results to sync.');
}

process.exit(0);
