import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function NewsPage() {
  const [news, setNews] = useState([]);
  const [todayNews, setTodayNews] = useState([]);
  const [impactSummary, setImpactSummary] = useState(null);
  const [filter, setFilter] = useState('');
  const [newNews, setNewNews] = useState({ title: '', impact: 'NEUTRAL', category: 'GENERAL', isImportant: false });

  useEffect(() => {
    fetchNews();
  }, [filter]);

  const fetchNews = async () => {
    try {
      const params = {};
      if (filter) params.impact = filter;

      const [allRes, todayRes, impactRes] = await Promise.all([
        axios.get('/api/news/all', { params }),
        axios.get('/api/news/today'),
        axios.get('/api/news/impact-summary')
      ]);

      if (allRes.data.success) setNews(allRes.data.data);
      if (todayRes.data.success) setTodayNews(todayRes.data.data);
      if (impactRes.data.success) setImpactSummary(impactRes.data.summary);
    } catch (error) {
      console.log('News Error:', error.message);
    }
  };

  const fetchRSS = async () => {
    try {
      const res = await axios.get('/api/news/fetch-rss');
      if (res.data.success) {
        toast.success(`Fetched ${res.data.fetched} new articles`);
        fetchNews();
      }
    } catch (error) {
      toast.error('RSS fetch failed');
    }
  };

  const addNews = async () => {
    if (!newNews.title) return toast.error('Title required');
    try {
      await axios.post('/api/news/add', newNews);
      toast.success('News added');
      setNewNews({ title: '', impact: 'NEUTRAL', category: 'GENERAL', isImportant: false });
      fetchNews();
    } catch (error) {
      toast.error('Failed to add');
    }
  };

  const deleteNews = async (id) => {
    try {
      await axios.delete(`/api/news/${id}`);
      fetchNews();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">📰 News & Events</h1>
        <button onClick={fetchRSS} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
          🔄 Fetch Latest News
        </button>
      </div>

      {/* Impact Summary */}
      {impactSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card p-3">
            <p className="text-xs text-gray-400">Overall</p>
            <p className={`text-xl font-bold ${
              impactSummary.overallSentiment === 'BULLISH' ? 'text-green-400' :
              impactSummary.overallSentiment === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
            }`}>{impactSummary.overallSentiment}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">🟢 Bullish</p>
            <p className="text-xl font-bold text-green-400">{impactSummary.bullish}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">🔴 Bearish</p>
            <p className="text-xl font-bold text-red-400">{impactSummary.bearish}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">🟡 Neutral</p>
            <p className="text-xl font-bold text-yellow-400">{impactSummary.neutral}</p>
          </div>
        </div>
      )}

      {/* Add News */}
      <div className="card p-4 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">➕ Add News Manually</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="News headline..."
            value={newNews.title}
            onChange={e => setNewNews({ ...newNews, title: e.target.value })}
            className="col-span-2 bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600"
          />
          <select value={newNews.impact} onChange={e => setNewNews({ ...newNews, impact: e.target.value })}
            className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600">
            <option value="BULLISH">🟢 Bullish</option>
            <option value="BEARISH">🔴 Bearish</option>
            <option value="NEUTRAL">🟡 Neutral</option>
          </select>
          <select value={newNews.category} onChange={e => setNewNews({ ...newNews, category: e.target.value })}
            className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600">
            <option value="GENERAL">General</option>
            <option value="RBI">RBI</option>
            <option value="FED">Fed</option>
            <option value="EARNINGS">Earnings</option>
            <option value="GLOBAL">Global</option>
            <option value="SECTOR">Sector</option>
            <option value="POLICY">Policy</option>
          </select>
          <button onClick={addNews} className="bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
            Add
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['', 'BULLISH', 'BEARISH', 'NEUTRAL'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filter === f ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}>
            {f || 'All'}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="card p-4">
        {news.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No news available. Click "Fetch Latest News"</p>
        ) : (
          <div className="space-y-2">
            {news.map(n => (
              <div key={n._id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg hover:bg-gray-750">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {n.impact === 'BULLISH' ? '🟢' : n.impact === 'BEARISH' ? '🔴' : '🟡'}
                  </span>
                  <div>
                    <p className="text-sm text-white">{n.title}</p>
                    <p className="text-xs text-gray-500">
                      {n.source} | {n.category} | {new Date(n.publishedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button onClick={() => deleteNews(n._id)} className="text-gray-500 hover:text-red-400 text-sm">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NewsPage;