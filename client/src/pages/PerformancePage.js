import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function PerformancePage() {
  const [performance, setPerformance] = useState(null);
  const [indexPerf, setIndexPerf] = useState(null);
  const [dailyPerf, setDailyPerf] = useState([]);
  const [timeAnalysis, setTimeAnalysis] = useState([]);
  const [cumulativePnl, setCumulativePnl] = useState([]);
  const [failureAnalysis, setFailureAnalysis] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [perfRes, indexRes, dailyRes, timeRes, cumRes, failRes] = await Promise.all([
        axios.get('/api/analytics/suggestion-performance'),
        axios.get('/api/analytics/index-performance'),
        axios.get('/api/analytics/daily-performance'),
        axios.get('/api/analytics/time-analysis'),
        axios.get('/api/analytics/cumulative-pnl'),
        axios.get('/api/analytics/failure-analysis')
      ]);

      if (perfRes.data.success) setPerformance(perfRes.data.performance);
      if (indexRes.data.success) setIndexPerf(indexRes.data.data);
      if (dailyRes.data.success) setDailyPerf(dailyRes.data.data);
      if (timeRes.data.success) setTimeAnalysis(timeRes.data.data);
      if (cumRes.data.success) setCumulativePnl(cumRes.data.data);
      if (failRes.data.success) setFailureAnalysis(failRes.data);
    } catch (error) {
      console.log('Performance Error:', error.message);
    }
  };

  const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">🏆 Performance Analytics</h1>

      {/* Overall Stats */}
      {performance && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div className="card p-3">
            <p className="text-xs text-gray-400">Total Suggestions</p>
            <p className="text-2xl font-bold text-white">{performance.total}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">Overall Accuracy</p>
            <p className="text-2xl font-bold text-green-400">{performance.overallAccuracy}%</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">Total P&L</p>
            <p className={`text-2xl font-bold ${parseFloat(performance.totalPnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ₹{performance.totalPnl}
            </p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">Avg P&L/Trade</p>
            <p className={`text-2xl font-bold ${parseFloat(performance.avgPnlPerSuggestion) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ₹{performance.avgPnlPerSuggestion}
            </p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">CE Accuracy</p>
            <p className="text-2xl font-bold text-blue-400">{performance.ceAccuracy}%</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">PE Accuracy</p>
            <p className="text-2xl font-bold text-purple-400">{performance.peAccuracy}%</p>
          </div>
        </div>
      )}

      {/* Target Hit Stats */}
      {performance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card p-4 glow-green">
            <p className="text-xs text-gray-400">Target 1 Hit</p>
            <p className="text-3xl font-bold text-green-400">{performance.target1.hit}</p>
            <p className="text-sm text-green-500">{performance.target1.percentage}%</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400">Target 2 Hit</p>
            <p className="text-3xl font-bold text-green-400">{performance.target2.hit}</p>
            <p className="text-sm text-green-500">{performance.target2.percentage}%</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400">Target 3 Hit</p>
            <p className="text-3xl font-bold text-green-400">{performance.target3.hit}</p>
            <p className="text-sm text-green-500">{performance.target3.percentage}%</p>
          </div>
          <div className="card p-4 glow-red">
            <p className="text-xs text-gray-400">Stop Loss Hit</p>
            <p className="text-3xl font-bold text-red-400">{performance.stopLoss.hit}</p>
            <p className="text-sm text-red-500">{performance.stopLoss.percentage}%</p>
          </div>
        </div>
      )}

      {/* Confidence Level Performance */}
      {performance && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card p-4">
            <p className="text-xs text-gray-400 mb-1">HIGH Confidence Accuracy</p>
            <p className="text-3xl font-bold text-green-400">{performance.highConfAccuracy}%</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${performance.highConfAccuracy}%` }}></div>
            </div>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400 mb-1">MEDIUM Confidence Accuracy</p>
            <p className="text-3xl font-bold text-yellow-400">{performance.medConfAccuracy}%</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${performance.medConfAccuracy}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Cumulative P&L Chart */}
      {cumulativePnl.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">📈 Cumulative P&L</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativePnl}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={val => new Date(val).toLocaleDateString()} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Line type="monotone" dataKey="cumulative" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Daily Performance Chart */}
      {dailyPerf.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">📊 Daily Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="pnl" fill="#22c55e">
                {dailyPerf.map((entry, i) => (
                  <Cell key={i} fill={parseFloat(entry.pnl) >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Index-wise Performance */}
      {indexPerf && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">🏢 Index-wise Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(indexPerf).map(([idx, data]) => (
              <div key={idx} className="bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-400">{idx}</p>
                <p className="text-lg font-bold text-white">{data.total} trades</p>
                <p className="text-sm text-green-400">Win: {data.accuracy}%</p>
                <p className={`text-sm ${parseFloat(data.totalPnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  P&L: ₹{data.totalPnl}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Analysis */}
      {timeAnalysis.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">⏰ Time-of-Day Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {timeAnalysis.map((slot, i) => (
              <div key={i} className="bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-400">{slot.time}</p>
                <p className="text-lg font-bold text-white">{slot.total} trades</p>
                <p className="text-sm text-green-400">Accuracy: {slot.accuracy}%</p>
                <p className={`text-sm ${slot.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  P&L: ₹{slot.pnl?.toFixed(2) || 0}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failure Analysis */}
      {failureAnalysis && failureAnalysis.totalFailures > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-bold text-red-400 mb-3">❌ Failure Analysis ({failureAnalysis.totalFailures} failures)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-2">Failure Reasons:</p>
              {Object.entries(failureAnalysis.reasons).map(([reason, count]) => (
                <div key={reason} className="flex justify-between bg-gray-800 p-2 rounded mb-1">
                  <span className="text-sm text-gray-300">{reason}</span>
                  <span className="text-sm text-red-400">{count}x</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Condition Analysis in Failures:</p>
              {failureAnalysis.conditionAnalysis && Object.entries(failureAnalysis.conditionAnalysis).map(([key, val]) => (
                <div key={key} className="flex justify-between bg-gray-800 p-2 rounded mb-1 text-xs">
                  <span className="text-gray-300">{key}</span>
                  <span>
                    <span className="text-green-400">✅{val.matched}</span>
                    {' / '}
                    <span className="text-red-400">❌{val.notMatched}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformancePage;