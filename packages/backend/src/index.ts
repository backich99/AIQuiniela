import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { syncResults } from './services/espnSync.js';

const app = express();
const PORT = process.env.PORT || 3001;
// CORS: allow all origins
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', router);

// Global error handler (must be after all routes)
app.use(errorHandler);

// Auto-sync ESPN results every 5 minutes
setInterval(() => {
  syncResults()
    .then((r) => { if (r.synced.length > 0) console.log('⚽ Synced:', r.synced); })
    .catch((err) => console.error('ESPN sync error:', err.message));
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  // Run sync once on startup
  syncResults()
    .then((r) => { if (r.synced.length > 0) console.log('⚽ Synced on startup:', r.synced); })
    .catch((err) => console.error('ESPN sync error:', err.message));
});

export default app;
