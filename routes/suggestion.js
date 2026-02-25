const express = require('express');
const router = express.Router();
const Suggestion = require('../models/Suggestion');
const OptionChain = require('../models/OptionChain');
const MarketData = require('../models/MarketData');
const FiiDii = require('../models/FiiDii');
const TopStock = require('../models/TopStock');
const News = require('../models/News');
const Settings = require('../models/Settings');

// Generate Unique ID
function generateId() {
  const now = new Date();
  return 'SUG-' + now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + '-' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
}

// CHECK 1: Market Timing Check
function isValidTradingTime(settings) {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;

  const startParts = settings.capital ? settings.tradingHours.startTime.split(':') : ['09', '30'];
  const endParts = settings.capital ? settings.tradingHours.endTime.split(':') : ['15', '15'];
  const startTime = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
  const endTime = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

  // Market hours check
  if (currentTime < startTime + 15 || currentTime > endTime - 15) return false;

  // Lunch time avoid
  if (settings.tradingHours && settings.tradingHours.avoidLunch) {
    const lunchStart = 12 * 60 + 30;
    const lunchEnd = 13 * 60 + 30;
    if (currentTime >= lunchStart && currentTime <= lunchEnd) return false;
  }

  // Weekend check
  const day = now.getDay();
  if (day === 0 || day === 6) return false;

  return true;
}

// CHECK 2: Capital Protection Check
async function isCapitalSafe(settings) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check daily loss
  const todaysSuggestions = await Suggestion.find({
    dateTime: { $gte: today },
    status: 'SL_HIT'
  });

  let dailyLoss = 0;
  todaysSuggestions.forEach(s => { dailyLoss += Math.abs(s.pnlAmount); });

  const dailyLimit = settings.capital.totalCapital * (settings.capital.dailyLossLimit / 100);
  if (dailyLoss >= dailyLimit) return { safe: false, reason: 'Daily loss limit reached' };

  // Check open positions
  const openPositions = await Suggestion.countDocuments({ status: 'ACTIVE' });
  if (openPositions >= settings.capital.maxOpenPositions) {
    return { safe: false, reason: 'Max open positions reached' };
  }

  // Check losing streak
  const recentSuggestions = await Suggestion.find().sort({ dateTime: -1 }).limit(3);
  const allSLHit = recentSuggestions.every(s => s.status === 'SL_HIT');
  if (allSLHit && recentSuggestions.length === 3) {
    return { safe: false, reason: 'Losing streak - 3 consecutive SL hit' };
  }

  return { safe: true, reason: '' };
}

// CHECK 3: Event Check
async function hasUpcomingEvent() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const events = await require('../models/EventCalendar').find({
    date: { $gte: today, $lte: tomorrow },
    impact: 'HIGH'
  });

  return events.length > 0;
}

// CHECK 4: News Impact Check
async function checkNewsImpact() {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const recentNews = await News.find({
    publishedAt: { $gte: oneHourAgo },
    isImportant: true
  });

  let bullishNews = 0, bearishNews = 0;

  recentNews.forEach(n => {
    if (n.impact === 'BULLISH') bullishNews++;
    if (n.impact === 'BEARISH') bearishNews++;
  });

  return { bullishNews, bearishNews, hasImportantNews: recentNews.length > 0 };
}

// CHECK 5: VIX Check
async function checkVIX() {
  const marketData = await MarketData.findOne().sort({ createdAt: -1 });
  if (!marketData || !marketData.vix) return { normal: true, value: 0 };

  const vix = marketData.vix;
  if (vix > 20) return { normal: false, value: vix, message: 'VIX too high - risky' };
  if (vix < 10) return { normal: true, value: vix, message: 'VIX low - good for buying' };

  return { normal: true, value: vix, message: 'VIX normal' };
}

// CHECK 6: Option Chain Analysis
async function analyzeOptionChain(index) {
  const data = await OptionChain.findOne({ index }).sort({ fetchedAt: -1 });
  if (!data) return null;

  const pcr = data.totalPEOI / data.totalCEOI;
  let signal = 'NEUTRAL';
  if (pcr > 1.2) signal = 'BULLISH';
  else if (pcr < 0.8) signal = 'BEARISH';

  // Find highest OI strikes
  let highestCEOI = { strike: 0, oi: 0 };
  let highestPEOI = { strike: 0, oi: 0 };
  let oiBuildupSignal = 'NEUTRAL';

  data.strikes.forEach(strike => {
    if (strike.ce.oi > highestCEOI.oi) highestCEOI = { strike: strike.strikePrice, oi: strike.ce.oi };
    if (strike.pe.oi > highestPEOI.oi) highestPEOI = { strike: strike.strikePrice, oi: strike.pe.oi };
  });

  // OI buildup detection
  let ceOIIncrease = 0, peOIIncrease = 0;
  data.strikes.forEach(strike => {
    if (strike.ce.oiChange > 0) ceOIIncrease += strike.ce.oiChange;
    if (strike.pe.oiChange > 0) peOIIncrease += strike.pe.oiChange;
  });

  if (peOIIncrease > ceOIIncrease * 1.5) oiBuildupSignal = 'BULLISH';
  else if (ceOIIncrease > peOIIncrease * 1.5) oiBuildupSignal = 'BEARISH';

  // ATM IV & Straddle
  const atmStrike = data.strikes.reduce((prev, curr) =>
    Math.abs(curr.strikePrice - data.spotPrice) < Math.abs(prev.strikePrice - data.spotPrice) ? curr : prev
  );

  const atmIV = (atmStrike.ce.iv + atmStrike.pe.iv) / 2;
  const straddlePrice = atmStrike.ce.ltp + atmStrike.pe.ltp;

  return {
    pcr, signal, highestCEOI, highestPEOI,
    oiBuildupSignal, atmIV, straddlePrice,
    spotPrice: data.spotPrice, maxPain: data.maxPain,
    resistance: highestCEOI.strike, support: highestPEOI.strike
  };
}

// CHECK 7: FII/DII Analysis
async function analyzeFIIDII() {
  const latest = await FiiDii.findOne().sort({ date: -1 });
  if (!latest) return { signal: 'NEUTRAL' };

  const fii = latest.fii;
  let signal = 'NEUTRAL';

  if (fii.cashNet > 0 && fii.indexFuturesNet > 0) signal = 'STRONG_BULLISH';
  else if (fii.cashNet > 0 || fii.indexFuturesNet > 0) signal = 'BULLISH';
  else if (fii.cashNet < 0 && fii.indexFuturesNet < 0) signal = 'STRONG_BEARISH';
  else if (fii.cashNet < 0 || fii.indexFuturesNet < 0) signal = 'BEARISH';

  return {
    signal,
    cashNet: fii.cashNet,
    futuresNet: fii.indexFuturesNet,
    longShortRatio: fii.longShortRatio
  };
}

// CHECK 8: Top Stocks Analysis
async function analyzeTopStocks(index) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stocks = await TopStock.find({ index, date: { $gte: today } })
    .sort({ weightage: -1 }).limit(10);

  if (stocks.length === 0) return { signal: 'NEUTRAL', details: '' };

  let bullish = 0, bearish = 0;
  let details = [];

  stocks.forEach(stock => {
    if (stock.technical.trend === 'BULLISH') {
      bullish += stock.weightage;
      details.push(`${stock.symbol} bullish`);
    }
    if (stock.technical.trend === 'BEARISH') {
      bearish += stock.weightage;
      details.push(`${stock.symbol} bearish`);
    }
  });

  let signal = 'NEUTRAL';
  if (bullish > bearish * 1.3) signal = 'BULLISH';
  else if (bearish > bullish * 1.3) signal = 'BEARISH';

  return { signal, bullishWeight: bullish, bearishWeight: bearish, details: details.join(', ') };
}

// MAIN SUGGESTION GENERATOR
router.post('/generate/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const { technicalAnalysis, candles } = req.body;

    // Get Settings
    const settings = await Settings.findOne({ userId: 'default' }) || {
      capital: { totalCapital: 100000, maxRiskPerTrade: 1, dailyLossLimit: 3, maxOpenPositions: 3 },
      tradingHours: { startTime: '09:30', endTime: '15:15', avoidLunch: true }
    };

    // SAFETY CHECK 1: Trading Time
    if (!isValidTradingTime(settings)) {
      return res.json({
        success: false,
        message: 'Not valid trading time',
        suggestion: null
      });
    }

    // SAFETY CHECK 2: Capital Protection
    const capitalCheck = await isCapitalSafe(settings);
    if (!capitalCheck.safe) {
      return res.json({
        success: false,
        message: capitalCheck.reason,
        suggestion: null
      });
    }

    // SAFETY CHECK 3: Event Check
    const hasEvent = await hasUpcomingEvent();
    if (hasEvent) {
      return res.json({
        success: false,
        message: 'Major event upcoming - No suggestion',
        suggestion: null
      });
    }

    // SAFETY CHECK 4: VIX Check
    const vixCheck = await checkVIX();
    if (!vixCheck.normal) {
      return res.json({
        success: false,
        message: vixCheck.message,
        suggestion: null
      });
    }

    // ANALYSIS 1: Option Chain
    const ocAnalysis = await analyzeOptionChain(index);
    if (!ocAnalysis) {
      return res.json({ success: false, message: 'No option chain data available' });
    }

    // ANALYSIS 2: News
    const newsAnalysis = await checkNewsImpact();

    // ANALYSIS 3: FII/DII
    const fiiAnalysis = await analyzeFIIDII();

    // ANALYSIS 4: Top Stocks
    const stockAnalysis = await analyzeTopStocks(index);

    // ANALYSIS 5: Technical (from request body)
    const techSignal = technicalAnalysis ? technicalAnalysis.overallSignal : 'NEUTRAL';

    // COUNT CONDITIONS
    let conditions = {
      trendAlignment: false,
      optionChainBullish: false,
      oiBuildupSupport: false,
      pcrFavorable: false,
      technicalConfirm: false,
      candlestickConfirm: false,
      topStocksConfirm: false,
      fiiDiiSupport: false,
      noNegativeNews: false,
      vixNormal: false,
      goodLiquidity: true,
      riskRewardGood: true
    };

    let direction = 'NEUTRAL';
    let bullishScore = 0, bearishScore = 0;

    // Score calculation
    if (techSignal === 'BULLISH' || techSignal === 'STRONG_BULLISH') {
      bullishScore += 2;
      conditions.technicalConfirm = true;
      conditions.trendAlignment = true;
    }
    if (techSignal === 'BEARISH' || techSignal === 'STRONG_BEARISH') {
      bearishScore += 2;
      conditions.technicalConfirm = true;
      conditions.trendAlignment = true;
    }

    if (ocAnalysis.signal === 'BULLISH') { bullishScore += 2; conditions.optionChainBullish = true; }
    if (ocAnalysis.signal === 'BEARISH') { bearishScore += 2; conditions.optionChainBullish = true; }

    if (ocAnalysis.oiBuildupSignal === 'BULLISH') { bullishScore += 1; conditions.oiBuildupSupport = true; }
    if (ocAnalysis.oiBuildupSignal === 'BEARISH') { bearishScore += 1; conditions.oiBuildupSupport = true; }

    if (ocAnalysis.pcr > 1.0) { bullishScore += 1; conditions.pcrFavorable = true; }
    if (ocAnalysis.pcr < 0.8) { bearishScore += 1; conditions.pcrFavorable = true; }

    if (fiiAnalysis.signal.includes('BULLISH')) { bullishScore += 1; conditions.fiiDiiSupport = true; }
    if (fiiAnalysis.signal.includes('BEARISH')) { bearishScore += 1; conditions.fiiDiiSupport = true; }

    if (stockAnalysis.signal === 'BULLISH') { bullishScore += 1; conditions.topStocksConfirm = true; }
    if (stockAnalysis.signal === 'BEARISH') { bearishScore += 1; conditions.topStocksConfirm = true; }

    if (!newsAnalysis.hasImportantNews) { conditions.noNegativeNews = true; bullishScore += 0.5; bearishScore += 0.5; }
    if (newsAnalysis.bullishNews > newsAnalysis.bearishNews) { bullishScore += 1; }
    if (newsAnalysis.bearishNews > newsAnalysis.bullishNews) { bearishScore += 1; }

    if (vixCheck.normal) { conditions.vixNormal = true; }

    // Candlestick from technical analysis
    if (technicalAnalysis && technicalAnalysis.candlestickPatterns) {
      const patterns = technicalAnalysis.candlestickPatterns;
      patterns.forEach(p => {
        if (p.type === 'BULLISH' && p.reliability === 'HIGH') { bullishScore += 1; conditions.candlestickConfirm = true; }
        if (p.type === 'BEARISH' && p.reliability === 'HIGH') { bearishScore += 1; conditions.candlestickConfirm = true; }
      });
    }

    // Determine Direction
    const totalConditions = Object.values(conditions).filter(v => v === true).length;

    if (bullishScore >= 5 && bullishScore > bearishScore + 2) direction = 'BULLISH';
    else if (bearishScore >= 5 && bearishScore > bullishScore + 2) direction = 'BEARISH';
    else {
      return res.json({
        success: false,
        message: 'No clear direction - Conflicting signals',
        analysis: { bullishScore, bearishScore, conditions, totalConditions },
        suggestion: null
      });
    }

    // Minimum conditions check
    if (totalConditions < 7) {
      return res.json({
        success: false,
        message: `Only ${totalConditions}/12 conditions met. Need minimum 7.`,
        analysis: { bullishScore, bearishScore, conditions, totalConditions },
        suggestion: null
      });
    }

    // GENERATE SUGGESTION
    const optionType = direction === 'BULLISH' ? 'CE' : 'PE';
    const spotPrice = ocAnalysis.spotPrice;

    // Strike Selection - Slightly OTM for better R:R
    let strikePrice;
    const strikeGap = index === 'BANKNIFTY' ? 100 : index === 'NIFTY' ? 50 : 50;

    if (optionType === 'CE') {
      strikePrice = Math.ceil(spotPrice / strikeGap) * strikeGap;
    } else {
      strikePrice = Math.floor(spotPrice / strikeGap) * strikeGap;
    }

    // Find option premium from option chain
    const selectedStrike = ocAnalysis.spotPrice ? 
      (await OptionChain.findOne({ index }).sort({ fetchedAt: -1 }))?.strikes?.find(s => s.strikePrice === strikePrice) : null;

    const entryPrice = selectedStrike ? 
      (optionType === 'CE' ? selectedStrike.ce.ltp : selectedStrike.pe.ltp) : 0;

    if (entryPrice <= 0) {
      return res.json({ success: false, message: 'Could not determine entry price' });
    }

    // Calculate Targets & SL
    const target1 = Math.round(entryPrice * 1.20 * 100) / 100; // 20% profit
    const target2 = Math.round(entryPrice * 1.40 * 100) / 100; // 40% profit
    const target3 = Math.round(entryPrice * 1.65 * 100) / 100; // 65% profit
    const stopLoss = Math.round(entryPrice * 0.80 * 100) / 100; // 20% loss

    // Confidence Level
    let confidenceLevel = 'LOW';
    let confidenceScore = totalConditions / 12 * 100;
    if (totalConditions >= 9) confidenceLevel = 'HIGH';
    else if (totalConditions >= 7) confidenceLevel = 'MEDIUM';

    // Skip LOW confidence
    if (confidenceLevel === 'LOW') {
      return res.json({
        success: false,
        message: 'Confidence too low',
        analysis: { bullishScore, bearishScore, conditions, totalConditions }
      });
    }

    // Expiry Date (Next Thursday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + daysUntilThursday);

    // Risk:Reward
    const risk = entryPrice - stopLoss;
    const reward = target2 - entryPrice;
    const rrRatio = `1:${(reward / risk).toFixed(1)}`;

    // Build Reasoning
    const reasoning = {
      trend: `Technical: ${techSignal}`,
      optionChain: `PCR: ${ocAnalysis.pcr.toFixed(2)}, Signal: ${ocAnalysis.signal}, Support: ${ocAnalysis.support}, Resistance: ${ocAnalysis.resistance}`,
      technical: `RSI: ${technicalAnalysis?.rsi?.value?.toFixed(1) || 'N/A'}, MACD: ${technicalAnalysis?.macd?.signal || 'N/A'}, Supertrend: ${technicalAnalysis?.supertrend?.signal || 'N/A'}`,
      candlestick: technicalAnalysis?.candlestickPatterns?.map(p => p.name).join(', ') || 'None',
      fiiDii: `FII Stance: ${fiiAnalysis.signal}, Cash Net: ${fiiAnalysis.cashNet}`,
      news: newsAnalysis.hasImportantNews ? 'Important news present' : 'No major news',
      topStocks: stockAnalysis.details || 'N/A',
      overall: `${direction} - ${totalConditions}/12 conditions met, Confidence: ${confidenceLevel}`
    };

    // Create Suggestion
    const suggestion = new Suggestion({
      suggestionId: generateId(),
      dateTime: new Date(),
      index,
      optionType,
      strikePrice,
      expiryDate,
      entryPrice,
      target1, target2, target3,
      stopLoss,
      riskRewardRatio: rrRatio,
      currentPrice: entryPrice,
      highAfterSuggestion: entryPrice,
      lowAfterSuggestion: entryPrice,
      status: 'ACTIVE',
      confidenceLevel,
      confidenceScore,
      reasoning,
      conditionsMatched: conditions,
      totalConditionsMet: totalConditions
    });

    await suggestion.save();

    // Send Telegram Alert if enabled
    const telegramSettings = await Settings.findOne({ userId: 'default' });
    if (telegramSettings && telegramSettings.telegram && telegramSettings.telegram.enabled) {
      try {
        const { Telegraf } = require('telegraf');
        const bot = new Telegraf(telegramSettings.telegram.botToken);
        const message = `
🟢 NEW BUY SUGGESTION
━━━━━━━━━━━━━━━━
📊 ${index} ${strikePrice} ${optionType}
📅 Expiry: ${expiryDate.toDateString()}

💰 Entry: ₹${entryPrice}
🎯 T1: ₹${target1} (+20%)
🎯 T2: ₹${target2} (+40%)
🎯 T3: ₹${target3} (+65%)
🛑 SL: ₹${stopLoss} (-20%)

📈 R:R = ${rrRatio}
🟢 Confidence: ${confidenceLevel} (${confidenceScore.toFixed(0)}%)

📝 ${reasoning.overall}
━━━━━━━━━━━━━━━━`;
        await bot.telegram.sendMessage(telegramSettings.telegram.chatId, message);
      } catch (e) {
        console.log('Telegram send failed:', e.message);
      }
    }

    // Emit Socket Event
    const io = req.app.get('io');
    if (io) {
      io.emit('newSuggestion', suggestion);
    }

    res.json({
      success: true,
      message: `${optionType} Buy Suggestion Generated!`,
      suggestion,
      analysis: { bullishScore, bearishScore, conditions, totalConditions }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Track Active Suggestions (Live Update)
router.put('/track/:suggestionId', async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { currentPrice } = req.body;

    const suggestion = await Suggestion.findOne({ suggestionId });
    if (!suggestion) return res.json({ success: false, message: 'Not found' });
    if (suggestion.status !== 'ACTIVE' && !suggestion.status.includes('T')) {
      return res.json({ success: false, message: 'Already closed' });
    }

    // Update prices
    suggestion.currentPrice = currentPrice;
    if (currentPrice > suggestion.highAfterSuggestion) suggestion.highAfterSuggestion = currentPrice;
    if (currentPrice < suggestion.lowAfterSuggestion || suggestion.lowAfterSuggestion === 0) {
      suggestion.lowAfterSuggestion = currentPrice;
    }

    // Check Target 1
    if (!suggestion.target1Hit && currentPrice >= suggestion.target1) {
      suggestion.target1Hit = true;
      suggestion.target1HitTime = new Date();
      suggestion.status = 'T1_HIT';
    }

    // Check Target 2
    if (!suggestion.target2Hit && currentPrice >= suggestion.target2) {
      suggestion.target2Hit = true;
      suggestion.target2HitTime = new Date();
      suggestion.status = 'T2_HIT';
    }

    // Check Target 3
    if (!suggestion.target3Hit && currentPrice >= suggestion.target3) {
      suggestion.target3Hit = true;
      suggestion.target3HitTime = new Date();
      suggestion.status = 'T3_HIT';
    }

    // Check Stop Loss
    if (!suggestion.stopLossHit && currentPrice <= suggestion.stopLoss) {
      suggestion.stopLossHit = true;
      suggestion.stopLossHitTime = new Date();
      suggestion.status = 'SL_HIT';
      suggestion.failureReason = 'Stop Loss Hit';
    }

    // P&L Calculation
    suggestion.pnlPercentage = ((currentPrice - suggestion.entryPrice) / suggestion.entryPrice * 100);
    suggestion.pnlAmount = currentPrice - suggestion.entryPrice;

    await suggestion.save();

    // Alert on important events
    const io = req.app.get('io');
    if (io && (suggestion.target1Hit || suggestion.target2Hit || suggestion.target3Hit || suggestion.stopLossHit)) {
      io.emit('suggestionUpdate', {
        suggestionId,
        status: suggestion.status,
        currentPrice,
        pnlPercentage: suggestion.pnlPercentage
      });
    }

    res.json({ success: true, suggestion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get All Suggestions
router.get('/all', async (req, res) => {
  try {
    const { status, index, optionType, from, to, confidence } = req.query;
    let query = {};

    if (status) query.status = status;
    if (index) query.index = index;
    if (optionType) query.optionType = optionType;
    if (confidence) query.confidenceLevel = confidence;
    if (from || to) {
      query.dateTime = {};
      if (from) query.dateTime.$gte = new Date(from);
      if (to) query.dateTime.$lte = new Date(to);
    }

    const suggestions = await Suggestion.find(query).sort({ dateTime: -1 });
    res.json({ success: true, count: suggestions.length, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Active Suggestions Only
router.get('/active', async (req, res) => {
  try {
    const suggestions = await Suggestion.find({
      status: { $in: ['ACTIVE', 'T1_HIT', 'T2_HIT'] }
    }).sort({ dateTime: -1 });
    res.json({ success: true, count: suggestions.length, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Single Suggestion Detail
router.get('/:suggestionId', async (req, res) => {
  try {
    const suggestion = await Suggestion.findOne({ suggestionId: req.params.suggestionId });
    if (!suggestion) return res.json({ success: false, message: 'Not found' });
    res.json({ success: true, data: suggestion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Close/Expire Suggestion Manually
router.put('/close/:suggestionId', async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { reason, lessonsLearned } = req.body;

    const suggestion = await Suggestion.findOne({ suggestionId });
    if (!suggestion) return res.json({ success: false, message: 'Not found' });

    suggestion.status = 'CLOSED';
    if (reason) suggestion.failureReason = reason;
    if (lessonsLearned) suggestion.lessonsLearned = lessonsLearned;

    await suggestion.save();
    res.json({ success: true, message: 'Suggestion closed', data: suggestion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add Failure Analysis
router.put('/learn/:suggestionId', async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { failureReason, lessonsLearned } = req.body;

    const suggestion = await Suggestion.findOneAndUpdate(
      { suggestionId },
      { failureReason, lessonsLearned },
      { new: true }
    );

    res.json({ success: true, data: suggestion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;