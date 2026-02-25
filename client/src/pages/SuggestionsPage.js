import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function SuggestionsPage({ socket }) {
  const [index, setIndex] = useState('NIFTY');
  const [activeSuggestions, setActiveSuggestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, 30000);

    if (socket) {
      socket.on('newSuggestion', () => fetchActive());
      socket.on('suggestionUpdate', () => fetchActive());
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('newSuggestion');
        socket.off('suggestionUpdate');
      }
    };
  }, []);

  const fetchActive = async () => {
    try {
      const res = await axios.get('/api/suggestion/active');
      if (res.data.success) setActiveSuggestions(res.data.data);
    } catch (error) {
      console.log('Fetch Error:', error.message);
    }
  };

  const generateSuggestion = async () => {
    setGenerating(true);
    setLastResult(null);

    try {
      // First get technical analysis
      const techRes = await axios.post('/api/technical/analyze', {
        prices: [],
        highs: [],
        lows: [],
        closes: [],
        candles: []
      });

      const technicalAnalysis = techRes.data.success ? techRes.data.analysis : null;

      // Generate suggestion
      const res = await axios.post(`/api/suggestion/generate/${index}`, {
        technicalAnalysis,
        candles: []
      });

      setLastResult(res.data);

      if (res.data.success) {
        toast.success(`🟢 Suggestion Generated: ${res.data.suggestion.index} ${res.data.suggestion.strikePrice} ${res.data.suggestion.optionType}`);
        fetchActive();
      } else {
        toast.info(`ℹ️ ${res.data.message}`);
      }
    } catch (error) {
      toast.error('Error generating suggestion');
      console.log('Generate Error:', error.message);
    }

    setGenerating(false);
  };

  const closeSuggestion = async (suggestionId) => {
    try {
      await axios.put(`/api/suggestion/close/${suggestionId}`, {
        reason: 'Manual close'
      });
      toast.info('Suggestion closed');
      fetchActive();
    } catch (error) {
      toast.error('Error closing suggestion');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">🤖 Buy Suggestions</h1>
        <div className="flex gap-2 items-center">
          {['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'NIFTYIT'].map(idx => (
            <button
              key={idx}
              onClick={() => setIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                index === idx ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {idx}
            </button>
          ))}
          <button
            onClick={generateSuggestion}
            disabled={generating}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ml-4 ${
              generating ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {generating ? '⏳ Analyzing...' : '🔍 Generate Suggestion'}
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="card p-3 mb-6 border-yellow-500 border-opacity-50">
        <p className="text-yellow-400 text-sm">
          ⚠️ Ye suggestion hai, guarantee nahi. Apna analysis bhi karo. Stop Loss MUST lagao. Capital ka 1% se zyada risk mat lo.
        </p>
      </div>

      {/* Last Result */}
      {lastResult && !lastResult.success && (
        <div className="card p-4 mb-6 border-blue-500 border-opacity-30">
          <h3 className="text-sm font-bold text-blue-400 mb-2">📊 Analysis Result</h3>
          <p className="text-gray-300 text-sm mb-2">{lastResult.message}</p>
          {lastResult.analysis && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-green-400">Bullish Score: {lastResult.analysis.bullishScore}</p>
                <p className="text-red-400">Bearish Score: {lastResult.analysis.bearishScore}</p>
                <p className="text-gray-400">Conditions Met: {lastResult.analysis.totalConditions}/12</p>
              </div>
              <div>
                {lastResult.analysis.conditions && Object.entries(lastResult.analysis.conditions).map(([key, val]) => (
                  <p key={key} className={val ? 'text-green-400' : 'text-red-400'}>
                    {val ? '✅' : '❌'} {key}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Suggestions */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-4">
          📌 Active Suggestions ({activeSuggestions.length})
        </h2>

        {activeSuggestions.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-400 text-lg">No active suggestions</p>
            <p className="text-gray-500 text-sm mt-2">Click "Generate Suggestion" to analyze market</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSuggestions.map(s => (
              <div key={s.suggestionId} className={`card p-5 ${s.pnlPercentage >= 0 ? 'glow-green' : 'glow-red'}`}>
                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                      s.optionType === 'CE' ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-red-500 bg-opacity-20 text-red-400'
                    }`}>
                      {s.optionType === 'CE' ? '🟢' : '🔴'} {s.index} {s.strikePrice} {s.optionType}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      s.confidenceLevel === 'HIGH' ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                    }`}>
                      {s.confidenceLevel} ({s.confidenceScore?.toFixed(0)}%)
                    </span>
                  </div>
                  <button
                    onClick={() => closeSuggestion(s.suggestionId)}
                    className="text-gray-500 hover:text-red-400 text-xs"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-gray-800 p-2 rounded">
                    <p className="text-xs text-gray-400">Entry</p>
                    <p className="text-white font-bold">₹{s.entryPrice}</p>
                  </div>
                  <div className="bg-gray-800 p-2 rounded">
                    <p className="text-xs text-gray-400">Current</p>
                    <p className={`font-bold ${s.pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ₹{s.currentPrice}
                    </p>
                  </div>
                  <div className="bg-gray-800 p-2 rounded">
                    <p className="text-xs text-gray-400">P&L</p>
                    <p className={`font-bold ${s.pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {s.pnlPercentage >= 0 ? '+' : ''}{s.pnlPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Targets */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className={`p-2 rounded text-center ${s.target1Hit ? 'bg-green-500 bg-opacity-20 border border-green-500' : 'bg-gray-800'}`}>
                    <p className="text-xs text-gray-400">T1 (+20%)</p>
                    <p className={`text-sm font-bold ${s.target1Hit ? 'text-green-400' : 'text-gray-300'}`}>₹{s.target1}</p>
                    {s.target1Hit && <p className="text-xs text-green-400">✅ HIT</p>}
                  </div>
                  <div className={`p-2 rounded text-center ${s.target2Hit ? 'bg-green-500 bg-opacity-20 border border-green-500' : 'bg-gray-800'}`}>
                    <p className="text-xs text-gray-400">T2 (+40%)</p>
                    <p className={`text-sm font-bold ${s.target2Hit ? 'text-green-400' : 'text-gray-300'}`}>₹{s.target2}</p>
                    {s.target2Hit && <p className="text-xs text-green-400">✅ HIT</p>}
                  </div>
                  <div className={`p-2 rounded text-center ${s.target3Hit ? 'bg-green-500 bg-opacity-20 border border-green-500' : 'bg-gray-800'}`}>
                    <p className="text-xs text-gray-400">T3 (+65%)</p>
                    <p className={`text-sm font-bold ${s.target3Hit ? 'text-green-400' : 'text-gray-300'}`}>₹{s.target3}</p>
                    {s.target3Hit && <p className="text-xs text-green-400">✅ HIT</p>}
                  </div>
                  <div className={`p-2 rounded text-center ${s.stopLossHit ? 'bg-red-500 bg-opacity-20 border border-red-500' : 'bg-gray-800'}`}>
                    <p className="text-xs text-gray-400">SL (-20%)</p>
                    <p className={`text-sm font-bold ${s.stopLossHit ? 'text-red-400' : 'text-gray-300'}`}>₹{s.stopLoss}</p>
                    {s.stopLossHit && <p className="text-xs text-red-400">❌ HIT</p>}
                  </div>
                </div>

                {/* High/Low After Suggestion */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-800 p-2 rounded flex justify-between">
                    <span className="text-xs text-gray-400">High</span>
                    <span className="text-xs text-green-400 font-bold">₹{s.highAfterSuggestion}</span>
                  </div>
                  <div className="bg-gray-800 p-2 rounded flex justify-between">
                    <span className="text-xs text-gray-400">Low</span>
                    <span className="text-xs text-red-400 font-bold">₹{s.lowAfterSuggestion}</span>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="bg-gray-800 p-3 rounded mb-2">
                  <p className="text-xs text-gray-400 mb-1">📝 Reasoning:</p>
                  <p className="text-xs text-gray-300">{s.reasoning?.overall}</p>
                  {s.reasoning?.trend && <p className="text-xs text-gray-400 mt-1">📈 {s.reasoning.trend}</p>}
                  {s.reasoning?.optionChain && <p className="text-xs text-gray-400">⛓️ {s.reasoning.optionChain}</p>}
                  {s.reasoning?.fiiDii && <p className="text-xs text-gray-400">🏦 {s.reasoning.fiiDii}</p>}
                  {s.reasoning?.candlestick && s.reasoning.candlestick !== 'None' && (
                    <p className="text-xs text-gray-400">🕯️ {s.reasoning.candlestick}</p>
                  )}
                </div>

                {/* Conditions */}
                <div className="bg-gray-800 p-3 rounded mb-2">
                  <p className="text-xs text-gray-400 mb-1">✅ Conditions ({s.totalConditionsMet}/12):</p>
                  <div className="grid grid-cols-3 gap-1">
                    {s.conditionsMatched && Object.entries(s.conditionsMatched).map(([key, val]) => (
                      <span key={key} className={`text-xs ${val ? 'text-green-400' : 'text-red-400'}`}>
                        {val ? '✅' : '❌'} {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {new Date(s.dateTime).toLocaleString()} | R:R {s.riskRewardRatio}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${
                    s.status === 'ACTIVE' ? 'bg-blue-500 bg-opacity-20 text-blue-400' :
                    s.status.includes('T') ? 'bg-green-500 bg-opacity-20 text-green-400' :
                    'bg-red-500 bg-opacity-20 text-red-400'
                  }`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SuggestionsPage;