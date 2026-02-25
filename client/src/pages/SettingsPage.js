import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('capital');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      if (res.data.success) setSettings(res.data.data);
    } catch (error) {
      console.log('Settings Error:', error.message);
    }
  };

  const saveCapital = async () => {
    try {
      await axios.put('/api/settings/capital', settings.capital);
      toast.success('Capital settings saved!');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const saveBroker = async () => {
    try {
      await axios.put('/api/settings/broker', settings.broker);
      toast.success('Broker settings saved!');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const saveTelegram = async () => {
    try {
      const res = await axios.put('/api/settings/telegram', settings.telegram);
      if (res.data.telegramTest) {
        toast.info(`Telegram: ${res.data.telegramTest}`);
      } else {
        toast.success('Telegram settings saved!');
      }
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const saveTradingHours = async () => {
    try {
      await axios.put('/api/settings/trading-hours', settings.tradingHours);
      toast.success('Trading hours saved!');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const downloadBackup = async () => {
    try {
      const res = await axios.get('/api/settings/backup');
      if (res.data.success) {
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fo-trading-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        toast.success('Backup downloaded!');
      }
    } catch (error) {
      toast.error('Backup failed');
    }
  };

  const restoreBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        await axios.post('/api/settings/restore', data);
        toast.success('Data restored!');
        fetchSettings();
      } catch (error) {
        toast.error('Restore failed');
      }
    };
    reader.readAsText(file);
  };

  if (!settings) return <div className="text-center text-gray-400 py-20">Loading settings...</div>;

  const tabs = [
    { id: 'capital', label: '💰 Capital', icon: '💰' },
    { id: 'broker', label: '🏦 Broker', icon: '🏦' },
    { id: 'telegram', label: '📱 Telegram', icon: '📱' },
    { id: 'trading', label: '⏰ Trading Hours', icon: '⏰' },
    { id: 'backup', label: '💾 Backup', icon: '💾' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">⚙️ Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Capital Settings */}
      {activeTab === 'capital' && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-4">💰 Capital & Risk Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Total Capital (₹)</label>
              <input type="number" value={settings.capital.totalCapital}
                onChange={e => setSettings({ ...settings, capital: { ...settings.capital, totalCapital: parseInt(e.target.value) } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600 text-lg" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Max Risk Per Trade (%)</label>
              <input type="number" value={settings.capital.maxRiskPerTrade} step="0.5" min="0.5" max="5"
                onChange={e => setSettings({ ...settings, capital: { ...settings.capital, maxRiskPerTrade: parseFloat(e.target.value) } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600" />
              <p className="text-xs text-gray-500 mt-1">Max ₹{(settings.capital.totalCapital * settings.capital.maxRiskPerTrade / 100).toFixed(0)} per trade</p>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Daily Loss Limit (%)</label>
              <input type="number" value={settings.capital.dailyLossLimit} step="1" min="1" max="10"
                onChange={e => setSettings({ ...settings, capital: { ...settings.capital, dailyLossLimit: parseFloat(e.target.value) } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600" />
              <p className="text-xs text-gray-500 mt-1">Max ₹{(settings.capital.totalCapital * settings.capital.dailyLossLimit / 100).toFixed(0)} daily loss</p>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Weekly Loss Limit (%)</label>
              <input type="number" value={settings.capital.weeklyLossLimit} step="1" min="1" max="15"
                onChange={e => setSettings({ ...settings, capital: { ...settings.capital, weeklyLossLimit: parseFloat(e.target.value) } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Max Open Positions</label>
              <input type="number" value={settings.capital.maxOpenPositions} min="1" max="10"
                onChange={e => setSettings({ ...settings, capital: { ...settings.capital, maxOpenPositions: parseInt(e.target.value) } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Default Lot Size</label>
              <input type="number" value={settings.capital.defaultLotSize} min="1" max="50"
                onChange={e => setSettings({ ...settings, capital: { ...settings.capital, defaultLotSize: parseInt(e.target.value) } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600" />
            </div>
          </div>
          <button onClick={saveCapital} className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600">
            💾 Save Capital Settings
          </button>
        </div>
      )}

      {/* Broker Settings */}
      {activeTab === 'broker' && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-4">🏦 Broker API Settings</h3>
          <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-lg p-3 mb-4">
            <p className="text-yellow-400 text-sm">⚠️ API credentials safe hain. Server side encrypted storage me jayenge.</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Broker</label>
              <select value={settings.broker.name}
                onChange={e => setSettings({ ...settings, broker: { ...settings.broker, name: e.target.value } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600">
                <option value="DHAN">Dhan</option>
                <option value="UPSTOX">Upstox</option>
                <option value="ANGEL">Angel One</option>
                <option value="FYERS">Fyers</option>
                <option value="ZERODHA">Zerodha</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Client ID</label>
              <input type="text" value={settings.broker.clientId || ''} placeholder="Enter Client ID"
                onChange={e => setSettings({ ...settings, broker: { ...settings.broker, clientId: e.target.value } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Access Token</label>
              <input type="password" value={settings.broker.accessToken || ''} placeholder="Enter Access Token"
                onChange={e => setSettings({ ...settings, broker: { ...settings.broker, accessToken: e.target.value } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600" />
            </div>
          </div>
          <button onClick={saveBroker} className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600">
            💾 Save Broker Settings
          </button>
        </div>
      )}

      {/* Telegram Settings */}
      {activeTab === 'telegram' && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-4">📱 Telegram Bot Settings</h3>
          <div className="bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-lg p-3 mb-4">
            <p className="text-blue-400 text-sm">
              📋 Steps: 1) Telegram me @BotFather se bot banao 2) /newbot command do 3) Token copy karo
              4) Apne bot ko message karo 5) @userinfobot se Chat ID lo
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400">Enable Telegram</label>
              <button onClick={() => setSettings({
                ...settings, telegram: { ...settings.telegram, enabled: !settings.telegram.enabled }
              })} className={`w-12 h-6 rounded-full transition-all ${
                settings.telegram.enabled ? 'bg-green-500' : 'bg-gray-600'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-all ${
                  settings.telegram.enabled ? 'ml-6' : 'ml-0.5'
                }`}></div>
              </button>
              <span className={settings.telegram.enabled ? 'text-green-400 text-sm' : 'text-gray-400 text-sm'}>
                {settings.telegram.enabled ? 'ON' : 'OFF'}
              </span>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Bot Token</label>
              <input type="text" value={settings.telegram.botToken || ''} placeholder="123456:ABC-DEF..."
                onChange={e => setSettings({ ...settings, telegram: { ...settings.telegram, botToken: e.target.value } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Chat ID</label>
              <input type="text" value={settings.telegram.chatId || ''} placeholder="Your Chat ID"
                onChange={e => setSettings({ ...settings, telegram: { ...settings.telegram, chatId: e.target.value } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600" />
            </div>
          </div>
          <button onClick={saveTelegram} className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600">
            💾 Save & Test Telegram
          </button>
        </div>
      )}

      {/* Trading Hours */}
      {activeTab === 'trading' && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-4">⏰ Trading Hours Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Market Start Time</label>
              <input type="time" value={settings.tradingHours.startTime}
                onChange={e => setSettings({ ...settings, tradingHours: { ...settings.tradingHours, startTime: e.target.value } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Market End Time</label>
              <input type="time" value={settings.tradingHours.endTime}
                onChange={e => setSettings({ ...settings, tradingHours: { ...settings.tradingHours, endTime: e.target.value } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Avoid First X Minutes</label>
              <input type="number" value={settings.tradingHours.avoidFirstMinutes} min="0" max="60"
                onChange={e => setSettings({ ...settings, tradingHours: { ...settings.tradingHours, avoidFirstMinutes: parseInt(e.target.value) } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Avoid Last X Minutes</label>
              <input type="number" value={settings.tradingHours.avoidLastMinutes} min="0" max="60"
                onChange={e => setSettings({ ...settings, tradingHours: { ...settings.tradingHours, avoidLastMinutes: parseInt(e.target.value) } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Lunch Start</label>
              <input type="time" value={settings.tradingHours.lunchStart}
                onChange={e => setSettings({ ...settings, tradingHours: { ...settings.tradingHours, lunchStart: e.target.value } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Lunch End</label>
              <input type="time" value={settings.tradingHours.lunchEnd}
                onChange={e => setSettings({ ...settings, tradingHours: { ...settings.tradingHours, lunchEnd: e.target.value } })}
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="text-sm text-gray-400">Avoid Lunch Hour</label>
            <button onClick={() => setSettings({
              ...settings, tradingHours: { ...settings.tradingHours, avoidLunch: !settings.tradingHours.avoidLunch }
            })} className={`w-12 h-6 rounded-full transition-all ${
              settings.tradingHours.avoidLunch ? 'bg-green-500' : 'bg-gray-600'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-all ${
                settings.tradingHours.avoidLunch ? 'ml-6' : 'ml-0.5'
              }`}></div>
            </button>
          </div>
          <button onClick={saveTradingHours} className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600">
            💾 Save Trading Hours
          </button>
        </div>
      )}

      {/* Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-4">💾 Backup & Restore</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              <p className="text-4xl mb-3">📥</p>
              <h4 className="text-white font-bold mb-2">Download Backup</h4>
              <p className="text-gray-400 text-sm mb-4">Sare suggestions, trades, settings ka backup download karo</p>
              <button onClick={downloadBackup} className="px-6 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600">
                📥 Download Backup
              </button>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              <p className="text-4xl mb-3">📤</p>
              <h4 className="text-white font-bold mb-2">Restore Backup</h4>
              <p className="text-gray-400 text-sm mb-4">Pehle ka backup file upload karke restore karo</p>
              <label className="px-6 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 cursor-pointer">
                📤 Upload & Restore
                <input type="file" accept=".json" onChange={restoreBackup} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;