const mongoose = require('mongoose');

const SuggestionSchema = new mongoose.Schema({
  // Basic Info
  suggestionId: {
    type: String,
    unique: true,
    required: true
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
  entryPrice: {
    type: Number,
    required: true
  },
  
  // Targets & Stop Loss
  target1: { type: Number, required: true },
  target2: { type: Number, required: true },
  target3: { type: Number, required: true },
  stopLoss: { type: Number, required: true },
  riskRewardRatio: { type: String },

  // Tracking After Suggestion
  currentPrice: { type: Number, default: 0 },
  highAfterSuggestion: { type: Number, default: 0 },
  lowAfterSuggestion: { type: Number, default: 0 },

  target1Hit: { type: Boolean, default: false },
  target1HitTime: { type: Date },
  target2Hit: { type: Boolean, default: false },
  target2HitTime: { type: Date },
  target3Hit: { type: Boolean, default: false },
  target3HitTime: { type: Date },
  stopLossHit: { type: Boolean, default: false },
  stopLossHitTime: { type: Date },

  // Performance
  pnlPercentage: { type: Number, default: 0 },
  pnlAmount: { type: Number, default: 0 },

  // Status
  status: {
    type: String,
    enum: ['ACTIVE', 'T1_HIT', 'T2_HIT', 'T3_HIT', 'SL_HIT', 'EXPIRED', 'CLOSED'],
    default: 'ACTIVE'
  },

  // Confidence
  confidenceLevel: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    required: true
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100
  },

  // Reasoning
  reasoning: {
    trend: { type: String },
    optionChain: { type: String },
    technical: { type: String },
    candlestick: { type: String },
    fiiDii: { type: String },
    news: { type: String },
    topStocks: { type: String },
    overall: { type: String }
  },

  // Conditions Matched
  conditionsMatched: {
    trendAlignment: { type: Boolean, default: false },
    optionChainBullish: { type: Boolean, default: false },
    oiBuildupSupport: { type: Boolean, default: false },
    pcrFavorable: { type: Boolean, default: false },
    technicalConfirm: { type: Boolean, default: false },
    candlestickConfirm: { type: Boolean, default: false },
    topStocksConfirm: { type: Boolean, default: false },
    fiiDiiSupport: { type: Boolean, default: false },
    noNegativeNews: { type: Boolean, default: false },
    vixNormal: { type: Boolean, default: false },
    goodLiquidity: { type: Boolean, default: false },
    riskRewardGood: { type: Boolean, default: false }
  },
  totalConditionsMet: { type: Number, default: 0 },

  // Failure Analysis
  failureReason: { type: String },
  lessonsLearned: { type: String }

}, { timestamps: true });

module.exports = mongoose.model('Suggestion', SuggestionSchema);
