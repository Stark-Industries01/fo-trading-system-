const express = require('express');
const router = express.Router();
const Suggestion = require('../models/Suggestion');
const Trade = require('../models/Trade');

// Overall Suggestion Performance
router.get('/suggestion-performance', async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = {};
    if (from || to) {
      query.dateTime = {};
      if (from) query.dateTime.$gte = new Date(from);
      if (to) query.dateTime.$lte = new Date(to);
    }

    const all = await Suggestion.find(query);
    const total = all.length;

    if (total === 0) return res.json({ success: true, message: 'No suggestions yet' });

    let t1Hit = 0, t2Hit = 0, t3Hit = 0, slHit = 0, active = 0;
    let totalPnl = 0;
    let ceCount = 0, peCount = 0, ceWin = 0, peWin = 0;
    let highConf = 0, highConfWin = 0, medConf = 0, medConfWin = 0;

    all.forEach(s => {
      if (s.target1Hit) t1Hit++;
      if (s.target2Hit) t2Hit++;
      if (s.target3Hit) t3Hit++;
      if (s.stopLossHit) slHit++;
      if (s.status === 'ACTIVE') active++;
      totalPnl += s.pnlAmount || 0;

      if (s.optionType === 'CE') {
        ceCount++;
        if (s.target1Hit) ceWin++;
      } else {
        peCount++;
        if (s.target1Hit) peWin++;
      }

      if (s.confidenceLevel === 'HIGH') {
        highConf++;
        if (s.target1Hit) highConfWin++;
      } else {
        medConf++;
        if (s.target1Hit) medConfWin++;
      }
    });

    const closed = total - active;

    res.json({
      success: true,
      performance: {
        total,
        active,
        closed,
        target1: { hit: t1Hit, percentage: (t1Hit / total * 100).toFixed(1) },
        target2: { hit: t2Hit, percentage: (t2Hit / total * 100).toFixed(1) },
        target3: { hit: t3Hit, percentage: (t3Hit / total * 100).toFixed(1) },
        stopLoss: { hit: slHit, percentage: (slHit / total * 100).toFixed(1) },
        overallAccuracy: ((t1Hit / (closed || 1)) * 100).toFixed(1),
        totalPnl: totalPnl.toFixed(2),
        avgPnlPerSuggestion: (totalPnl / (closed || 1)).toFixed(2),
        ceAccuracy: ceCount > 0 ? ((ceWin / ceCount) * 100).toFixed(1) : '0',
        peAccuracy: peCount > 0 ? ((peWin / peCount) * 100).toFixed(1) : '0',
        highConfAccuracy: highConf > 0 ? ((highConfWin / highConf) * 100).toFixed(1) : '0',
        medConfAccuracy: medConf > 0 ? ((medConfWin / medConf) * 100).toFixed(1) : '0'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Index-wise Performance
router.get('/index-performance', async (req, res) => {
  try {
    const indices = ['NIFTY', 'BANKNIFTY', 'MIDCPNIFTY', 'SENSEX', 'FINNIFTY', 'NIFTYIT'];
    const result = {};

    for (let index of indices) {
      const all = await Suggestion.find({ index });
      const total = all.length;
      let wins = 0, losses = 0, totalPnl = 0;

      all.forEach(s => {
        if (s.target1Hit) wins++;
        if (s.stopLossHit) losses++;
        totalPnl += s.pnlAmount || 0;
      });

      result[index] = {
        total,
        wins,
        losses,
        accuracy: total > 0 ? ((wins / total) * 100).toFixed(1) : '0',
        totalPnl: totalPnl.toFixed(2)
      };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Daily Performance
router.get('/daily-performance', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));

    const suggestions = await Suggestion.find({
      dateTime: { $gte: fromDate }
    }).sort({ dateTime: 1 });

    const dailyMap = {};
    suggestions.forEach(s => {
      const dateKey = s.dateTime.toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, total: 0, wins: 0, losses: 0, pnl: 0 };
      }
      dailyMap[dateKey].total++;
      if (s.target1Hit) dailyMap[dateKey].wins++;
      if (s.stopLossHit) dailyMap[dateKey].losses++;
      dailyMap[dateKey].pnl += s.pnlAmount || 0;
    });

    const dailyPerformance = Object.values(dailyMap).map(d => ({
      ...d,
      accuracy: d.total > 0 ? ((d.wins / d.total) * 100).toFixed(1) : '0',
      pnl: d.pnl.toFixed(2)
    }));

    res.json({ success: true, data: dailyPerformance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Time-of-Day Analysis
router.get('/time-analysis', async (req, res) => {
  try {
    const suggestions = await Suggestion.find({ status: { $ne: 'ACTIVE' } });

    const timeSlots = {
      '09:30-10:30': { total: 0, wins: 0, pnl: 0 },
      '10:30-11:30': { total: 0, wins: 0, pnl: 0 },
      '11:30-12:30': { total: 0, wins: 0, pnl: 0 },
      '12:30-13:30': { total: 0, wins: 0, pnl: 0 },
      '13:30-14:30': { total: 0, wins: 0, pnl: 0 },
      '14:30-15:30': { total: 0, wins: 0, pnl: 0 }
    };

    suggestions.forEach(s => {
      const hour = s.dateTime.getHours();
      const minute = s.dateTime.getMinutes();
      const time = hour + minute / 60;

      let slot;
      if (time >= 9.5 && time < 10.5) slot = '09:30-10:30';
      else if (time >= 10.5 && time < 11.5) slot = '10:30-11:30';
      else if (time >= 11.5 && time < 12.5) slot = '11:30-12:30';
      else if (time >= 12.5 && time < 13.5) slot = '12:30-13:30';
      else if (time >= 13.5 && time < 14.5) slot = '13:30-14:30';
      else if (time >= 14.5 && time < 15.5) slot = '14:30-15:30';

      if (slot) {
        timeSlots[slot].total++;
        if (s.target1Hit) timeSlots[slot].wins++;
        timeSlots[slot].pnl += s.pnlAmount || 0;
      }
    });

    const result = Object.entries(timeSlots).map(([time, data]) => ({
      time,
      ...data,
      accuracy: data.total > 0 ? ((data.wins / data.total) * 100).toFixed(1) : '0'
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trade Journal Analytics
router.get('/journal-analytics', async (req, res) => {
  try {
    const trades = await Trade.find({ status: 'CLOSED' });
    const total = trades.length;

    if (total === 0) return res.json({ success: true, message: 'No closed trades' });

    let totalPnl = 0, wins = 0, losses = 0;
    let maxWin = 0, maxLoss = 0;
    let winAmount = 0, lossAmount = 0;
    let emotionStats = {};
    let strategyStats = {};

    trades.forEach(t => {
      totalPnl += t.netPnl;
      if (t.netPnl > 0) {
        wins++;
        winAmount += t.netPnl;
        if (t.netPnl > maxWin) maxWin = t.netPnl;
      } else {
        losses++;
        lossAmount += Math.abs(t.netPnl);
        if (Math.abs(t.netPnl) > maxLoss) maxLoss = Math.abs(t.netPnl);
      }

      // Emotion tracking
      if (t.journal && t.journal.emotion) {
        if (!emotionStats[t.journal.emotion]) emotionStats[t.journal.emotion] = { total: 0, wins: 0 };
        emotionStats[t.journal.emotion].total++;
        if (t.netPnl > 0) emotionStats[t.journal.emotion].wins++;
      }

      // Strategy tracking
      if (t.strategy) {
        if (!strategyStats[t.strategy]) strategyStats[t.strategy] = { total: 0, wins: 0, pnl: 0 };
        strategyStats[t.strategy].total++;
        if (t.netPnl > 0) strategyStats[t.strategy].wins++;
        strategyStats[t.strategy].pnl += t.netPnl;
      }
    });

    const avgWin = wins > 0 ? winAmount / wins : 0;
    const avgLoss = losses > 0 ? lossAmount / losses : 0;
    const profitFactor = lossAmount > 0 ? winAmount / lossAmount : winAmount > 0 ? 999 : 0;
    const expectancy = total > 0 ? totalPnl / total : 0;

    // Equity Curve
    let equity = 0;
    const equityCurve = trades.map(t => {
      equity += t.netPnl;
      return { date: t.dateTime, equity: equity.toFixed(2), pnl: t.netPnl.toFixed(2) };
    });

    // Max Drawdown
    let peak = 0, maxDrawdown = 0;
    let runningEquity = 0;
    trades.forEach(t => {
      runningEquity += t.netPnl;
      if (runningEquity > peak) peak = runningEquity;
      const drawdown = peak - runningEquity;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    res.json({
      success: true,
      analytics: {
        total, wins, losses,
        winRate: ((wins / total) * 100).toFixed(1),
        totalPnl: totalPnl.toFixed(2),
        avgWin: avgWin.toFixed(2),
        avgLoss: avgLoss.toFixed(2),
        maxWin: maxWin.toFixed(2),
        maxLoss: maxLoss.toFixed(2),
        profitFactor: profitFactor.toFixed(2),
        expectancy: expectancy.toFixed(2),
        maxDrawdown: maxDrawdown.toFixed(2),
        equityCurve,
        emotionStats,
        strategyStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cumulative P&L Chart
router.get('/cumulative-pnl', async (req, res) => {
  try {
    const suggestions = await Suggestion.find({
      status: { $ne: 'ACTIVE' }
    }).sort({ dateTime: 1 });

    let cumulative = 0;
    const data = suggestions.map(s => {
      cumulative += s.pnlAmount || 0;
      return {
        date: s.dateTime,
        suggestionId: s.suggestionId,
        pnl: s.pnlAmount || 0,
        cumulative: cumulative.toFixed(2)
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Failure Analysis Report
router.get('/failure-analysis', async (req, res) => {
  try {
    const failures = await Suggestion.find({ stopLossHit: true }).sort({ dateTime: -1 });

    const reasons = {};
    failures.forEach(f => {
      const reason = f.failureReason || 'Unknown';
      if (!reasons[reason]) reasons[reason] = 0;
      reasons[reason]++;
    });

    const conditionAnalysis = {};
    failures.forEach(f => {
      Object.entries(f.conditionsMatched || {}).forEach(([key, value]) => {
        if (!conditionAnalysis[key]) conditionAnalysis[key] = { matched: 0, notMatched: 0 };
        if (value) conditionAnalysis[key].matched++;
        else conditionAnalysis[key].notMatched++;
      });
    });

    res.json({
      success: true,
      totalFailures: failures.length,
      reasons,
      conditionAnalysis,
      recentFailures: failures.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;