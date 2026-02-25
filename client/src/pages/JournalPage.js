import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function JournalPage() {
  const [trades, setTrades] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [journal, setJournal] = useState({
    entryReason: '', exitReason: '', emotion: 'NEUTRAL', notes: '', lessonsLearned: '', rating: 3
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tradesRes, analyticsRes] = await Promise.all([
        axios.get('/api/trade/all?status=CLOSED'),
        axios.get('/api/analytics/journal-analytics')
      ]);

      if (tradesRes.data.success) setTrades(tradesRes.data.data);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.analytics);
    } catch (error) {
      console.log('Journal Error:', error.message);
    }
  };

  const saveJournal = async (tradeId) => {
    try {
      await axios.put(`/api/trade/journal/${tradeId}`, journal);
      toast.success('Journal saved!');
      setEditingId(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const emotions = ['CALM', 'CONFIDENT', 'FEARFUL', 'GREEDY', 'ANXIOUS', 'NEUTRAL'];
  const emotionEmojis = {
    CALM: '😌', CONFIDENT: '💪', FEARFUL: '😨', GREEDY: '🤑', ANXIOUS: '😰', NEUTRAL: '😐'
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">📔 Trade Journal</h1>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div className="card p-3">
            <p className="text-xs text-gray-400">Total Trades</p>
            <p className="text-xl font-bold text-white">{analytics.total}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">Win Rate</p>
            <p className="text-xl font-bold text-green-400">{analytics.winRate}%</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">Profit Factor</p>
            <p className="text-xl font-bold text-blue-400">{analytics.profitFactor}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">Avg Win</p>
            <p className="text-xl font-bold text-green-400">₹{analytics.avgWin}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">Avg Loss</p>
            <p className="text-xl font-bold text-red-400">₹{analytics.avgLoss}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">Max Drawdown</p>
            <p className="text-xl font-bold text-red-400">₹{analytics.maxDrawdown}</p>
          </div>
        </div>
      )}

      {/* Emotion Stats */}
      {analytics && analytics.emotionStats && Object.keys(analytics.emotionStats).length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">😊 Emotion Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(analytics.emotionStats).map(([emotion, data]) => (
              <div key={emotion} className="bg-gray-800 p-3 rounded-lg text-center">
                <p className="text-2xl">{emotionEmojis[emotion]}</p>
                <p className="text-xs text-gray-400 mt-1">{emotion}</p>
                <p className="text-sm text-white font-bold">{data.total} trades</p>
                <p className="text-xs text-green-400">
                  Win: {data.total > 0 ? ((data.wins / data.total) * 100).toFixed(0) : 0}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategy Stats */}
      {analytics && analytics.strategyStats && Object.keys(analytics.strategyStats).length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">📋 Strategy Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(analytics.strategyStats).map(([strategy, data]) => (
              <div key={strategy} className="bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-400">{strategy}</p>
                <p className="text-sm text-white font-bold">{data.total} trades</p>
                <p className="text-xs text-green-400">
                  Win: {data.total > 0 ? ((data.wins / data.total) * 100).toFixed(0) : 0}%
                </p>
                <p className={`text-xs ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  P&L: ₹{data.pnl.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade Journal Entries */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-white mb-3">📝 Journal Entries</h3>
        {trades.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No closed trades to journal</p>
        ) : (
          <div className="space-y-3">
            {trades.map(t => (
              <div key={t.tradeId} className={`bg-gray-800 p-4 rounded-lg border-l-4 ${
                (t.netPnl || 0) >= 0 ? 'border-green-500' : 'border-red-500'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      t.optionType === 'CE' ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-red-500 bg-opacity-20 text-red-400'
                    }`}>
                      {t.index} {t.strikePrice} {t.optionType}
                    </span>
                    <span className={`text-sm font-bold ${(t.netPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ₹{(t.netPnl || 0).toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(t.dateTime).toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => {
                    setEditingId(editingId === t.tradeId ? null : t.tradeId);
                    if (t.journal) setJournal(t.journal);
                    else setJournal({ entryReason: '', exitReason: '', emotion: 'NEUTRAL', notes: '', lessonsLearned: '', rating: 3 });
                  }} className="text-xs text-blue-400 hover:text-blue-300">
                    {editingId === t.tradeId ? '✕ Cancel' : '✏️ Edit Journal'}
                  </button>
                </div>

                {/* Existing Journal */}
                {t.journal && editingId !== t.tradeId && (
                  <div className="mt-2 space-y-1 text-xs">
                    {t.journal.entryReason && <p className="text-gray-300">📥 Entry: {t.journal.entryReason}</p>}
                    {t.journal.exitReason && <p className="text-gray-300">📤 Exit: {t.journal.exitReason}</p>}
                    {t.journal.emotion && <p className="text-gray-300">😊 Emotion: {emotionEmojis[t.journal.emotion]} {t.journal.emotion}</p>}
                    {t.journal.notes && <p className="text-gray-300">📝 Notes: {t.journal.notes}</p>}
                    {t.journal.lessonsLearned && <p className="text-yellow-400">💡 Lesson: {t.journal.lessonsLearned}</p>}
                    {t.journal.rating && <p className="text-gray-300">⭐ Rating: {'⭐'.repeat(t.journal.rating)}</p>}
                  </div>
                )}

                {/* Edit Form */}
                {editingId === t.tradeId && (
                  <div className="mt-3 space-y-2">
                    <input type="text" placeholder="Entry Reason..." value={journal.entryReason}
                      onChange={e => setJournal({ ...journal, entryReason: e.target.value })}
                      className="w-full bg-gray-700 text-white text-xs rounded p-2 border border-gray-600" />
                    <input type="text" placeholder="Exit Reason..." value={journal.exitReason}
                      onChange={e => setJournal({ ...journal, exitReason: e.target.value })}
                      className="w-full bg-gray-700 text-white text-xs rounded p-2 border border-gray-600" />
                    <div className="flex gap-2">
                      <select value={journal.emotion} onChange={e => setJournal({ ...journal, emotion: e.target.value })}
                        className="bg-gray-700 text-white text-xs rounded p-2 border border-gray-600 flex-1">
                        {emotions.map(em => (
                          <option key={em} value={em}>{emotionEmojis[em]} {em}</option>
                        ))}
                      </select>
                      <select value={journal.rating} onChange={e => setJournal({ ...journal, rating: parseInt(e.target.value) })}
                        className="bg-gray-700 text-white text-xs rounded p-2 border border-gray-600">
                        {[1, 2, 3, 4, 5].map(r => (
                          <option key={r} value={r}>{'⭐'.repeat(r)}</option>
                        ))}
                      </select>
                    </div>
                    <textarea placeholder="Notes..." value={journal.notes}
                      onChange={e => setJournal({ ...journal, notes: e.target.value })}
                      className="w-full bg-gray-700 text-white text-xs rounded p-2 border border-gray-600" rows="2" />
                    <input type="text" placeholder="Lessons Learned..." value={journal.lessonsLearned}
                      onChange={e => setJournal({ ...journal, lessonsLearned: e.target.value })}
                      className="w-full bg-gray-700 text-white text-xs rounded p-2 border border-gray-600" />
                    <button onClick={() => saveJournal(t.tradeId)}
                      className="w-full bg-green-500 text-white text-xs rounded p-2 font-bold hover:bg-green-600">
                      💾 Save Journal
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default JournalPage;