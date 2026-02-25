const express = require('express');
const router = express.Router();
const FiiDii = require('../models/FiiDii');

// Get Latest FII/DII Data
router.get('/latest', async (req, res) => {
  try {
    const data = await FiiDii.findOne().sort({ date: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get FII/DII History
router.get('/history', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));

    const data = await FiiDii.find({ date: { $gte: fromDate } }).sort({ date: 1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get FII Long/Short Ratio Trend
router.get('/fii-ratio', async (req, res) => {
  try {
    const data = await FiiDii.find().sort({ date: -1 }).limit(30);

    const trend = data.map(d => ({
      date: d.date,
      ratio: d.fii.longShortRatio,
      stance: d.fii.stance,
      netCash: d.fii.cashNet
    }));

    res.json({ success: true, trend: trend.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get FII Stance
router.get('/stance', async (req, res) => {
  try {
    const latest = await FiiDii.findOne().sort({ date: -1 });

    if (!latest) return res.json({ success: false });

    let stance = 'NEUTRAL';
    const fii = latest.fii;

    if (fii.cashNet > 0 && fii.indexFuturesNet > 0) stance = 'STRONG_BULLISH';
    else if (fii.cashNet > 0 || fii.indexFuturesNet > 0) stance = 'BULLISH';
    else if (fii.cashNet < 0 && fii.indexFuturesNet < 0) stance = 'STRONG_BEARISH';
    else if (fii.cashNet < 0 || fii.indexFuturesNet < 0) stance = 'BEARISH';

    res.json({
      success: true,
      stance,
      details: {
        cashNet: fii.cashNet,
        futuresNet: fii.indexFuturesNet,
        optionsNet: fii.indexOptionsNet,
        longShortRatio: fii.longShortRatio
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save FII/DII Data
router.post('/save', async (req, res) => {
  try {
    const fiiDii = new FiiDii(req.body);
    await fiiDii.save();
    res.json({ success: true, message: 'FII/DII data saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;