const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  alertType: {
    type: String,
    enum: ['PRICE', 'OI_CHANGE', 'OI_SPURT', 'IV_SPIKE', 'PCR_CHANGE', 'SUPPORT_BREAK', 'RESISTANCE_BREAK', 'FII_ACTIVITY', 'VIX_SPIKE', 'PNL_ALERT', 'MARGIN_WARNING', 'SL_NEAR', 'TARGET_NEAR', 'NEWS'],
    required: true
  },
  index: { type: String },
  strikePrice: { type: Number },
  condition: { type: String },
  triggerValue: { type: Number },
  currentValue: { type: Number },
  message: { type: String, required: true },
  severity: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  isTriggered: { type: Boolean, default: false },
  triggeredAt: { type: Date },
  isRead: { type: Boolean, default: false },
  sentViaTelegram: { type: Boolean, default: false },
  sentViaBrowser: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
