import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

function FiiDiiPage() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [stance, setStance] = useState(null);
  const [ratioTrend, setRatioTrend] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [latestRes, histRes, stanceRes, ratioRes] = await Promise.all([
        axios.get('/api/fii-dii/latest'),
        axios.get('/api/fii-dii/history?days=30'),
        axios.get('/api/fii-dii/stance'),
        axios.get('/api/fii-dii/fii-ratio')
      ]);

      if (latestRes.data.success) setLatest(latestRes.data.data);
      if (histRes.data.success) setHistory(histRes.data.data);
      if (stanceRes.data.success) setStance(stanceRes.data);
      if (ratioRes.data.success) setRatioTrend(ratioRes.data.trend);
    } catch (error) {
      console.log('FII/DII Error:', error.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">🏦 FII/DII Tracker</h1>

      {/* FII Stance */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className={`card p-4 ${
          stance?.stance?.includes('BULLISH') ? 'glow-green' : 
          stance?.stance?.includes('BEARISH') ? 'glow-red' : ''
        }`}>
          <p className="text-xs text-gray-400">FII STANCE</p>
          <p className={`text-2xl font-bold ${
            stance?.stance?.includes('BULLISH') ? 'text-green-400' :
            stance?.stance?.includes('BEARISH') ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {stance?.stance || 'LOADING...'}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400">FII Cash Net</p>
          <p className={`text-2xl font-bold ${(stance?.details?.cashNet || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ₹{((stance?.details?.cashNet || 0) / 100).toFixed(0)} Cr
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400">FII Futures Net</p>
          <p className={`text-2xl font-bold ${(stance?.details?.futuresNet || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ₹{((stance?.details?.futuresNet || 0) / 100).toFixed(0)} Cr
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400">Long/Short Ratio</p>
          <p className={`text-2xl font-bold ${(stance?.details?.longShortRatio || 0) > 1 ? 'text-green-400' : 'text-red-400'}`}>
            {(stance?.details?.longShortRatio || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Latest Data */}
      {latest && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* FII Data */}
          <div className="card p-4">
            <h3 className="text-sm font-bold text-white mb-3">🌍 FII Activity</h3>
            <div className="space-y-2">
              <div className="flex justify-between bg-gray-800 p-2 rounded">
                <span className="text-sm text-gray-400">Cash Buy</span>
                <span className="text-sm text-green-400">₹{((latest.fii?.cashBuy || 0) / 100).toFixed(0)} Cr</span>
              </div>
              <div className="flex justify-between bg-gray-800 p-2 rounded">
                <span className="text-sm text-gray-400">Cash Sell</span>
                <span className="text-sm text-red-400">₹{((latest.fii?.cashSell || 0) / 100).toFixed(0)} Cr</span>
              </div>
              <div className={`flex justify-between p-2 rounded ${(latest.fii?.cashNet || 0) >= 0 ? 'bg-green-500 bg-opacity-10' : 'bg-red-500 bg-opacity-10'}`}>
                <span className="text-sm text-white font-bold">Cash Net</span>
                <span className={`text-sm font-bold ${(latest.fii?.cashNet || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ₹{((latest.fii?.cashNet || 0) / 100).toFixed(0)} Cr
                </span>
              </div>
              <div className="flex justify-between bg-gray-800 p-2 rounded">
                <span className="text-sm text-gray-400">Index Futures Long</span>
                <span className="text-sm text-green-400">₹{((latest.fii?.indexFuturesLong || 0) / 100).toFixed(0)} Cr</span>
              </div>
              <div className="flex justify-between bg-gray-800 p-2 rounded">
                <span className="text-sm text-gray-400">Index Futures Short</span>
                <span className="text-sm text-red-400">₹{((latest.fii?.indexFuturesShort || 0) / 100).toFixed(0)} Cr</span>
              </div>
              <div className="flex justify-between bg-gray-800 p-2 rounded">
                <span className="text-sm text-gray-400">Index Options Net</span>
                <span className={`text-sm ${(latest.fii?.indexOptionsNet || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ₹{((latest.fii?.indexOptionsNet || 0) / 100).toFixed(0)} Cr
                </span>
              </div>
            </div>
          </div>

          {/* DII Data */}
          <div className="card p-4">
            <h3 className="text-sm font-bold text-white mb-3">🇮🇳 DII Activity</h3>
            <div className="space-y-2">
              <div className="flex justify-between bg-gray-800 p-2 rounded">
                <span className="text-sm text-gray-400">Cash Buy</span>
                <span className="text-sm text-green-400">₹{((latest.dii?.cashBuy || 0) / 100).toFixed(0)} Cr</span>
              </div>
              <div className="flex justify-between bg-gray-800 p-2 rounded">
                <span className="text-sm text-gray-400">Cash Sell</span>
                <span className="text-sm text-red-400">₹{((latest.dii?.cashSell || 0) / 100).toFixed(0)} Cr</span>
              </div>
              <div className={`flex justify-between p-2 rounded ${(latest.dii?.cashNet || 0) >= 0 ? 'bg-green-500 bg-opacity-10' : 'bg-red-500 bg-opacity-10'}`}>
                <span className="text-sm text-white font-bold">Cash Net</span>
                <span className={`text-sm font-bold ${(latest.dii?.cashNet || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ₹{((latest.dii?.cashNet || 0) / 100).toFixed(0)} Cr
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FII Cash Net History Chart */}
      {history.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">📊 FII Cash Net (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={history.map(h => ({
              date: new Date(h.date).toLocaleDateString(),
              cashNet: (h.fii?.cashNet || 0) / 100
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Bar dataKey="cashNet" name="FII Net (Cr)">
                {history.map((entry, i) => (
                  <Cell key={i} fill={(entry.fii?.cashNet || 0) >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Long/Short Ratio Trend */}
      {ratioTrend.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">📈 FII Long/Short Ratio Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ratioTrend.map(r => ({
              date: new Date(r.date).toLocaleDateString(),
              ratio: r.ratio
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="ratio" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default FiiDiiPage;