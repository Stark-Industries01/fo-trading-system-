import React, { useState } from 'react';
import axios from 'axios';

function ScannerPage() {
  const [scanType, setScanType] = useState('OI_GAINER');
  const [results, setResults] = useState([]);
  const [scanning, setScanning] = useState(false);

  const scanTypes = [
    { value: 'OI_GAINER', label: '📊 OI Gainers', description: 'Stocks with highest OI increase' },
    { value: 'IV_SPIKE', label: '📈 IV Spike', description: 'Unusual IV increase' },
    { value: 'VOLUME_SPIKE', label: '🔊 Volume Spike', description: 'Unusual volume activity' },
    { value: 'PRICE_BREAKOUT', label: '🚀 Breakout', description: 'Price breaking key levels' },
    { value: 'RSI_OVERSOLD', label: '📉 RSI Oversold', description: 'RSI below 30' },
    { value: 'RSI_OVERBOUGHT', label: '📈 RSI Overbought', description: 'RSI above 70' },
    { value: 'BULLISH_PATTERN', label: '🟢 Bullish Patterns', description: 'Bullish candlestick patterns' },
    { value: 'BEARISH_PATTERN', label: '🔴 Bearish Patterns', description: 'Bearish candlestick patterns' }
  ];

  const runScan = async () => {
    setScanning(true);
    try {
      // For now mock data - will connect to real APIs
      const mockResults = [
        { symbol: 'NIFTY', signal: 'BULLISH', strength: 85, reason: 'OI buildup in PE side' },
        { symbol: 'BANKNIFTY', signal: 'BEARISH', strength: 65, reason: 'CE OI increasing sharply' },
        { symbol: 'RELIANCE', signal: 'BULLISH', strength: 78, reason: 'Hammer pattern on daily' },
        { symbol: 'HDFCBANK', signal: 'NEUTRAL', strength: 50, reason: 'Sideways consolidation' },
        { symbol: 'TCS', signal: 'BULLISH', strength: 72, reason: 'Breakout above resistance' },
        { symbol: 'INFY', signal: 'BEARISH', strength: 68, reason: 'Evening star pattern' }
      ];
      setResults(mockResults);
    } catch (error) {
      console.log('Scan Error:', error.message);
    }
    setScanning(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">🔍 Market Scanner</h1>

      {/* Scan Types */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {scanTypes.map(scan => (
          <button key={scan.value} onClick={() => setScanType(scan.value)}
            className={`card p-3 text-left transition-all ${
              scanType === scan.value ? 'border-green-500 glow-green' : 'hover:bg-gray-700'
            }`}>
            <p className="text-sm font-bold text-white">{scan.label}</p>
            <p className="text-xs text-gray-400 mt-1">{scan.description}</p>
          </button>
        ))}
      </div>

      {/* Scan Button */}
      <div className="flex justify-center mb-6">
        <button onClick={runScan} disabled={scanning}
          className={`px-8 py-3 rounded-lg text-sm font-bold transition-all ${
            scanning ? 'bg-gray-600 text-gray-400' : 'bg-green-500 text-white hover:bg-green-600'
          }`}>
          {scanning ? '⏳ Scanning...' : `🔍 Run ${scanTypes.find(s => s.value === scanType)?.label} Scan`}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-bold text-white mb-3">📋 Scan Results ({results.length})</h3>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`text-lg ${
                    r.signal === 'BULLISH' ? 'text-green-400' :
                    r.signal === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {r.signal === 'BULLISH' ? '🟢' : r.signal === 'BEARISH' ? '🔴' : '🟡'}
                  </span>
                  <div>
                    <p className="text-sm text-white font-bold">{r.symbol}</p>
                    <p className="text-xs text-gray-400">{r.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      r.signal === 'BULLISH' ? 'text-green-400' : r.signal === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
                    }`}>{r.signal}</p>
                    <p className="text-xs text-gray-400">Strength: {r.strength}%</p>
                  </div>
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div className={`h-2 rounded-full ${
                      r.strength >= 70 ? 'bg-green-500' : r.strength >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} style={{ width: `${r.strength}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ScannerPage;