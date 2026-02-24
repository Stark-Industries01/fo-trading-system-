const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  userId: { type: String, default: 'default' },
  capital: {
    totalCapital: { type: Number, default: 100000 },
    maxRiskPerTrade: { type: Number, default: 1 },
    dailyLossLimit: { type: Number, default: 3 },
    weeklyLossLimit: { type: Number, default: 5 },
    monthlyLossLimit: { type: Number, default: 10 },
    maxOpenPositions: { type: Number, default: 3 },
    defaultLotSize: { type: Number, default: 1 }
  },
  broker: {
    name: { type: String, default: 'DHAN' },
    clientId: { type: String },
    accessToken: { type: String }
  },
  telegram: {
    botToken: { type: String },
    chatId: { type: String },
    enabled: { type: Boolean, default: false }
  },
  tradingHours: {
    startTime: { type: String, default: '09:30' },
    endTime: { type: String, default: '15:15' },
    avoidFirstMinutes: { type: Number, default: 15 },
    avoidLastMinutes: { type: Number, default: 15 },
    lunchStart: { type: String, default: '12:30' },
    lunchEnd: { type: String, default: '13:30' },
    avoidLunch: { type: Boolean, default: true }
  },
  notifications: {
    browserPush: { type: Boolean, default: true },
    telegram: { type: Boolean, default: false },
    sound: { type: Boolean, default: true }
  },
  theme: { type: String, default: 'dark' },
  watchlist: [{ type: String }],
  indices: {
    type: [String],
    default: ['NIFTY', 'BANKNIFTY', 'MIDCPNIFTY', 'SENSEX', 'FINNIFTY', 'NIFTYIT']
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
