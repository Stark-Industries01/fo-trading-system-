const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fo-trading')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err));

// Make io accessible to routes
app.set('io', io);

// Import Routes
const marketRoutes = require('./routes/market');
const optionChainRoutes = require('./routes/optionChain');
const technicalRoutes = require('./routes/technical');
const fiiDiiRoutes = require('./routes/fiiDii');
const suggestionRoutes = require('./routes/suggestion');
const tradeRoutes = require('./routes/trade');
const alertRoutes = require('./routes/alert');
const newsRoutes = require('./routes/news');
const analyticsRoutes = require('./routes/analytics');
const settingsRoutes = require('./routes/settings');

// Use Routes
app.use('/api/market', marketRoutes);
app.use('/api/option-chain', optionChainRoutes);
app.use('/api/technical', technicalRoutes);
app.use('/api/fii-dii', fiiDiiRoutes);
app.use('/api/suggestion', suggestionRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/alert', alertRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// Serve React Build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Socket Connection
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('subscribe', (channel) => {
    socket.join(channel);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Start Cron Jobs
const CronJobs = require('./services/cronJobs');
const cronJobs = new CronJobs(io);
cronJobs.startAll();

// Start Telegram Bot
const telegramBot = require('./services/telegramBot');
telegramBot.initialize();

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'F&O Trading System Running!',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   🚀 F&O Trading System Started!     ║
  ║   📡 Port: ${PORT}                       ║
  ║   📊 30 Modules Active               ║
  ║   ✅ Ready to Trade!                  ║
  ╚═══════════════════════════════════════╝
  `);
});

module.exports = { app, io };