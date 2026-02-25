const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const Settings = require('../models/Settings');

// Create Alert
router.post('/create', async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();

    const io = req.app.get('io');
    if (io) io.emit('newAlert', alert);

    // Telegram
    const settings = await Settings.findOne({ userId: 'default' });
    if (settings && settings.telegram && settings.telegram.enabled) {
      try {
        const { Telegraf } = require('telegraf');
        const bot = new Telegraf(settings.telegram.botToken);
        const emoji = alert.severity === 'HIGH' ? '🔴' : alert.severity === 'MEDIUM' ? '🟡' : '🟢';
        await bot.telegram.sendMessage(settings.telegram.chatId,
          `${emoji} ALERT: ${alert.message}\nType: ${alert.alertType}\nSeverity: ${alert.severity}`
        );
        alert.sentViaTelegram = true;
        await alert.save();
      } catch (e) {
        console.log('Telegram failed:', e.message);
      }
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get All Alerts
router.get('/all', async (req, res) => {
  try {
    const { type, severity, isRead } = req.query;
    let query = {};
    if (type) query.alertType = type;
    if (severity) query.severity = severity;
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const alerts = await Alert.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Unread Alerts
router.get('/unread', async (req, res) => {
  try {
    const alerts = await Alert.find({ isRead: false }).sort({ createdAt: -1 });
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark Alert as Read
router.put('/read/:id', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark All as Read
router.put('/read-all', async (req, res) => {
  try {
    await Alert.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete Old Alerts
router.delete('/cleanup', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await Alert.deleteMany({ createdAt: { $lt: thirtyDaysAgo }, isRead: true });
    res.json({ success: true, message: 'Old alerts cleaned up' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Price Alert Check
router.post('/check-price', async (req, res) => {
  try {
    const { index, currentPrice } = req.body;

    const pendingAlerts = await Alert.find({
      alertType: 'PRICE',
      index,
      isTriggered: false
    });

    const triggered = [];
    for (let alert of pendingAlerts) {
      let shouldTrigger = false;
      if (alert.condition === 'ABOVE' && currentPrice >= alert.triggerValue) shouldTrigger = true;
      if (alert.condition === 'BELOW' && currentPrice <= alert.triggerValue) shouldTrigger = true;

      if (shouldTrigger) {
        alert.isTriggered = true;
        alert.triggeredAt = new Date();
        alert.currentValue = currentPrice;
        await alert.save();
        triggered.push(alert);

        const io = req.app.get('io');
        if (io) io.emit('alertTriggered', alert);
      }
    }

    res.json({ success: true, triggered: triggered.length, alerts: triggered });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;