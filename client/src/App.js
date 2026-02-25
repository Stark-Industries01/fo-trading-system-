import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import OptionChainPage from './pages/OptionChainPage';
import TechnicalCharts from './pages/TechnicalCharts';
import FiiDiiPage from './pages/FiiDiiPage';
import SuggestionsPage from './pages/SuggestionsPage';
import SuggestionHistory from './pages/SuggestionHistory';
import PerformancePage from './pages/PerformancePage';
import TradesPage from './pages/TradesPage';
import JournalPage from './pages/JournalPage';
import AlertsPage from './pages/AlertsPage';
import NewsPage from './pages/NewsPage';
import ScannerPage from './pages/ScannerPage';
import SettingsPage from './pages/SettingsPage';
import { toast } from 'react-toastify';

const socket = io('http://localhost:5000');

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [marketData, setMarketData] = useState({});

  useEffect(() => {
    socket.on('connect', () => {
      console.log('🔌 Connected to server');
    });

    socket.on('newSuggestion', (data) => {
      toast.success(`🟢 New Suggestion: ${data.index} ${data.strikePrice} ${data.optionType}`, {
        autoClose: 10000
      });
    });

    socket.on('suggestionUpdate', (data) => {
      if (data.status === 'T1_HIT') toast.success(`🎯 T1 HIT! ${data.suggestionId}`);
      if (data.status === 'T2_HIT') toast.success(`🎯🎯 T2 HIT! ${data.suggestionId}`);
      if (data.status === 'T3_HIT') toast.success(`🎯🎯🎯 T3 HIT! ${data.suggestionId}`);
      if (data.status === 'SL_HIT') toast.error(`🛑 SL HIT! ${data.suggestionId}`);
    });

    socket.on('newAlert', (data) => {
      setAlerts(prev => [data, ...prev]);
      if (data.severity === 'HIGH') {
        toast.warn(`⚠️ ${data.message}`);
      }
    });

    socket.on('marketUpdate', (data) => {
      setMarketData(data);
    });

    socket.on('importantNews', (data) => {
      const emoji = data.impact === 'BULLISH' ? '🟢' : data.impact === 'BEARISH' ? '🔴' : '🟡';
      toast.info(`${emoji} NEWS: ${data.title}`, { autoClose: 8000 });
    });

    return () => {
      socket.off('connect');
      socket.off('newSuggestion');
      socket.off('suggestionUpdate');
      socket.off('newAlert');
      socket.off('marketUpdate');
      socket.off('importantNews');
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} alerts={alerts} />
      
      <div className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-4">
          <Routes>
            <Route path="/" element={<Dashboard socket={socket} marketData={marketData} />} />
            <Route path="/option-chain" element={<OptionChainPage socket={socket} />} />
            <Route path="/charts" element={<TechnicalCharts />} />
            <Route path="/fii-dii" element={<FiiDiiPage />} />
            <Route path="/suggestions" element={<SuggestionsPage socket={socket} />} />
            <Route path="/suggestion-history" element={<SuggestionHistory />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/trades" element={<TradesPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/alerts" element={<AlertsPage alerts={alerts} />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/scanner" element={<ScannerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;