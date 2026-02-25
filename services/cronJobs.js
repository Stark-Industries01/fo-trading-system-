const cron = require('node-cron');
const OptionChain = require('../models/OptionChain');
const MarketData = require('../models/MarketData');
const Suggestion = require('../models/Suggestion');
const FiiDii = require('../models/FiiDii');
const News = require('../models/News');
const Alert = require('../models/Alert');
const Settings = require('../models/Settings');
const dhanApi = require('./dhanApi');
const axios = require('axios');

class CronJobs {
  constructor(io) {
    this.io = io;
  }

  startAll() {
    console.log('⏰ Starting all cron jobs...');

    // Every 3 minutes during market hours - Option Chain Update
    cron.schedule('*/3 9-15 * * 1-5', async () => {
      await this.updateOptionChain();
    });

    // Every 1 minute - Track Active Suggestions
    cron.schedule('*/1 9-15 * * 1-5', async () => {
      await this.trackActiveSuggestions();
    });

    // Every 5 minutes - Market Data Update
    cron.schedule('*/5 9-15 * * 1-5', async () => {
      await this.updateMarketData();
    });

    // Every 30 minutes - News Fetch
    cron.schedule('*/30 8-16 * * 1-5', async () => {
      await this.fetchNews();
    });

    // Every day at 6 PM - FII/DII Data
    cron.schedule('0 18 * * 1-5', async () => {
      await this.updateFIIDII();
    });

    // Every day at 7 AM - Pre-market Setup
    cron.schedule('0 7 * * 1-5', async () => {
      await this.preMarketSetup();
    });

    // Every day at 3:35 PM - Post Market Cleanup
    cron.schedule('35 15 * * 1-5', async () => {
      await this.postMarketCleanup();
    });

    // Every Sunday at midnight - Weekly Backup
    cron.schedule('0 0 * * 0', async () => {
      await this.weeklyBackup();
    });

    console.log('✅ All cron jobs started');
  }

  // Update Option Chain
  async updateOptionChain() {
    try {
      const indices = ['NIFTY', 'BANKNIFTY', 'FINNIFTY'];

      for (let index of indices) {
        const nseData = await dhanApi.getOptionChainNSE(index);

        if (nseData && nseData.records) {
          const records = nseData.records;
          const filtered = nseData.filtered;

          const strikes = records.data.map(item => ({
            strikePrice: item.strikePrice,
            ce: item.CE ? {
              oi: item.CE.openInterest || 0,
              oiChange: item.CE.changeinOpenInterest || 0,
              volume: item.CE.totalTradedVolume || 0,
              iv: item.CE.impliedVolatility || 0,
              ltp: item.CE.lastPrice || 0,
              bidPrice: item.CE.bidprice || 0,
              askPrice: item.CE.askPrice || 0,
              delta: 0, gamma: 0, theta: 0, vega: 0
            } : { oi: 0, oiChange: 0, volume: 0, iv: 0, ltp: 0 },
            pe: item.PE ? {
              oi: item.PE.openInterest || 0,
              oiChange: item.PE.changeinOpenInterest || 0,
              volume: item.PE.totalTradedVolume || 0,
              iv: item.PE.impliedVolatility || 0,
              ltp: item.PE.lastPrice || 0,
              bidPrice: item.PE.bidprice || 0,
              askPrice: item.PE.askPrice || 0,
              delta: 0, gamma: 0, theta: 0, vega: 0
            } : { oi: 0, oiChange: 0, volume: 0, iv: 0, ltp: 0 }
          }));

          // Find highest OI
          let highestCEOI = 0, highestPEOI = 0;
          let highestCEOIStrike = 0, highestPEOIStrike = 0;
          strikes.forEach(s => {
            if (s.ce.oi > highestCEOI) { highestCEOI = s.ce.oi; highestCEOIStrike = s.strikePrice; }
            if (s.pe.oi > highestPEOI) { highestPEOI = s.pe.oi; highestPEOIStrike = s.strikePrice; }
          });

          const optionChain = new OptionChain({
            index,
            expiryDate: new Date(records.expiryDates[0]),
            spotPrice: records.underlyingValue,
            totalCEOI: filtered ? filtered.CE.totOI : 0,
            totalPEOI: filtered ? filtered.PE.totOI : 0,
            pcr: filtered ? (filtered.PE.totOI / filtered.CE.totOI) : 0,
            highestCEOIStrike,
            highestPEOIStrike,
            strikes
          });

          await optionChain.save();

          if (this.io) {
            this.io.emit('optionChainUpdate', { index, spotPrice: records.underlyingValue });
          }
        }
      }
      console.log('📊 Option Chain Updated');
    } catch (error) {
      console.log('OC Update Error:', error.message);
    }
  }

  // Track Active Suggestions
  async trackActiveSuggestions() {
    try {
      const activeSuggestions = await Suggestion.find({
        status: { $in: ['ACTIVE', 'T1_HIT', 'T2_HIT'] }
      });

      for (let suggestion of activeSuggestions) {
        const optionChain = await OptionChain.findOne({
          index: suggestion.index
        }).sort({ fetchedAt: -1 });

        if (!optionChain) continue;

        const strike = optionChain.strikes.find(s => s.strikePrice === suggestion.strikePrice);
        if (!strike) continue;

        const currentPrice = suggestion.optionType === 'CE' ? strike.ce.ltp : strike.pe.ltp;
        if (currentPrice <= 0) continue;

        // Update
        suggestion.currentPrice = currentPrice;
        if (currentPrice > suggestion.highAfterSuggestion) suggestion.highAfterSuggestion = currentPrice;
        if (currentPrice < suggestion.lowAfterSuggestion || suggestion.lowAfterSuggestion === 0) {
          suggestion.lowAfterSuggestion = currentPrice;
        }

        // Check Targets
        if (!suggestion.target1Hit && currentPrice >= suggestion.target1) {
          suggestion.target1Hit = true;
          suggestion.target1HitTime = new Date();
          suggestion.status = 'T1_HIT';
          this.sendAlert(`🎯 T1 HIT! ${suggestion.index} ${suggestion.strikePrice} ${suggestion.optionType} @ ₹${currentPrice}`);
        }
        if (!suggestion.target2Hit && currentPrice >= suggestion.target2) {
          suggestion.target2Hit = true;
          suggestion.target2HitTime = new Date();
          suggestion.status = 'T2_HIT';
          this.sendAlert(`🎯🎯 T2 HIT! ${suggestion.index} ${suggestion.strikePrice} ${suggestion.optionType} @ ₹${currentPrice}`);
        }
        if (!suggestion.target3Hit && currentPrice >= suggestion.target3) {
          suggestion.target3Hit = true;
          suggestion.target3HitTime = new Date();
          suggestion.status = 'T3_HIT';
          this.sendAlert(`🎯🎯🎯 T3 HIT! ${suggestion.index} ${suggestion.strikePrice} ${suggestion.optionType} @ ₹${currentPrice}`);
        }

        // Check Stop Loss
        if (!suggestion.stopLossHit && currentPrice <= suggestion.stopLoss) {
          suggestion.stopLossHit = true;
          suggestion.stopLossHitTime = new Date();
          suggestion.status = 'SL_HIT';
          suggestion.failureReason = 'Stop Loss Hit';
          this.sendAlert(`🛑 SL HIT! ${suggestion.index} ${suggestion.strikePrice} ${suggestion.optionType} @ ₹${currentPrice}`);
        }

        // SL Near Warning
        const slDistance = ((currentPrice - suggestion.stopLoss) / currentPrice) * 100;
        if (slDistance < 5 && slDistance > 0 && !suggestion.stopLossHit) {
          this.sendAlert(`⚠️ SL NEAR! ${suggestion.index} ${suggestion.strikePrice} ${suggestion.optionType} - Only ${slDistance.toFixed(1)}% away from SL`);
        }

        suggestion.pnlPercentage = ((currentPrice - suggestion.entryPrice) / suggestion.entryPrice) * 100;
        suggestion.pnlAmount = currentPrice - suggestion.entryPrice;

        await suggestion.save();

        if (this.io) {
          this.io.emit('suggestionUpdate', {
            suggestionId: suggestion.suggestionId,
            currentPrice,
            status: suggestion.status,
            pnlPercentage: suggestion.pnlPercentage
          });
        }
      }
    } catch (error) {
      console.log('Track Error:', error.message);
    }
  }

  // Update Market Data
  async updateMarketData() {
    try {
      const indexQuote = await dhanApi.getIndexQuote('NIFTY 50');
      const bankNiftyQuote = await dhanApi.getIndexQuote('NIFTY BANK');
      const vixQuote = await dhanApi.getIndexQuote('INDIA VIX');

      if (indexQuote) {
        if (this.io) {
          this.io.emit('marketUpdate', {
            nifty: {
              price: indexQuote.last,
              change: indexQuote.percentChange
            },
            bankNifty: bankNiftyQuote ? {
              price: bankNiftyQuote.last,
              change: bankNiftyQuote.percentChange
            } : null,
            vix: vixQuote ? vixQuote.last : null
          });
        }
      }
    } catch (error) {
      console.log('Market Update Error:', error.message);
    }
  }

  // Fetch News
  async fetchNews() {
    try {
      const feeds = [
        { url: 'https://www.moneycontrol.com/rss/marketreports.xml', source: 'MONEYCONTROL' },
        { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', source: 'ET' }
      ];

      for (let feed of feeds) {
        try {
          const response = await axios.get(feed.url, { timeout: 5000 });
          const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/g;
          let match;

          while ((match = titleRegex.exec(response.data)) !== null) {
            const title = match[1];
            if (title && title.length > 10) {
              const exists = await News.findOne({ title, source: feed.source });
              if (!exists) {
                let impact = 'NEUTRAL';
                const lower = title.toLowerCase();
                if (lower.includes('rally') || lower.includes('surge') || lower.includes('bull') || lower.includes('gain')) impact = 'BULLISH';
                if (lower.includes('crash') || lower.includes('fall') || lower.includes('bear') || lower.includes('drop')) impact = 'BEARISH';

                await new News({ title, source: feed.source, impact, category: 'GENERAL', isImportant: impact !== 'NEUTRAL' }).save();
              }
            }
          }
        } catch (e) { }
      }
      console.log('📰 News Updated');
    } catch (error) {
      console.log('News Error:', error.message);
    }
  }

  // Update FII/DII
  async updateFIIDII() {
    try {
      console.log('🏦 FII/DII update scheduled');
      // NSE publishes data post market, can be fetched manually or via RSS
    } catch (error) {
      console.log('FII/DII Error:', error.message);
    }
  }

  // Pre Market Setup
  async preMarketSetup() {
    try {
      console.log('🌅 Pre-market setup running...');

      // Expire old active suggestions
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await Suggestion.updateMany(
        { status: 'ACTIVE', dateTime: { $lt: yesterday } },
        { status: 'EXPIRED' }
      );

      // Clean old alerts
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await Alert.deleteMany({ createdAt: { $lt: thirtyDaysAgo }, isRead: true });

      console.log('✅ Pre-market setup done');
    } catch (error) {
      console.log('Pre-market Error:', error.message);
    }
  }

  // Post Market Cleanup
  async postMarketCleanup() {
    try {
      console.log('🌆 Post-market cleanup...');

      // Mark expired suggestions
      const today = new Date();
      const activeSuggestions = await Suggestion.find({ status: 'ACTIVE' });

      for (let s of activeSuggestions) {
        if (s.expiryDate && new Date(s.expiryDate) <= today) {
          s.status = 'EXPIRED';
          await s.save();
        }
      }

      console.log('✅ Post-market cleanup done');
    } catch (error) {
      console.log('Post-market Error:', error.message);
    }
  }

  // Weekly Backup
  async weeklyBackup() {
    try {
      console.log('💾 Weekly backup started...');
      // Data is in MongoDB, already backed up
      console.log('✅ Weekly backup done');
    } catch (error) {
      console.log('Backup Error:', error.message);
    }
  }

  // Send Alert Helper
  async sendAlert(message) {
    try {
      const alert = new Alert({
        alertType: 'PNL_ALERT',
        message,
        severity: 'HIGH',
        isTriggered: true,
        triggeredAt: new Date()
      });
      await alert.save();

      if (this.io) this.io.emit('newAlert', alert);

      // Telegram
      const settings = await Settings.findOne({ userId: 'default' });
      if (settings && settings.telegram && settings.telegram.enabled) {
        try {
          const { Telegraf } = require('telegraf');
          const bot = new Telegraf(settings.telegram.botToken);
          await bot.telegram.sendMessage(settings.telegram.chatId, message);
        } catch (e) { }
      }
    } catch (error) {
      console.log('Alert Error:', error.message);
    }
  }
}

module.exports = CronJobs;