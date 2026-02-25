import React, { useState, useEffect } from 'react';
import axios from 'axios';

function OptionChainPage({ socket }) {
  const [index, setIndex] = useState('NIFTY');
  const [optionChain, setOptionChain] = useState(null);
  const [oiAnalysis, setOiAnalysis] = useState(null);
  const [ivAnalysis, setIvAnalysis] = useState(null);
  const [pcr, setPcr] = useState(null);
  const [maxPain, setMaxPain] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);

    if (socket) {
      socket.on('optionChainUpdate', (data) => {
        if (data.index === index) fetchData();
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) socket.off('optionChainUpdate');
    };
  }, [index]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ocRes, oiRes, ivRes, pcrRes, mpRes] = await Promise.all([
        axios.get(`/api/option-chain/${index}`),
        axios.get(`/api/option-chain/oi-analysis/${index}`),
        axios.get(`/api/option-chain/iv-analysis/${index}`),
        axios.get(`/api/option-chain/pcr/${index}`),
        axios.get(`/api/option-chain/maxpain/${index}`)
      ]);

      if (ocRes.data.success) setOptionChain(ocRes.data.data);
      if (oiRes.data.success) setOiAnalysis(oiRes.data);
      if (ivRes.data.success) setIvAnalysis(ivRes.data);
      if (pcrRes.data.success) setPcr(pcrRes.data);
      if (mpRes.data.success) setMaxPain(mpRes.data);
    } catch (error) {
      console.log('OC Error:', error.message);
    }
    setLoading(false);
  };

  const getOIColor = (oiChange) => {
    if (oiChange > 500000) return 'bg-green-500 bg-opacity-30';
    if (oiChange > 100000) return 'bg-green-500 bg-opacity-15';
    if (oiChange < -500000) return 'bg-red-500 bg-opacity-30';
    if (oiChange < -100000) return 'bg-red-500 bg-opacity-15';
    return '';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">⛓️ Option Chain Analyzer</h1>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="card p-3">
          <p className="text-xs text-gray-400">SPOT PRICE</p>
          <p className="text-lg font-bold text-white">{optionChain?.spotPrice || '--'}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-400">PCR</p>
          <p className={`text-lg font-bold ${
            pcr?.signal === 'BULLISH' ? 'text-green-400' :
            pcr?.signal === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {pcr?.pcr || '--'} ({pcr?.signal || '--'})
          </p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-400">MAX PAIN</p>
          <p className="text-lg font-bold text-blue-400">{maxPain?.maxPain || '--'}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-400">ATM IV</p>
          <p className="text-lg font-bold text-purple-400">{ivAnalysis?.atmIV?.toFixed(1) || '--'}%</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-400">STRADDLE</p>
          <p className="text-lg font-bold text-orange-400">₹{ivAnalysis?.straddlePrice?.toFixed(1) || '--'}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-400">EXPECTED MOVE</p>
          <p className="text-lg font-bold text-cyan-400">±{ivAnalysis?.expectedMove?.toFixed(0) || '--'}</p>
        </div>
      </div>

      {/* Support/Resistance */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-4 glow-green">
          <p className="text-xs text-gray-400 mb-1">SUPPORT (Highest PE OI)</p>
          <p className="text-2xl font-bold text-green-400">{oiAnalysis?.support?.strike || '--'}</p>
          <p className="text-xs text-gray-500">OI: {((oiAnalysis?.support?.oi || 0) / 100000).toFixed(1)}L</p>
        </div>
        <div className="card p-4 glow-red">
          <p className="text-xs text-gray-400 mb-1">RESISTANCE (Highest CE OI)</p>
          <p className="text-2xl font-bold text-red-400">{oiAnalysis?.resistance?.strike || '--'}</p>
          <p className="text-xs text-gray-500">OI: {((oiAnalysis?.resistance?.oi || 0) / 100000).toFixed(1)}L</p>
        </div>
      </div>

      {/* OI Spurts */}
      {oiAnalysis?.oiSpurts && oiAnalysis.oiSpurts.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-bold text-yellow-400 mb-3">⚡ OI Spurts</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {oiAnalysis.oiSpurts.map((spurt, i) => (
              <div key={i} className="bg-gray-800 p-2 rounded text-xs">
                <p className="text-white font-bold">{spurt.strike}</p>
                <p className={spurt.ceOIChange > 0 ? 'text-red-400' : 'text-green-400'}>
                  CE: {(spurt.ceOIChange / 100000).toFixed(1)}L
                </p>
                <p className={spurt.peOIChange > 0 ? 'text-green-400' : 'text-red-400'}>
                  PE: {(spurt.peOIChange / 100000).toFixed(1)}L
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Option Chain Table */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-white mb-3">📋 Option Chain Data</h3>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : optionChain?.strikes ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="py-2 text-right">OI Change</th>
                  <th className="py-2 text-right">OI</th>
                  <th className="py-2 text-right">Volume</th>
                  <th className="py-2 text-right">IV</th>
                  <th className="py-2 text-right">LTP</th>
                  <th className="py-2 text-center bg-gray-800 text-yellow-400">STRIKE</th>
                  <th className="py-2 text-left">LTP</th>
                  <th className="py-2 text-left">IV</th>
                  <th className="py-2 text-left">Volume</th>
                  <th className="py-2 text-left">OI</th>
                  <th className="py-2 text-left">OI Change</th>
                </tr>
              </thead>
              <tbody>
                {optionChain.strikes
                  .filter(s => {
                    const diff = Math.abs(s.strikePrice - optionChain.spotPrice);
                    const range = index === 'BANKNIFTY' ? 2000 : 1000;
                    return diff <= range;
                  })
                  .map((strike, i) => {
                    const isATM = Math.abs(strike.strikePrice - optionChain.spotPrice) < (index === 'BANKNIFTY' ? 100 : 50);
                    const isITMCE = strike.strikePrice < optionChain.spotPrice;
                    const isITMPE = strike.strikePrice > optionChain.spotPrice;

                    return (
                      <tr key={i} className={`border-b border-gray-800 hover:bg-gray-800 ${isATM ? 'bg-yellow-500 bg-opacity-10' : ''}`}>
                        {/* CE Side */}
                        <td className={`py-1.5 text-right ${getOIColor(strike.ce.oiChange)} ${isITMCE ? 'bg-blue-500 bg-opacity-5' : ''}`}>
                          <span className={strike.ce.oiChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {(strike.ce.oiChange / 1000).toFixed(0)}K
                          </span>
                        </td>
                        <td className={`py-1.5 text-right ${isITMCE ? 'bg-blue-500 bg-opacity-5' : ''}`}>
                          <span className="text-gray-300">{(strike.ce.oi / 100000).toFixed(1)}L</span>
                        </td>
                        <td className={`py-1.5 text-right ${isITMCE ? 'bg-blue-500 bg-opacity-5' : ''}`}>
                          <span className="text-gray-400">{(strike.ce.volume / 1000).toFixed(0)}K</span>
                        </td>
                        <td className={`py-1.5 text-right ${isITMCE ? 'bg-blue-500 bg-opacity-5' : ''}`}>
                          <span className="text-purple-400">{strike.ce.iv.toFixed(1)}</span>
                        </td>
                        <td className={`py-1.5 text-right font-medium ${isITMCE ? 'bg-blue-500 bg-opacity-5' : ''}`}>
                          <span className="text-green-400">₹{strike.ce.ltp.toFixed(1)}</span>
                        </td>

                        {/* Strike */}
                        <td className={`py-1.5 text-center font-bold bg-gray-800 ${isATM ? 'text-yellow-400' : 'text-white'}`}>
                          {strike.strikePrice}
                        </td>

                        {/* PE Side */}
                        <td className={`py-1.5 text-left font-medium ${isITMPE ? 'bg-blue-500 bg-opacity-5' : ''}`}>
                          <span className="text-red-400">₹{strike.pe.ltp.toFixed(1)}</span>
                        </td>
                        <td className={`py-1.5 text-left ${isITMPE ? 'bg-blue-500 bg-opacity-5' : ''}`}>
                          <span className="text-purple-400">{strike.pe.iv.toFixed(1)}</span>
                        </td>
                        <td className={`py-1.5 text-left ${isITMPE ? 'bg-blue-500 bg-opacity-5' : ''}`}>
                          <span className="text-gray-400">{(strike.pe.volume / 1000).toFixed(0)}K</span>
                        </td>
                        <td className={`py-1.5 text-left ${isITMPE ? 'bg-blue-500 bg-opacity-5' : ''}`}>
                          <span className="text-gray-300">{(strike.pe.oi / 100000).toFixed(1)}L</span>
                        </td>
                        <td className={`py-1.5 text-left ${getOIColor(strike.pe.oiChange)} ${isITMPE ? 'bg-blue-500 bg-opacity-5' : ''}`}>
                          <span className={strike.pe.oiChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {(strike.pe.oiChange / 1000).toFixed(0)}K
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">No data available</p>
        )}
      </div>
    </div>
  );
}

export default OptionChainPage;