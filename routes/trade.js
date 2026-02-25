const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const Settings = require('../models/Settings');

// Generate Trade ID
function generateTradeId() {
  const now = new Date();
  return 'TRD-' + now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + '-' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
}

// Create New Trade
router.post('/create', async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: 'default' });
    const tradeData = req.body;

    // Risk Check
    if (settings) {
      const riskAmount = (tradeData.entryPrice - tradeData.stopLoss) * tradeData.totalQuantity;
      const maxRisk = settings.capital.totalCapital * (settings.capital.maxRiskPerTrade / 100);

      if (riskAmount > maxRisk) {
        return res.json({
          success: false,
          message: `Risk ₹${riskAmount} exceeds max ₹${maxRisk}. Reduce lot size.`
        });
      }
    }

    const trade = new Trade({
      ...tradeData,
      tradeId: generateTradeId(),
      status: 'OPEN'
    });

    await trade.save();
    res.json({ success: true, message: 'Trade created', data: trade });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Trade (Exit)
router.put('/close/:tradeId', async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { exitPrice, exitReason, journal } = req.body;

    const trade = await Trade.findOne({ tradeId });
    if (!trade) return res.json({ success: false, message: 'Trade not found' });

    trade.exitPrice = exitPrice;
    trade.exitTime = new Date();
    trade.exitReason = exitReason;
    trade.status = 'CLOSED';

    // P&L Calculation
    trade.pnlAmount = (exitPrice - trade.entryPrice) * trade.totalQuantity;
    trade.pnlPercentage = ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
    trade.netPnl = trade.pnlAmount - (trade.charges || 0);

    if (journal) trade.journal = journal;

    await trade.save();

    const io = req.app.get('io');
    if (io) io.emit('tradeClosed', trade);

    res.json({ success: true, message: 'Trade closed', data: trade });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get All Trades
router.get('/all', async (req, res) => {
  try {
    const { status, from, to, strategy, index } = req.query;
    let query = {};

    if (status) query.status = status;
    if (index) query.index = index;
    if (strategy) query.strategy = strategy;
    if (from || to) {
      query.dateTime = {};
      if (from) query.dateTime.$gte = new Date(from);
      if (to) query.dateTime.$lte = new Date(to);
    }

    const trades = await Trade.find(query).sort({ dateTime: -1 });
    res.json({ success: true, count: trades.length, data: trades });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Open Trades
router.get('/open', async (req, res) => {
  try {
    const trades = await Trade.find({ status: 'OPEN' }).sort({ dateTime: -1 });
    res.json({ success: true, count: trades.length, data: trades });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Trade Detail
router.get('/:tradeId', async (req, res) => {
  try {
    const trade = await Trade.findOne({ tradeId: req.params.tradeId });
    if (!trade) return res.json({ success: false, message: 'Not found' });
    res.json({ success: true, data: trade });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add Journal Entry
router.put('/journal/:tradeId', async (req, res) => {
  try {
    const trade = await Trade.findOneAndUpdate(
      { tradeId: req.params.tradeId },
      { journal: req.body },
      { new: true }
    );
    res.json({ success: true, data: trade });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Daily P&L Summary
router.get('/summary/daily', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trades = await Trade.find({
      exitTime: { $gte: today },
      status: 'CLOSED'
    });

    let totalPnl = 0, wins = 0, losses = 0;
    trades.forEach(t => {
      totalPnl += t.netPnl;
      if (t.netPnl > 0) wins++;
      else losses++;
    });

    res.json({
      success: true,
      summary: {
        totalTrades: trades.length,
        wins, losses,
        winRate: trades.length > 0 ? (wins / trades.length * 100).toFixed(1) : 0,
        totalPnl: totalPnl.toFixed(2),
        date: today
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;