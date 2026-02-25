import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function TradesPage() {
  const [trades, setTrades] = useState([]);
  const [openTrades, setOpenTrades] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTrade, setNewTrade] = useState({
    index: 'NIFTY', optionType: 'CE', strikePrice: '', expiryDate: '',
    entryPrice: '', lotSize: 25, numberOfLots: 1, target1: '', target2: '',
    target3: '', stopLoss: '', strategy: 'SUGGESTION_BASED', broker: 'DHAN'
  });

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const [allRes, openRes, summaryRes] = await Promise.all([
        axios.get('/api/trade/all'),
        axios.get('/api/trade/open'),
        axios.get('/api/trade/summary/daily')
      ]);

      if (allRes.data.success) setTrades(allRes.data.data);
      if (openRes.data.success) setOpenTrades(openRes.data.data);
      if (summaryRes.data.success) setDailySummary(summaryRes.data.summary);
    } catch (error) {
      console.log('Trades Error:', error.message);
    }
  };

  const createTrade = async () => {
    try {
      const lotSize = newTrade.index === 'BANKNIFTY' ? 15 : newTrade.index === 'NIFTY' ? 25 : 25;
      const tradeData = {
        ...newTrade,
        lotSize,
        totalQuantity: lotSize * newTrade.numberOfLots,
        entryTime: new Date(),
        strikePrice: parseFloat(newTrade.strikePrice),
        entryPrice: parseFloat(newTrade.entryPrice),
        target1: parseFloat(newTrade.target1),
        target2: parseFloat(newTrade.target2),
        target3: parseFloat(newTrade.target3),
        stopLoss: parseFloat(newTrade.stopLoss),
        capitalUsed: parseFloat(newTrade.entryPrice) * lotSize * newTrade.numberOfLots,
        riskAmount: (parseFloat(newTrade.entryPrice) - parseFloat(newTrade.stopLoss)) * lotSize * newTrade.numberOfLots
      };

      const res = await axios.post('/api/trade/create', tradeData);
      if (res.data.success) {
        toast.success('Trade created!');
        setShowCreate(false);
        fetchTrades();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error('Failed to create trade');
    }
  };

  const closeTrade = async (tradeId) => {
    const exitPrice = prompt('Exit Price Enter Karo:');
    if (!exitPrice) return;

    try {
      const res = await axios.put(`/api/trade/close/${tradeId}`, {
        exitPrice: parseFloat(exitPrice),
        exitReason: 'MANUAL'
      });
      if (res.data.success) {
        toast.success(`Trade closed! P&L: ₹${res.data.data.netPnl.toFixed(2)}`);
        fetchTrades();
      }
    } catch (error) {
      toast.error('Failed to close');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">💰 Trades</h1>
        <button onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
          {showCreate ? '✕ Cancel' : '+ New Trade'}
        </button>
      </div>

      {/* Daily Summary */}
      {dailySummary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="card p-3">
            <p className="text-xs text-gray-400">Today's Trades</p>
            <p className="text-xl font-bold text-white">{dailySummary.totalTrades}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">Wins</p>
            <p className="text-xl font-bold text-green-400">{dailySummary.wins}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">Losses</p>
            <p className="text-xl font-bold text-red-400">{dailySummary.losses}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">Win Rate</p>
            <p className="text-xl font-bold text-blue-400">{dailySummary.winRate}%</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-400">Today P&L</p>
            <p className={`text-xl font-bold ${parseFloat(dailySummary.totalPnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ₹{dailySummary.totalPnl}
            </p>
          </div>
        </div>
      )}

      {/* Create Trade Form */}
      {showCreate && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">📝 New Trade</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <select value={newTrade.index} onChange={e => setNewTrade({ ...newTrade, index: e.target.value })}
              className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600">
              <option value="NIFTY">NIFTY</option>
              <option value="BANKNIFTY">BANKNIFTY</option>
              <option value="FINNIFTY">FINNIFTY</option>
              <option value="MIDCPNIFTY">MIDCPNIFTY</option>
              <option value="NIFTYIT">NIFTY IT</option>
            </select>
            <select value={newTrade.optionType} onChange={e => setNewTrade({ ...newTrade, optionType: e.target.value })}
              className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600">
              <option value="CE">CE (Call)</option>
              <option value="PE">PE (Put)</option>
            </select>
            <input type="number" placeholder="Strike Price" value={newTrade.strikePrice}
              onChange={e => setNewTrade({ ...newTrade, strikePrice: e.target.value })}
              className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600" />
            <input type="date" value={newTrade.expiryDate}
              onChange={e => setNewTrade({ ...newTrade, expiryDate: e.target.value })}
              className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
            <input type="number" placeholder="Entry Price" value={newTrade.entryPrice}
              onChange={e => setNewTrade({ ...newTrade, entryPrice: e.target.value })}
              className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600" />
            <input type="number" placeholder="Target 1" value={newTrade.target1}
              onChange={e => setNewTrade({ ...newTrade, target1: e.target.value })}
              className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600" />
            <input type="number" placeholder="Target 2" value={newTrade.target2}
              onChange={e => setNewTrade({ ...newTrade, target2: e.target.value })}
              className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600" />
            <input type="number" placeholder="Target 3" value={newTrade.target3}
              onChange={e => setNewTrade({ ...newTrade, target3: e.target.value })}
              className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600" />
            <input type="number" placeholder="Stop Loss" value={newTrade.stopLoss}
              onChange={e => setNewTrade({ ...newTrade, stopLoss: e.target.value })}
              className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <input type="number" placeholder="Number of Lots" value={newTrade.numberOfLots} min="1"
              onChange={e => setNewTrade({ ...newTrade, numberOfLots: parseInt(e.target.value) })}
              className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600" />
            <select value={newTrade.strategy} onChange={e => setNewTrade({ ...newTrade, strategy: e.target.value })}
              className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600">
              <option value="SUGGESTION_BASED">Suggestion Based</option>
              <option value="TREND_FOLLOW">Trend Follow</option>
              <option value="BREAKOUT">Breakout</option>
              <option value="REVERSAL">Reversal</option>
              <option value="SCALPING">Scalping</option>
            </select>
            <button onClick={createTrade}
              className="bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600">
              ✅ Create Trade
            </button>
          </div>

          {/* Risk Preview */}
          {newTrade.entryPrice && newTrade.stopLoss && (
            <div className="bg-gray-800 p-3 rounded mt-2">
              <p className="text-xs text-gray-400">
                Risk per lot: ₹{((parseFloat(newTrade.entryPrice) - parseFloat(newTrade.stopLoss)) *
                  (newTrade.index === 'BANKNIFTY' ? 15 : 25)).toFixed(2)}
                {' | '}
                Total Risk: ₹{((parseFloat(newTrade.entryPrice) - parseFloat(newTrade.stopLoss)) *
                  (newTrade.index === 'BANKNIFTY' ? 15 : 25) * newTrade.numberOfLots).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Open Trades */}
      {openTrades.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">📌 Open Trades ({openTrades.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {openTrades.map(t => (
              <div key={t.tradeId} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    t.optionType === 'CE' ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-red-500 bg-opacity-20 text-red-400'
                  }`}>
                    {t.index} {t.strikePrice} {t.optionType}
                  </span>
                  <button onClick={() => closeTrade(t.tradeId)}
                    className="px-3 py-1 bg-red-500 bg-opacity-20 text-red-400 rounded text-xs hover:bg-opacity-40">
                    Close Trade
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Entry</p>
                    <p className="text-white font-bold">₹{t.entryPrice}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Qty</p>
                    <p className="text-white font-bold">{t.totalQuantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">SL</p>
                    <p className="text-red-400 font-bold">₹{t.stopLoss}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{new Date(t.entryTime).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Trades History */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-white mb-3">📋 Trade History</h3>
        {trades.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No trades yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="py-2 text-left">Date</th>
                  <th className="py-2 text-left">Index</th>
                  <th className="py-2 text-center">Strike</th>
                  <th className="py-2 text-center">Type</th>
                  <th className="py-2 text-right">Entry</th>
                  <th className="py-2 text-right">Exit</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">P&L</th>
                  <th className="py-2 text-right">P&L %</th>
                  <th className="py-2 text-center">Status</th>
                  <th className="py-2 text-center">Strategy</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t.tradeId} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="py-2 text-gray-300">{new Date(t.dateTime).toLocaleDateString()}</td>
                    <td className="py-2 text-white font-medium">{t.index}</td>
                    <td className="py-2 text-center text-white">{t.strikePrice}</td>
                    <td className="py-2 text-center">
                      <span className={t.optionType === 'CE' ? 'text-green-400' : 'text-red-400'}>{t.optionType}</span>
                    </td>
                    <td className="py-2 text-right text-white">₹{t.entryPrice}</td>
                    <td className="py-2 text-right text-white">{t.exitPrice ? `₹${t.exitPrice}` : '-'}</td>
                    <td className="py-2 text-right text-gray-300">{t.totalQuantity}</td>
                    <td className={`py-2 text-right font-bold ${(t.netPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ₹{(t.netPnl || 0).toFixed(2)}
                    </td>
                    <td className={`py-2 text-right ${(t.pnlPercentage || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(t.pnlPercentage || 0).toFixed(1)}%
                    </td>
                    <td className="py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        t.status === 'OPEN' ? 'bg-blue-500 bg-opacity-20 text-blue-400' : 'bg-gray-500 bg-opacity-20 text-gray-400'
                      }`}>{t.status}</span>
                    </td>
                    <td className="py-2 text-center text-gray-400">{t.strategy}</td>
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

export default TradesPage;