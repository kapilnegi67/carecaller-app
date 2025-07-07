const express = require('express');
const cors = require('cors');
require('dotenv').config();

const CallScheduler = require('./services/CallScheduler');
const voiceRoutes = require('./routes/voice');

const app = express();
const PORT = process.env.PORT || 3001;

let globalScheduler = null;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/voice', voiceRoutes);

app.get('/api/debug/scheduler-status', (req, res) => {
  res.json({
    schedulerRunning: globalScheduler ? globalScheduler.isRunning : false,
    schedulerExists: !!globalScheduler,
    timestamp: new Date().toISOString(),
    pollInterval: globalScheduler ? globalScheduler.pollInterval : 'N/A'
  });
});

app.post('/api/debug/trigger-scheduler', async (req, res) => {
  try {
    if (!globalScheduler) {
      return res.status(500).json({ error: 'Scheduler not initialized' });
    }
    
    console.log('Manual scheduler trigger requested');
    await globalScheduler.checkScheduledCalls();
    
    res.json({
      success: true,
      message: 'Scheduler check triggered manually',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual scheduler trigger failed:', error);
    res.status(500).json({
      error: 'Scheduler trigger failed',
      message: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'CareCaller Backend',
    scheduler: {
      running: globalScheduler ? globalScheduler.isRunning : false,
      exists: !!globalScheduler
    }
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'CareCaller Backend Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      voice: '/api/voice/*'
    }
  });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`CareCaller Backend Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  try {
    globalScheduler = new CallScheduler();
    globalScheduler.start();
    console.log('✅ Call scheduler started successfully');
  } catch (error) {
    console.error('❌ Failed to start call scheduler:', error);
  }
  
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    if (globalScheduler) globalScheduler.stop();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    if (globalScheduler) globalScheduler.stop();
    process.exit(0);
  });
});

module.exports = app;
