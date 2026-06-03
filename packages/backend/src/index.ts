import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

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

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});

export default app;
