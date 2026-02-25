const express = require('express');
const router = express.Router();
const OptionChain = require('../models/OptionChain');

// Get Live Option Chain
router.get('/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const { expiry } = req.query;

    let query = { index };
    if (expiry) query.expiryDate = new Date(expiry);

    const data = await OptionChain.findOne(query).sort({ fetchedAt: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Max Pain
router.get('/maxpain/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const data = await OptionChain.findOne({ index }).sort({ fetchedAt: -1 });

    if (!data) return res.json({ success: false, message: 'No data' });

    let maxPainStrike = 0;
    let minPain = Infinity;

    data.strikes.forEach(strike => {
      let pain = 0;
      data.strikes.forEach(s => {
        if (s.strikePrice < strike.strikePrice) {
          pain += s.ce.oi * (strike.strikePrice - s.strikePrice);
        }
        if (s.strikePrice > strike.strikePrice) {
          pain += s.pe.oi * (s.strikePrice - strike.strikePrice);
        }
      });
      if (pain < minPain) {
        minPain = pain;
        maxPainStrike = strike.strikePrice;
      }
    });

    res.json({ success: true, maxPain: maxPainStrike, spotPrice: data.spotPrice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get PCR
router.get('/pcr/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const data = await OptionChain.findOne({ index }).sort({ fetchedAt: -1 });

    if (!data) return res.json({ success: false });

    const pcr = data.totalPEOI / data.totalCEOI;
    let signal = 'NEUTRAL';
    if (pcr > 1.2) signal = 'BULLISH';
    else if (pcr < 0.8) signal = 'BEARISH';

    res.json({
      success: true,
      pcr: pcr.toFixed(2),
      signal,
      totalCEOI: data.totalCEOI,
      totalPEOI: data.totalPEOI
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get OI Analysis
router.get('/oi-analysis/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const data = await OptionChain.findOne({ index }).sort({ fetchedAt: -1 });

    if (!data) return res.json({ success: false });

    let highestCEOI = { strike: 0, oi: 0 };
    let highestPEOI = { strike: 0, oi: 0 };
    let oiSpurts = [];

    data.strikes.forEach(strike => {
      if (strike.ce.oi > highestCEOI.oi) {
        highestCEOI = { strike: strike.strikePrice, oi: strike.ce.oi };
      }
      if (strike.pe.oi > highestPEOI.oi) {
        highestPEOI = { strike: strike.strikePrice, oi: strike.pe.oi };
      }
      if (Math.abs(strike.ce.oiChange) > 500000 || Math.abs(strike.pe.oiChange) > 500000) {
        oiSpurts.push({
          strike: strike.strikePrice,
          ceOIChange: strike.ce.oiChange,
          peOIChange: strike.pe.oiChange
        });
      }
    });

    res.json({
      success: true,
      resistance: highestCEOI,
      support: highestPEOI,
      oiSpurts,
      spotPrice: data.spotPrice
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get IV Analysis
router.get('/iv-analysis/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const data = await OptionChain.findOne({ index }).sort({ fetchedAt: -1 });

    if (!data) return res.json({ success: false });

    const atmStrike = data.strikes.reduce((prev, curr) => {
      return Math.abs(curr.strikePrice - data.spotPrice) < Math.abs(prev.strikePrice - data.spotPrice) ? curr : prev;
    });

    const atmIV = (atmStrike.ce.iv + atmStrike.pe.iv) / 2;
    const straddlePrice = atmStrike.ce.ltp + atmStrike.pe.ltp;
    const expectedMove = straddlePrice;
    const expectedRange = {
      upper: data.spotPrice + expectedMove,
      lower: data.spotPrice - expectedMove
    };

    res.json({
      success: true,
      atmIV,
      straddlePrice,
      expectedMove,
      expectedRange,
      spotPrice: data.spotPrice
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save Option Chain Data
router.post('/save', async (req, res) => {
  try {
    const optionChain = new OptionChain(req.body);
    await optionChain.save();
    res.json({ success: true, message: 'Option chain saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;