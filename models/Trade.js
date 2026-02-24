const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  // Basic Info
  tradeId: {
    type: String,
    unique: true,
    required: true
  },
  suggestionId: {
    type: String,
    ref: 'Suggestion'
  },
  dateTime: {
    type: Date,
    default: Date.now
  },

  // Trade Details
  index: {
    type: String,
    enum: ['NIFTY', 'BANKNIFTY', 'MIDCPNIFTY', 'SENSEX', 'FINNIFTY', 'NIFTYIT'],
    required: true
  },
  stockName: { type: String },
  optionType: {
    type: String,
    enum: ['CE', 'PE'],
    required: true
  },
  strikePrice: {
    type: Number,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },

  // Entry Details
  entryPrice: { type: Number, required: true },
  entryTime: { type: Date, required: true },
  lotSize: { type: Number, required: true },
  numberOfLots: { type: Number, default: 1 },
  totalQuantity: { type: Number },

  // Exit Details
  exitPrice: { type: Number },
  exitTime: { type: Date },
  exitReason: {
    type: String,
    enum: ['TARGET1', 'TARGET2', 'TARGET3', 'STOPLOSS', 'TRAILING_SL', 'MANUAL', 'TIME_EXIT', 'EXPIRY', 'PARTIAL'],
    default: 'MANUAL'
  },

  // Targets & Stop Loss
  target1: { type: Number },
  target2: { type: Number },
  target3: { type: Number },
  stopLoss: { type: Number },
  trailingSL: { type: Number },

  // P&L
  pnlAmount: { type: Number, default: 0 },
  pnlPercentage: { type: Number, default: 0 },
  charges: { type: Number, default: 0 },
  netPnl: { type: Number, default: 0 },

  // Risk
  riskAmount: { type: Number },
  capitalUsed: { type: Number },
  marginUsed: { type: Number },
  riskPercentOfCapital: { type: Number },

  // Status
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED', 'PARTIAL_CLOSED'],
    default: 'OPEN'
  },

  // Journal Entry
  journal: {
    entryReason: { type: String },
    exitReason: { type: String },
    emotion: {
      type: String,
      enum: ['CALM', 'CONFIDENT', 'FEARFUL', 'GREEDY', 'ANXIOUS', 'NEUTRAL']
    },
    notes: { type: String },
    screenshot: { type: String },
    lessonsLearned: { type: String },
    rating: { type: Number, min: 1, max: 5 }
  },

  // Strategy Used
  strategy: {
    type: String,
    enum: ['TREND_FOLLOW', 'BREAKOUT', 'REVERSAL', 'SCALPING', 'SWING', 'SUGGESTION_BASED'],
    default: 'SUGGESTION_BASED'
  },

  // Broker Details
  brokerOrderId: { type: String },
  broker: {
    type: String,
    enum: ['DHAN', 'UPSTOX', 'ANGEL', 'ZERODHA', 'FYERS'],
    default: 'DHAN'
  }

}, { timestamps: true });

module.exports = mongoose.model('Trade', TradeSchema);
