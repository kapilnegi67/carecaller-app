const express = require('express');
const cors = require('cors');
require('dotenv').config();

const CallScheduler = require('./services/CallScheduler');
const voiceRoutes = require('./routes/voice');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/voice', voiceRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'CareCaller Backend'
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
  
  const scheduler = new CallScheduler();
  scheduler.start();
  
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    scheduler.stop();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    scheduler.stop();
    process.exit(0);
  });
});

module.exports = app;
