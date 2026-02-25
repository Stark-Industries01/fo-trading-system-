import React, { useState } from 'react';

function TechnicalCharts() {
  const [index, setIndex] = useState('NIFTY');
  const [timeframe, setTimeframe] = useState('15');

  const getSymbol = (idx) => {
    switch (idx) {
      case 'NIFTY': return 'NSE:NIFTY';
      case 'BANKNIFTY': return 'NSE:BANKNIFTY';
      case 'FINNIFTY': return 'NSE:CNXFINANCE';
      case 'MIDCPNIFTY': return 'NSE:NIFTY_MID_SELECT';
      case 'NIFTYIT': return 'NSE:CNXIT';
      case 'SENSEX': return 'BSE:SENSEX';
      default: return 'NSE:NIFTY';
    }
  };

  const getInterval = (tf) => {
    switch (tf) {
      case '5': return '5';
      case '15': return '15';
      case '75': return '60';
      case 'D': return 'D';
      case 'W': return 'W';
      case 'M': return 'M';
      default: return '15';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">📈 Technical Charts</h1>
        <div className="flex gap-2">
          {['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'NIFTYIT', 'SENSEX'].map(idx => (
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
        </div>
      </div>

      {/* Timeframe Buttons */}
      <div className="flex gap-2 mb-4">
        {[
          { label: '5m', value: '5' },
          { label: '15m', value: '15' },
          { label: '75m', value: '75' },
          { label: 'Daily', value: 'D' },
          { label: 'Weekly', value: 'W' },
          { label: 'Monthly', value: 'M' }
        ].map(tf => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              timeframe === tf.value ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* TradingView Chart */}
      <div className="card p-2 mb-4" style={{ height: '600px' }}>
        <iframe
          key={`${index}-${timeframe}`}
          src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${getSymbol(index)}&interval=${getInterval(timeframe)}&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=1e293b&studies=MAExp%4020&studies=MAExp%4050&studies=MAExp%40200&studies=RSI%40RSI&studies=MACD%40MACD&theme=dark&style=1&timezone=Asia%2FKolkata&withdateranges=1&showpopupbutton=1&locale=en`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="TradingView Chart"
          allowFullScreen
        />
      </div>

      {/* Multiple Timeframe View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['15', 'D'].map(tf => (
          <div key={tf} className="card p-2" style={{ height: '400px' }}>
            <p className="text-xs text-gray-400 p-2">{tf === '15' ? '15 Minutes' : 'Daily'} Chart</p>
            <iframe
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_${tf}&symbol=${getSymbol(index)}&interval=${getInterval(tf)}&hidesidetoolbar=1&symboledit=0&saveimage=0&studies=MAExp%4020&studies=RSI%40RSI&theme=dark&style=1&timezone=Asia%2FKolkata&locale=en`}
              style={{ width: '100%', height: '90%', border: 'none' }}
              title={`Chart ${tf}`}
              allowFullScreen
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TechnicalCharts;