const mongoose = require('mongoose');

const MarketDataSchema = new mongoose.Schema({
  index: { type: String, required: true },
  date: { type: Date, required: true },
  open: { type: Number },
  high: { type: Number },
  low: { type: Number },
  close: { type: Number },
  volume: { type: Number },
  change: { type: Number },
  changePercent: { type: Number },
  vix: { type: Number },
  advanceDecline: {
    advances: { type: Number },
    declines: { type: Number },
    unchanged: { type: Number }
  },
  globalMarkets: {
    dowJones: { change: Number, changePercent: Number },
    nasdaq: { change: Number, changePercent: Number },
    sp500: { change: Number, changePercent: Number },
    ftse: { change: Number, changePercent: Number },
    nikkei: { change: Number, changePercent: Number },
    hangseng: { change: Number, changePercent: Number },
    sgxNifty: { change: Number, changePercent: Number }
  },
  pivotPoints: {
    daily: { pp: Number, r1: Number, r2: Number, r3: Number, s1: Number, s2: Number, s3: Number },
    weekly: { pp: Number, r1: Number, r2: Number, r3: Number, s1: Number, s2: Number, s3: Number },
    monthly: { pp: Number, r1: Number, r2: Number, r3: Number, s1: Number, s2: Number, s3: Number }
  },
  cpr: {
    tc: { type: Number },
    pivot: { type: Number },
    bc: { type: Number },
    width: { type: Number }
  },
  previousDay: {
    high: { type: Number },
    low: { type: Number },
    close: { type: Number }
  }
}, { timestamps: true });

module.exports = mongoose.model('MarketData', MarketDataSchema);