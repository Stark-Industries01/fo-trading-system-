const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  source: {
    type: String,
    enum: ['NSE', 'MONEYCONTROL', 'ET', 'REUTERS', 'MANUAL'],
    default: 'MANUAL'
  },
  url: { type: String },
  category: {
    type: String,
    enum: ['RBI', 'FED', 'EARNINGS', 'GLOBAL', 'SECTOR', 'STOCK', 'POLICY', 'BUDGET', 'GENERAL'],
    default: 'GENERAL'
  },
  impact: {
    type: String,
    enum: ['BULLISH', 'BEARISH', 'NEUTRAL'],
    default: 'NEUTRAL'
  },
  affectedIndices: [{ type: String }],
  affectedStocks: [{ type: String }],
  isImportant: { type: Boolean, default: false },
  publishedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('News', NewsSchema);