const express = require('express');
const router = express.Router();
const axios = require('axios');
const MarketData = require('../models/MarketData');

// Get Live Market Overview
router.get('/overview', async (req, res) => {
  try {
    const indices = [
      { symbol: 'NIFTY 50', key: 'NIFTY' },
      { symbol: 'NIFTY BANK', key: 'BANKNIFTY' },
      { symbol: 'NIFTY MID SELECT', key: 'MIDCPNIFTY' },
      { symbol: 'NIFTY FIN SERVICE', key: 'FINNIFTY' },
      { symbol: 'NIFTY IT', key: 'NIFTYIT' },
      { symbol: 'INDIA VIX', key: 'VIX' }
    ];

    const marketData = await MarketData.findOne().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: marketData,
      indices: indices
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Global Markets
router.get('/global', async (req, res) => {
  try {
    const latest = await MarketData.findOne().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: latest ? latest.globalMarkets : {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Pivot Points
router.get('/pivots/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const data = await MarketData.findOne({ index }).sort({ createdAt: -1 });
    res.json({
      success: true,
      pivots: data ? data.pivotPoints : {},
      cpr: data ? data.cpr : {},
      previousDay: data ? data.previousDay : {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Sector Heatmap
router.get('/sectors', async (req, res) => {
  try {
    const sectors = [
      'NIFTY BANK', 'NIFTY IT', 'NIFTY PHARMA', 'NIFTY AUTO',
      'NIFTY FMCG', 'NIFTY METAL', 'NIFTY REALTY', 'NIFTY ENERGY',
      'NIFTY INFRA', 'NIFTY MEDIA', 'NIFTY PSU BANK', 'NIFTY PVT BANK'
    ];
    res.json({ success: true, sectors: sectors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Advance/Decline Data
router.get('/breadth', async (req, res) => {
  try {
    const latest = await MarketData.findOne().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: latest ? latest.advanceDecline : {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save Market Data
router.post('/save', async (req, res) => {
  try {
    const marketData = new MarketData(req.body);
    await marketData.save();
    res.json({ success: true, message: 'Market data saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Historical Data
router.get('/history/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const { days = 30 } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));

    const data = await MarketData.find({
      index,
      date: { $gte: fromDate }
    }).sort({ date: 1 });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;