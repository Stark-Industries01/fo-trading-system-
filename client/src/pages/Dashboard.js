import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard({ socket, marketData }) {
  const [overview, setOverview] = useState(null);
  const [activeSuggestions, setActiveSuggestions] = useState([]);
  const [todayPerformance, setTodayPerformance] = useState(null);
  const [newsImpact, setNewsImpact] = useState(null);
  const [fiiStance, setFiiStance] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [sugRes, perfRes, newsRes, fiiRes] = await Promise.all([
        axios.get('/api/suggestion/active'),
        axios.get('/api/analytics/suggestion-performance'),
        axios.get('/api/news/impact-summary'),
        axios.get('/api/fii-dii/stance')
      ]);

      if (sugRes.data.success) setActiveSuggestions(sugRes.data.data);
      if (perfRes.data.success) setTodayPerformance(perfRes.data.performance);
      if (newsRes.data.success) setNewsImpact(newsRes.data.summary);
      if (fiiRes.data.success) setFiiStance(fiiRes.data);
    } catch (error) {
      console.log('Dashboard Error:', error.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">📊 Market Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-green-400 text-sm">Live</span>
        </div>
      </div>

      {/* Market Prices Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { name: 'NIFTY 50', price: marketData?.nifty?.price || '--', change: marketData?.nifty?.change || 0 },
          { name: 'BANK NIFTY', price: marketData?.bankNifty?.price || '--', change: marketData?.bankNifty?.change || 0 },
          { name: 'INDIA VIX', price: marketData?.vix || '--', change: 0 },
          { name: 'FIN NIFTY', price: '--', change: 0 },
          { name: 'MIDCAP', price: '--', change: 0 },
          { name: 'NIFTY IT', price: '--', change: 0 }
        ].map((item, i) => (
          <div key={i} className={`card p-3 ${item.change >= 0 ? 'glow-green' : 'glow-red'}`}>
            <p className="text-xs text-gray-400">{item.name}</p>
            <p className="text-lg font-bold text-white">{item.price}</p>
            <p className={`text-sm font-medium ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change || 0).toFixed(2)}%
            </p>
          </div>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* FII Stance */}
        <div className="card p-4">
          <p className="text-xs text-gray-400 mb-1">FII STANCE</p>
          <p className={`text-lg font-bold ${
            fiiStance?.stance?.includes('BULLISH') ? 'text-green-400' :
            fiiStance?.stance?.includes('BEARISH') ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {fiiStance?.stance || 'LOADING...'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Cash: ₹{((fiiStance?.details?.cashNet || 0) / 100).toFixed(0)} Cr
          </p>
        </div>

        {/* News Sentiment */}
        <div className="card p-4">
          <p className="text-xs text-gray-400 mb-1">NEWS SENTIMENT</p>
          <p className={`text-lg font-bold ${
            newsImpact?.overallSentiment === 'BULLISH' ? 'text-green-400' :
            newsImpact?.overallSentiment === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {newsImpact?.overallSentiment || 'NEUTRAL'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            🟢{newsImpact?.bullish || 0} 🔴{newsImpact?.bearish || 0} 🟡{newsImpact?.neutral || 0}
          </p>
        </div>

        {/* Overall Accuracy */}
        <div className="card p-4">
          <p className="text-xs text-gray-400 mb-1">ACCURACY</p>
          <p className="text-lg font-bold text-blue-400">
            {todayPerformance?.overallAccuracy || '0'}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Total: {todayPerformance?.total || 0} suggestions
          </p>
        </div>

        {/* Total P&L */}
        <div className="card p-4">
          <p className="text-xs text-gray-400 mb-1">TOTAL P&L</p>
          <p className={`text-lg font-bold ${
            (todayPerformance?.totalPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            ₹{todayPerformance?.totalPnl || '0'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Win: {todayPerformance?.target1?.hit || 0} | Loss: {todayPerformance?.stopLoss?.hit || 0}
          </p>
        </div>
      </div>

      {/* Active Suggestions */}
      <div className="card p-4 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">🤖 Active Suggestions</h2>
        {activeSuggestions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-lg">No active suggestions right now</p>
            <p className="text-gray-500 text-sm mt-2">System will generate when conditions match</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSuggestions.map(s => (
              <div key={s.suggestionId} className={`card p-4 ${s.pnlPercentage >= 0 ? 'glow-green' : 'glow-red'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    s.optionType === 'CE' ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-red-500 bg-opacity-20 text-red-400'
                  }`}>
                    {s.index} {s.strikePrice} {s.optionType}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    s.confidenceLevel === 'HIGH' ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                  }`}>
                    {s.confidenceLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>
                    <p className="text-gray-400">Entry</p>
                    <p className="text-white font-medium">₹{s.entryPrice}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Current</p>
                    <p className={`font-medium ${s.pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ₹{s.currentPrice}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1 text-xs mb-2">
                  <div className={`text-center p-1 rounded ${s.target1Hit ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    T1: ₹{s.target1}
                  </div>
                  <div className={`text-center p-1 rounded ${s.target2Hit ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    T2: ₹{s.target2}
                  </div>
                  <div className={`text-center p-1 rounded ${s.target3Hit ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    T3: ₹{s.target3}
                  </div>
                  <div className={`text-center p-1 rounded ${s.stopLossHit ? 'bg-red-500 bg-opacity-20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                    SL: ₹{s.stopLoss}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className={`text-lg font-bold ${s.pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {s.pnlPercentage >= 0 ? '+' : ''}{s.pnlPercentage.toFixed(1)}%
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    s.status === 'ACTIVE' ? 'bg-blue-500 bg-opacity-20 text-blue-400' :
                    s.status.includes('T') ? 'bg-green-500 bg-opacity-20 text-green-400' :
                    'bg-red-500 bg-opacity-20 text-red-400'
                  }`}>
                    {s.status}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  {new Date(s.dateTime).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => window.location.href = '/suggestions'}
          className="card p-4 text-center hover:bg-gray-700 transition-all cursor-pointer"
        >
          <span className="text-2xl">🤖</span>
          <p className="text-sm text-gray-300 mt-2">Generate Suggestion</p>
        </button>
        <button
          onClick={() => window.location.href = '/option-chain'}
          className="card p-4 text-center hover:bg-gray-700 transition-all cursor-pointer"
        >
          <span className="text-2xl">⛓️</span>
          <p className="text-sm text-gray-300 mt-2">Option Chain</p>
        </button>
        <button
          onClick={() => window.location.href = '/performance'}
          className="card p-4 text-center hover:bg-gray-700 transition-all cursor-pointer"
        >
          <span className="text-2xl">🏆</span>
          <p className="text-sm text-gray-300 mt-2">Performance</p>
        </button>
        <button
          onClick={() => window.location.href = '/charts'}
          className="card p-4 text-center hover:bg-gray-700 transition-all cursor-pointer"
        >
          <span className="text-2xl">📈</span>
          <p className="text-sm text-gray-300 mt-2">Charts</p>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;