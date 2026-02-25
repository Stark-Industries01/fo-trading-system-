const Settings = require('../models/Settings');
const Suggestion = require('../models/Suggestion');

class TelegramBot {
  constructor() {
    this.bot = null;
  }

  async initialize() {
    try {
      const settings = await Settings.findOne({ userId: 'default' });
      if (!settings || !settings.telegram || !settings.telegram.botToken) {
        console.log('⚠️ Telegram not configured');
        return;
      }

      const { Telegraf } = require('telegraf');
      this.bot = new Telegraf(settings.telegram.botToken);

      // Commands
      this.bot.command('start', (ctx) => {
        ctx.reply(`
🤖 F&O Trading System Bot Active!

Commands:
/status - Active Suggestions
/performance - Today's Performance
/pnl - Overall P&L
/alerts - Recent Alerts
/help - All Commands
        `);
      });

      this.bot.command('status', async (ctx) => {
        const active = await Suggestion.find({
          status: { $in: ['ACTIVE', 'T1_HIT', 'T2_HIT'] }
        });

        if (active.length === 0) {
          return ctx.reply('📭 No active suggestions right now');
        }

        let message = '📊 ACTIVE SUGGESTIONS:\n━━━━━━━━━━━━━━━━\n';
        active.forEach(s => {
          const emoji = s.pnlPercentage >= 0 ? '🟢' : '🔴';
          message += `\n${emoji} ${s.index} ${s.strikePrice} ${s.optionType}`;
          message += `\nEntry: ₹${s.entryPrice} | Current: ₹${s.currentPrice}`;
          message += `\nP&L: ${s.pnlPercentage.toFixed(1)}%`;
          message += `\nStatus: ${s.status}\n`;
        });

        ctx.reply(message);
      });

      this.bot.command('performance', async (ctx) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaySuggestions = await Suggestion.find({
          dateTime: { $gte: today }
        });

        let wins = 0, losses = 0, totalPnl = 0;
        todaySuggestions.forEach(s => {
          if (s.target1Hit) wins++;
          if (s.stopLossHit) losses++;
          totalPnl += s.pnlAmount || 0;
        });

        ctx.reply(`
📊 TODAY'S PERFORMANCE
━━━━━━━━━━━━━━━━
Total Suggestions: ${todaySuggestions.length}
✅ Wins: ${wins}
❌ Losses: ${losses}
💰 P&L: ₹${totalPnl.toFixed(2)}
📈 Accuracy: ${todaySuggestions.length > 0 ? ((wins / todaySuggestions.length) * 100).toFixed(1) : 0}%
        `);
      });

      this.bot.command('pnl', async (ctx) => {
        const all = await Suggestion.find({ status: { $ne: 'ACTIVE' } });
        let totalPnl = 0, wins = 0;
        all.forEach(s => {
          totalPnl += s.pnlAmount || 0;
          if (s.target1Hit) wins++;
        });

        ctx.reply(`
💰 OVERALL P&L
━━━━━━━━━━━━━━━━
Total Suggestions: ${all.length}
✅ Wins: ${wins}
❌ Losses: ${all.length - wins}
📈 Win Rate: ${all.length > 0 ? ((wins / all.length) * 100).toFixed(1) : 0}%
💰 Total P&L: ₹${totalPnl.toFixed(2)}
        `);
      });

      this.bot.command('help', (ctx) => {
        ctx.reply(`
📖 ALL COMMANDS:
━━━━━━━━━━━━━━━━
/start - Start Bot
/status - Active Suggestions
/performance - Today's Performance
/pnl - Overall P&L
/alerts - Recent Alerts
/help - This message
        `);
      });

      this.bot.launch();
      console.log('✅ Telegram Bot Started');

    } catch (error) {
      console.log('Telegram Bot Error:', error.message);
    }
  }

  // Send Message
  async sendMessage(message) {
    try {
      const settings = await Settings.findOne({ userId: 'default' });
      if (!settings || !settings.telegram || !this.bot) return;

      await this.bot.telegram.sendMessage(settings.telegram.chatId, message);
    } catch (error) {
      console.log('Send Error:', error.message);
    }
  }
}

module.exports = new TelegramBot();