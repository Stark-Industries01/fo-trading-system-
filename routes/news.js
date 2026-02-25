const express = require('express');
const router = express.Router();
const News = require('../models/News');
const axios = require('axios');

// Add News Manually
router.post('/add', async (req, res) => {
  try {
    const news = new News(req.body);
    await news.save();

    const io = req.app.get('io');
    if (io && news.isImportant) io.emit('importantNews', news);

    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get All News
router.get('/all', async (req, res) => {
  try {
    const { category, impact, from, to } = req.query;
    let query = {};
    if (category) query.category = category;
    if (impact) query.impact = impact;
    if (from || to) {
      query.publishedAt = {};
      if (from) query.publishedAt.$gte = new Date(from);
      if (to) query.publishedAt.$lte = new Date(to);
    }

    const news = await News.find(query).sort({ publishedAt: -1 }).limit(50);
    res.json({ success: true, count: news.length, data: news });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Today's Important News
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const news = await News.find({
      publishedAt: { $gte: today },
      isImportant: true
    }).sort({ publishedAt: -1 });

    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get News Impact Summary
router.get('/impact-summary', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const news = await News.find({ publishedAt: { $gte: today } });

    let bullish = 0, bearish = 0, neutral = 0;
    news.forEach(n => {
      if (n.impact === 'BULLISH') bullish++;
      else if (n.impact === 'BEARISH') bearish++;
      else neutral++;
    });

    let overallSentiment = 'NEUTRAL';
    if (bullish > bearish + 2) overallSentiment = 'BULLISH';
    else if (bearish > bullish + 2) overallSentiment = 'BEARISH';

    res.json({
      success: true,
      summary: { bullish, bearish, neutral, total: news.length, overallSentiment }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch RSS News (MoneyControl/ET)
router.get('/fetch-rss', async (req, res) => {
  try {
    const feeds = [
      { url: 'https://www.moneycontrol.com/rss/marketreports.xml', source: 'MONEYCONTROL' },
      { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', source: 'ET' }
    ];

    let allNews = [];

    for (let feed of feeds) {
      try {
        const response = await axios.get(feed.url, { timeout: 5000 });
        const data = response.data;

        // Simple XML parsing for titles
        const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/g;
        let match;
        while ((match = titleRegex.exec(data)) !== null) {
          const title = match[1];
          if (title && title.length > 10) {
            // Check if already exists
            const exists = await News.findOne({ title, source: feed.source });
            if (!exists) {
              let impact = 'NEUTRAL';
              const lowerTitle = title.toLowerCase();
              if (lowerTitle.includes('rally') || lowerTitle.includes('surge') || lowerTitle.includes('bull') || lowerTitle.includes('gain') || lowerTitle.includes('rise')) {
                impact = 'BULLISH';
              } else if (lowerTitle.includes('crash') || lowerTitle.includes('fall') || lowerTitle.includes('bear') || lowerTitle.includes('drop') || lowerTitle.includes('slump')) {
                impact = 'BEARISH';
              }

              const newsItem = new News({
                title,
                source: feed.source,
                impact,
                category: 'GENERAL',
                isImportant: impact !== 'NEUTRAL'
              });
              await newsItem.save();
              allNews.push(newsItem);
            }
          }
        }
      } catch (e) {
        console.log(`RSS fetch failed for ${feed.source}:`, e.message);
      }
    }

    res.json({ success: true, fetched: allNews.length, data: allNews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete News
router.delete('/:id', async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'News deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;