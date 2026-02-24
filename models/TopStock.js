const mongoose = require('mongoose');

const TopStockSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  index: {
    type: String,
    enum: ['NIFTY', 'BANKNIFTY', 'MIDCPNIFTY', 'SENSEX', 'FINNIFTY', 'NIFTYIT'],
    required: true
  },
  weightage: { type: Number, default: 0 },
  date: { type: Date, required: true },
  price: { type: Number },
  change: { type: Number },
  changePercent: { type: Number },
  volume: { type: Number },
  deliveryPercent: { type: Number },
  technical: {
    trend: { type: String, enum: ['BULLISH', 'BEARISH', 'SIDEWAYS'] },
    rsi: { type: Number },
    macdSignal: { type: String, enum: ['BUY', 'SELL', 'NEUTRAL'] },
    emaSignal: { type: String, enum: ['BUY', 'SELL', 'NEUTRAL'] },
    supertrendSignal: { type: String, enum: ['BUY', 'SELL', 'NEUTRAL'] },
    candlestickPattern: { type: String }
  },
  fundamentals: {
    marketCap: { type: Number },
    pe: { type: Number },
    eps: { type: Number },
    revenueGrowth: { type: Number },
    profitGrowth: { type: Number },
    debtToEquity: { type: Number },
    lastQuarterResult: { type: String, enum: ['GOOD', 'BAD', 'AVERAGE'] }
  },
  impactScore: {
    type: String,
    enum: ['STRONG_BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', 'STRONG_BEARISH'],
    default: 'NEUTRAL'
  }
}, { timestamps: true });

module.exports = mongoose.model('TopStock', TopStockSchema);