const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// Get Settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: 'default' });

    if (!settings) {
      settings = new Settings({ userId: 'default' });
      await settings.save();
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Settings
router.put('/', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: 'default' },
      req.body,
      { new: true, upsert: true }
    );
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Capital Settings
router.put('/capital', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: 'default' },
      { capital: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: settings.capital });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Broker Settings
router.put('/broker', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: 'default' },
      { broker: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: settings.broker });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Telegram Settings
router.put('/telegram', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: 'default' },
      { telegram: req.body },
      { new: true, upsert: true }
    );

    // Test Telegram
    if (req.body.botToken && req.body.chatId) {
      try {
        const { Telegraf } = require('telegraf');
        const bot = new Telegraf(req.body.botToken);
        await bot.telegram.sendMessage(req.body.chatId, '✅ F&O Trading System Connected!');
        res.json({ success: true, data: settings.telegram, telegramTest: 'Message sent!' });
      } catch (e) {
        res.json({ success: true, data: settings.telegram, telegramTest: 'Failed: ' + e.message });
      }
    } else {
      res.json({ success: true, data: settings.telegram });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Watchlist
router.put('/watchlist', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: 'default' },
      { watchlist: req.body.watchlist },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: settings.watchlist });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Trading Hours
router.put('/trading-hours', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: 'default' },
      { tradingHours: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: settings.tradingHours });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Backup Data
router.get('/backup', async (req, res) => {
  try {
    const Suggestion = require('../models/Suggestion');
    const Trade = require('../models/Trade');
    const Alert = require('../models/Alert');
    const News = require('../models/News');
    const FiiDii = require('../models/FiiDii');

    const backup = {
      exportDate: new Date(),
      settings: await Settings.findOne({ userId: 'default' }),
      suggestions: await Suggestion.find(),
      trades: await Trade.find(),
      alerts: await Alert.find(),
      news: await News.find().limit(500),
      fiiDii: await FiiDii.find().limit(90)
    };

    res.json({ success: true, data: backup });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Restore Data
router.post('/restore', async (req, res) => {
  try {
    const { settings, suggestions, trades } = req.body;

    if (settings) {
      await Settings.findOneAndUpdate({ userId: 'default' }, settings, { upsert: true });
    }

    let restored = { settings: !!settings, suggestions: 0, trades: 0 };

    if (suggestions && suggestions.length > 0) {
      const Suggestion = require('../models/Suggestion');
      for (let s of suggestions) {
        await Suggestion.findOneAndUpdate({ suggestionId: s.suggestionId }, s, { upsert: true });
        restored.suggestions++;
      }
    }

    if (trades && trades.length > 0) {
      const Trade = require('../models/Trade');
      for (let t of trades) {
        await Trade.findOneAndUpdate({ tradeId: t.tradeId }, t, { upsert: true });
        restored.trades++;
      }
    }

    res.json({ success: true, message: 'Data restored', restored });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;