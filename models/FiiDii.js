const mongoose = require('mongoose');

const FiiDiiSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  fii: {
    cashBuy: { type: Number, default: 0 },
    cashSell: { type: Number, default: 0 },
    cashNet: { type: Number, default: 0 },
    indexFuturesLong: { type: Number, default: 0 },
    indexFuturesShort: { type: Number, default: 0 },
    indexFuturesNet: { type: Number, default: 0 },
    indexOptionsLong: { type: Number, default: 0 },
    indexOptionsShort: { type: Number, default: 0 },
    indexOptionsNet: { type: Number, default: 0 },
    stockFuturesLong: { type: Number, default: 0 },
    stockFuturesShort: { type: Number, default: 0 },
    stockFuturesNet: { type: Number, default: 0 },
    longShortRatio: { type: Number, default: 0 },
    stance: {
      type: String,
      enum: ['BULLISH', 'BEARISH', 'NEUTRAL'],
      default: 'NEUTRAL'
    }
  },
  dii: {
    cashBuy: { type: Number, default: 0 },
    cashSell: { type: Number, default: 0 },
    cashNet: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('FiiDii', FiiDiiSchema);