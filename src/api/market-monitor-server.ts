// Market Monitor Server - Handles automated market monitoring and resolution
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MarketMonitorService } from '../services/marketMonitorService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.MONITOR_PORT || 3002;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());

// Initialize market monitor service
const marketMonitor = new MarketMonitorService();

// API Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'BlockCast Market Monitor',
    timestamp: new Date().toISOString(),
    monitor: marketMonitor.getStatus()
  });
});

app.get('/status', (req, res) => {
  const status = marketMonitor.getStatus();
  res.json({
    service: 'Market Monitor Service',
    ...status,
    timestamp: new Date().toISOString()
  });
});

app.post('/run-once', async (req, res) => {
  try {
    const status = await marketMonitor.runOnce();
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run monitor once'
    });
  }
});

app.post('/start', (req, res) => {
  try {
    marketMonitor.start();
    res.json({
      success: true,
      message: 'Market monitor service started',
      status: marketMonitor.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start monitor'
    });
  }
});

app.post('/stop', (req, res) => {
  try {
    marketMonitor.stop();
    res.json({
      success: true,
      message: 'Market monitor service stopped',
      status: marketMonitor.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop monitor'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BlockCast Market Monitor Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Status endpoint: http://localhost:${PORT}/status`);

  // Start market monitoring automatically
  console.log(`🔄 Auto-starting market monitor service...`);
  marketMonitor.start();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Market Monitor Server...');
  marketMonitor.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Market Monitor Server...');
  marketMonitor.stop();
  process.exit(0);
});

export default app;