const mongoose = require('mongoose');

const EventCalendarSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  eventType: {
    type: String,
    enum: ['WEEKLY_EXPIRY', 'MONTHLY_EXPIRY', 'RBI_MPC', 'FED_FOMC', 'GDP', 'IIP', 'CPI', 'RESULTS', 'BUDGET', 'HOLIDAY', 'ROLLOVER', 'OTHER'],
    required: true
  },
  date: { type: Date, required: true },
  time: { type: String },
  description: { type: String },
  impact: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  affectedIndices: [{ type: String }],
  stockName: { type: String },
  isRecurring: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('EventCalendar', EventCalendarSchema);