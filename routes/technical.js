const express = require('express');
const router = express.Router();

// Calculate RSI
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;

  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Calculate EMA
function calculateEMA(prices, period) {
  if (prices.length < period) return null;
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
}

// Calculate MACD
function calculateMACD(prices) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  if (!ema12 || !ema26) return null;

  const macdLine = ema12 - ema26;
  let signal = 'NEUTRAL';
  if (macdLine > 0) signal = 'BULLISH';
  else if (macdLine < 0) signal = 'BEARISH';

  return { macdLine, signal };
}

// Calculate Supertrend
function calculateSupertrend(highs, lows, closes, period = 10, multiplier = 3) {
  if (closes.length < period) return null;

  let atr = 0;
  for (let i = 1; i <= period; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    atr += tr;
  }
  atr /= period;

  const lastClose = closes[closes.length - 1];
  const lastHigh = highs[highs.length - 1];
  const lastLow = lows[lows.length - 1];
  const hl2 = (lastHigh + lastLow) / 2;

  const upperBand = hl2 + multiplier * atr;
  const lowerBand = hl2 - multiplier * atr;

  const signal = lastClose > lowerBand ? 'BUY' : 'SELL';

  return { upperBand, lowerBand, signal, atr };
}

// Calculate Bollinger Bands
function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  if (prices.length < period) return null;

  const slice = prices.slice(-period);
  const sma = slice.reduce((a, b) => a + b) / period;
  const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
  const sd = Math.sqrt(variance);

  return {
    upper: sma + stdDev * sd,
    middle: sma,
    lower: sma - stdDev * sd,
    bandwidth: ((sma + stdDev * sd) - (sma - stdDev * sd)) / sma * 100
  };
}

// Calculate ADX
function calculateADX(highs, lows, closes, period = 14) {
  if (closes.length < period * 2) return null;

  let sumDMPlus = 0, sumDMMinus = 0, sumTR = 0;

  for (let i = 1; i <= period; i++) {
    const dmPlus = Math.max(highs[i] - highs[i - 1], 0);
    const dmMinus = Math.max(lows[i - 1] - lows[i], 0);
    const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]));

    if (dmPlus > dmMinus) { sumDMPlus += dmPlus; }
    else { sumDMMinus += dmMinus; }
    sumTR += tr;
  }

  const diPlus = (sumDMPlus / sumTR) * 100;
  const diMinus = (sumDMMinus / sumTR) * 100;
  const dx = Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100;

  let trend = 'SIDEWAYS';
  if (dx > 25 && diPlus > diMinus) trend = 'STRONG_BULLISH';
  else if (dx > 25 && diMinus > diPlus) trend = 'STRONG_BEARISH';
  else if (dx > 20) trend = diPlus > diMinus ? 'BULLISH' : 'BEARISH';

  return { adx: dx, diPlus, diMinus, trend };
}

// Detect Candlestick Patterns
function detectCandlestickPatterns(candles) {
  if (!candles || candles.length < 3) return [];

  const patterns = [];
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const prevPrev = candles[candles.length - 3];

  const bodySize = Math.abs(last.close - last.open);
  const upperShadow = last.high - Math.max(last.open, last.close);
  const lowerShadow = Math.min(last.open, last.close) - last.low;
  const totalRange = last.high - last.low;

  // Doji
  if (bodySize < totalRange * 0.1 && totalRange > 0) {
    patterns.push({ name: 'DOJI', type: 'NEUTRAL', reliability: 'MEDIUM' });
  }

  // Hammer (Bullish)
  if (lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5 && last.close > last.open) {
    patterns.push({ name: 'HAMMER', type: 'BULLISH', reliability: 'HIGH' });
  }

  // Shooting Star (Bearish)
  if (upperShadow > bodySize * 2 && lowerShadow < bodySize * 0.5 && last.open > last.close) {
    patterns.push({ name: 'SHOOTING_STAR', type: 'BEARISH', reliability: 'HIGH' });
  }

  // Marubozu
  if (bodySize > totalRange * 0.9) {
    if (last.close > last.open) patterns.push({ name: 'BULLISH_MARUBOZU', type: 'BULLISH', reliability: 'HIGH' });
    else patterns.push({ name: 'BEARISH_MARUBOZU', type: 'BEARISH', reliability: 'HIGH' });
  }

  // Bullish Engulfing
  if (prev.close < prev.open && last.close > last.open &&
    last.open < prev.close && last.close > prev.open) {
    patterns.push({ name: 'BULLISH_ENGULFING', type: 'BULLISH', reliability: 'HIGH' });
  }

  // Bearish Engulfing
  if (prev.close > prev.open && last.close < last.open &&
    last.open > prev.close && last.close < prev.open) {
    patterns.push({ name: 'BEARISH_ENGULFING', type: 'BEARISH', reliability: 'HIGH' });
  }

  // Morning Star
  const prevPrevBody = Math.abs(prevPrev.close - prevPrev.open);
  const prevBody = Math.abs(prev.close - prev.open);
  if (prevPrev.close < prevPrev.open && prevBody < prevPrevBody * 0.3 &&
    last.close > last.open && last.close > (prevPrev.open + prevPrev.close) / 2) {
    patterns.push({ name: 'MORNING_STAR', type: 'BULLISH', reliability: 'HIGH' });
  }

  // Evening Star
  if (prevPrev.close > prevPrev.open && prevBody < prevPrevBody * 0.3 &&
    last.close < last.open && last.close < (prevPrev.open + prevPrev.close) / 2) {
    patterns.push({ name: 'EVENING_STAR', type: 'BEARISH', reliability: 'HIGH' });
  }

  // Three White Soldiers
  if (prevPrev.close > prevPrev.open && prev.close > prev.open && last.close > last.open &&
    prev.open > prevPrev.open && last.open > prev.open) {
    patterns.push({ name: 'THREE_WHITE_SOLDIERS', type: 'BULLISH', reliability: 'HIGH' });
  }

  // Three Black Crows
  if (prevPrev.close < prevPrev.open && prev.close < prev.open && last.close < last.open &&
    prev.open < prevPrev.open && last.open < prev.open) {
    patterns.push({ name: 'THREE_BLACK_CROWS', type: 'BEARISH', reliability: 'HIGH' });
  }

  // Inverted Hammer
  if (upperShadow > bodySize * 2 && lowerShadow < bodySize * 0.5 && last.close > last.open) {
    patterns.push({ name: 'INVERTED_HAMMER', type: 'BULLISH', reliability: 'MEDIUM' });
  }

  // Spinning Top
  if (bodySize < totalRange * 0.3 && upperShadow > bodySize && lowerShadow > bodySize) {
    patterns.push({ name: 'SPINNING_TOP', type: 'NEUTRAL', reliability: 'LOW' });
  }

  // Tweezer Top
  if (Math.abs(prev.high - last.high) < totalRange * 0.05 && prev.close > prev.open && last.close < last.open) {
    patterns.push({ name: 'TWEEZER_TOP', type: 'BEARISH', reliability: 'MEDIUM' });
  }

  // Tweezer Bottom
  if (Math.abs(prev.low - last.low) < totalRange * 0.05 && prev.close < prev.open && last.close > last.open) {
    patterns.push({ name: 'TWEEZER_BOTTOM', type: 'BULLISH', reliability: 'MEDIUM' });
  }

  return patterns;
}

// Get Full Technical Analysis
router.post('/analyze', async (req, res) => {
  try {
    const { prices, highs, lows, closes, candles } = req.body;

    const rsi = calculateRSI(closes);
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const ema100 = calculateEMA(closes, 100);
    const ema200 = calculateEMA(closes, 200);
    const macd = calculateMACD(closes);
    const supertrend = calculateSupertrend(highs, lows, closes);
    const bollinger = calculateBollingerBands(closes);
    const adx = calculateADX(highs, lows, closes);
    const candlestickPatterns = detectCandlestickPatterns(candles);

    const lastPrice = closes[closes.length - 1];

    // Overall Signal
    let bullishCount = 0;
    let bearishCount = 0;

    if (rsi && rsi < 30) bullishCount++;
    if (rsi && rsi > 70) bearishCount++;
    if (ema20 && lastPrice > ema20) bullishCount++;
    if (ema20 && lastPrice < ema20) bearishCount++;
    if (ema50 && lastPrice > ema50) bullishCount++;
    if (ema50 && lastPrice < ema50) bearishCount++;
    if (macd && macd.signal === 'BULLISH') bullishCount++;
    if (macd && macd.signal === 'BEARISH') bearishCount++;
    if (supertrend && supertrend.signal === 'BUY') bullishCount++;
    if (supertrend && supertrend.signal === 'SELL') bearishCount++;
    if (adx && adx.trend.includes('BULLISH')) bullishCount++;
    if (adx && adx.trend.includes('BEARISH')) bearishCount++;

    candlestickPatterns.forEach(p => {
      if (p.type === 'BULLISH') bullishCount++;
      if (p.type === 'BEARISH') bearishCount++;
    });

    let overallSignal = 'NEUTRAL';
    if (bullishCount > bearishCount + 2) overallSignal = 'STRONG_BULLISH';
    else if (bullishCount > bearishCount) overallSignal = 'BULLISH';
    else if (bearishCount > bullishCount + 2) overallSignal = 'STRONG_BEARISH';
    else if (bearishCount > bullishCount) overallSignal = 'BEARISH';

    res.json({
      success: true,
      analysis: {
        rsi: { value: rsi, signal: rsi > 70 ? 'OVERBOUGHT' : rsi < 30 ? 'OVERSOLD' : 'NEUTRAL' },
        ema: { ema20, ema50, ema100, ema200, signal: lastPrice > ema20 ? 'BULLISH' : 'BEARISH' },
        macd,
        supertrend,
        bollinger,
        adx,
        candlestickPatterns,
        overallSignal,
        bullishCount,
        bearishCount,
        lastPrice
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Support/Resistance Levels
router.post('/levels', async (req, res) => {
  try {
    const { highs, lows, closes } = req.body;

    const lastClose = closes[closes.length - 1];
    const high = Math.max(...highs.slice(-20));
    const low = Math.min(...lows.slice(-20));

    // Fibonacci Levels
    const diff = high - low;
    const fibonacci = {
      level0: high,
      level236: high - diff * 0.236,
      level382: high - diff * 0.382,
      level500: high - diff * 0.5,
      level618: high - diff * 0.618,
      level786: high - diff * 0.786,
      level100: low
    };

    // Pivot Points
    const prevHigh = highs[highs.length - 2] || high;
    const prevLow = lows[lows.length - 2] || low;
    const prevClose = closes[closes.length - 2] || lastClose;
    const pp = (prevHigh + prevLow + prevClose) / 3;

    const pivots = {
      r3: prevHigh + 2 * (pp - prevLow),
      r2: pp + (prevHigh - prevLow),
      r1: 2 * pp - prevLow,
      pp: pp,
      s1: 2 * pp - prevHigh,
      s2: pp - (prevHigh - prevLow),
      s3: prevLow - 2 * (prevHigh - pp)
    };

    // CPR
    const cpr = {
      tc: (pp - prevLow) + pp,
      pivot: pp,
      bc: pp - (pp - prevLow),
      width: (((pp - prevLow) + pp) - (pp - (pp - prevLow))) / pp * 100
    };

    res.json({
      success: true,
      levels: { fibonacci, pivots, cpr, recentHigh: high, recentLow: low }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;