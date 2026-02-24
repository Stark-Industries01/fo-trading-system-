const mongoose = require('mongoose');

const OptionChainSchema = new mongoose.Schema({
  index: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  fetchedAt: { type: Date, default: Date.now },
  spotPrice: { type: Number },
  maxPain: { type: Number },
  pcr: { type: Number },
  totalCEOI: { type: Number },
  totalPEOI: { type: Number },
  atmStraddle: { type: Number },
  highestCEOIStrike: { type: Number },
  highestPEOIStrike: { type: Number },
  strikes: [{
    strikePrice: { type: Number },
    ce: {
      oi: { type: Number, default: 0 },
      oiChange: { type: Number, default: 0 },
      volume: { type: Number, default: 0 },
      iv: { type: Number, default: 0 },
      ltp: { type: Number, default: 0 },
      bidPrice: { type: Number, default: 0 },
      askPrice: { type: Number, default: 0 },
      delta: { type: Number, default: 0 },
      gamma: { type: Number, default: 0 },
      theta: { type: Number, default: 0 },
      vega: { type: Number, default: 0 }
    },
    pe: {
      oi: { type: Number, default: 0 },
      oiChange: { type: Number, default: 0 },
      volume: { type: Number, default: 0 },
      iv: { type: Number, default: 0 },
      ltp: { type: Number, default: 0 },
      bidPrice: { type: Number, default: 0 },
      askPrice: { type: Number, default: 0 },
      delta: { type: Number, default: 0 },
      gamma: { type: Number, default: 0 },
      theta: { type: Number, default: 0 },
      vega: { type: Number, default: 0 }
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('OptionChain', OptionChainSchema);