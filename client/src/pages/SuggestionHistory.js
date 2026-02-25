import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SuggestionHistory() {
  const [suggestions, setSuggestions] = useState([]);
  const [filter, setFilter] = useState({
    status: '', index: '', optionType: '', confidence: '', from: '', to: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.index) params.index = filter.index;
      if (filter.optionType) params.optionType = filter.optionType;
      if (filter.confidence) params.confidence = filter.confidence;
      if (filter.from) params.from = filter.from;
      if (filter.to) params.to = filter.to;

      const res = await axios.get('/api/suggestion/all', { params });
      if (res.data.success) setSuggestions(res.data.data);
    } catch (error) {
      console.log('History Error:', error.message);
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'T1_HIT': case 'T2_HIT': case 'T3_HIT': return 'text-green-400 bg-green-500 bg-opacity-20';
      case 'SL_HIT': return 'text-red-400 bg-red-500 bg-opacity-20';
      case 'ACTIVE': return 'text-blue-400 bg-blue-500 bg-opacity-20';
      case 'EXPIRED': return 'text-gray-400 bg-gray-500 bg-opacity-20';
      default: return 'text-gray-400 bg-gray-500 bg-opacity-20';
    }
  };

  // Stats
  const total = suggestions.length;
  const wins = suggestions.filter(s => s.target1Hit).length;
  const losses = suggestions.filter(s => s.stopLossHit).length;
  const totalPnl = suggestions.reduce((sum, s) => sum + (s.pnlAmount || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">📜 Suggestion History</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="card p-3">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-xl font-bold text-white">{total}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-400">Wins</p>
          <p className="text-xl font-bold text-green-400">{wins}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-400">Losses</p>
          <p className="text-xl font-bold text-red-400">{losses}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-400">Win Rate</p>
          <p className="text-xl font-bold text-blue-400">{total > 0 ? ((wins / total) * 100).toFixed(1) : 0}%</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-400">Total P&L</p>
          <p className={`text-xl font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>₹{totalPnl.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}
            className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="T1_HIT">T1 Hit</option>
            <option value="T2_HIT">T2 Hit</option>
            <option value="T3_HIT">T3 Hit</option>
            <option value="SL_HIT">SL Hit</option>
            <option value="EXPIRED">Expired</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select value={filter.index} onChange={e => setFilter({ ...filter, index: e.target.value })}
            className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600">
            <option value="">All Index</option>
            <option value="NIFTY">NIFTY</option>
            <option value="BANKNIFTY">BANKNIFTY</option>
            <option value="FINNIFTY">FINNIFTY</option>
            <option value="MIDCPNIFTY">MIDCPNIFTY</option>
            <option value="NIFTYIT">NIFTY IT</option>
          </select>
          <select value={filter.optionType} onChange={e => setFilter({ ...filter, optionType: e.target.value })}
            className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600">
            <option value="">CE & PE</option>
            <option value="CE">CE Only</option>
            <option value="PE">PE Only</option>
          </select>
          <select value={filter.confidence} onChange={e => setFilter({ ...filter, confidence: e.target.value })}
            className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600">
            <option value="">All Confidence</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>
          <input type="date" value={filter.from} onChange={e => setFilter({ ...filter, from: e.target.value })}
            className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600" />
          <input type="date" value={filter.to} onChange={e => setFilter({ ...filter, to: e.target.value })}
            className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600" />
        </div>
      </div>

      {/* History Table */}
      <div className="card p-4">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading...</p>
        ) : suggestions.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No suggestions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700 text-xs">
                  <th className="py-2 text-left">Date/Time</th>
                  <th className="py-2 text-left">ID</th>
                  <th className="py-2 text-left">Index</th>
                  <th className="py-2 text-center">Strike</th>
                  <th className="py-2 text-center">Type</th>
                  <th className="py-2 text-right">Entry</th>
                  <th className="py-2 text-right">High</th>
                  <th className="py-2 text-right">Low</th>
                  <th className="py-2 text-center">T1</th>
                  <th className="py-2 text-center">T2</th>
                  <th className="py-2 text-center">T3</th>
                  <th className="py-2 text-center">SL</th>
                  <th className="py-2 text-right">P&L %</th>
                  <th className="py-2 text-center">Status</th>
                  <th className="py-2 text-center">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map(s => (
                  <tr key={s.suggestionId} className="border-b border-gray-800 hover:bg-gray-800 text-xs">
                    <td className="py-2 text-gray-300">{new Date(s.dateTime).toLocaleString()}</td>
                    <td className="py-2 text-gray-400">{s.suggestionId}</td>
                    <td className="py-2 text-white font-medium">{s.index}</td>
                    <td className="py-2 text-center text-white">{s.strikePrice}</td>
                    <td className="py-2 text-center">
                      <span className={s.optionType === 'CE' ? 'text-green-400' : 'text-red-400'}>
                        {s.optionType}
                      </span>
                    </td>
                    <td className="py-2 text-right text-white">₹{s.entryPrice}</td>
                    <td className="py-2 text-right text-green-400">₹{s.highAfterSuggestion}</td>
                    <td className="py-2 text-right text-red-400">₹{s.lowAfterSuggestion}</td>
                    <td className="py-2 text-center">{s.target1Hit ? '✅' : '❌'}</td>
                    <td className="py-2 text-center">{s.target2Hit ? '✅' : '❌'}</td>
                    <td className="py-2 text-center">{s.target3Hit ? '✅' : '❌'}</td>
                    <td className="py-2 text-center">{s.stopLossHit ? '❌' : '✅'}</td>
                    <td className={`py-2 text-right font-bold ${(s.pnlPercentage || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(s.pnlPercentage || 0) >= 0 ? '+' : ''}{(s.pnlPercentage || 0).toFixed(1)}%
                    </td>
                    <td className="py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2 text-center">
                      <span className={`text-xs ${s.confidenceLevel === 'HIGH' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {s.confidenceLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default SuggestionHistory;