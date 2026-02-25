import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function AlertsPage({ alerts: liveAlerts }) {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('');
  const [newAlert, setNewAlert] = useState({
    alertType: 'PRICE', index: 'NIFTY', condition: 'ABOVE', triggerValue: '', message: '', severity: 'MEDIUM'
  });

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      const params = {};
      if (filter) params.type = filter;
      const res = await axios.get('/api/alert/all', { params });
      if (res.data.success) setAlerts(res.data.data);
    } catch (error) {
      console.log('Alerts Error:', error.message);
    }
  };

  const createAlert = async () => {
    if (!newAlert.triggerValue || !newAlert.message) return toast.error('Fill all fields');
    try {
      await axios.post('/api/alert/create', {
        ...newAlert,
        triggerValue: parseFloat(newAlert.triggerValue)
      });
      toast.success('Alert created!');
      setNewAlert({ alertType: 'PRICE', index: 'NIFTY', condition: 'ABOVE', triggerValue: '', message: '', severity: 'MEDIUM' });
      fetchAlerts();
    } catch (error) {
      toast.error('Failed');
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put('/api/alert/read-all');
      fetchAlerts();
    } catch (error) {
      toast.error('Failed');
    }
  };

  const cleanup = async () => {
    try {
      await axios.delete('/api/alert/cleanup');
      toast.success('Old alerts cleaned');
      fetchAlerts();
    } catch (error) {
      toast.error('Failed');
    }
  };

  const severityEmoji = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">🔔 Alerts</h1>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
            ✓ Mark All Read
          </button>
          <button onClick={cleanup} className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500">
            🗑️ Cleanup
          </button>
        </div>
      </div>

      {/* Create Alert */}
      <div className="card p-4 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">➕ Create Alert</h3>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          <select value={newAlert.alertType} onChange={e => setNewAlert({ ...newAlert, alertType: e.target.value })}
            className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600">
            <option value="PRICE">Price</option>
            <option value="OI_CHANGE">OI Change</option>
            <option value="IV_SPIKE">IV Spike</option>
            <option value="PCR_CHANGE">PCR Change</option>
            <option value="VIX_SPIKE">VIX Spike</option>
          </select>
          <select value={newAlert.index} onChange={e => setNewAlert({ ...newAlert, index: e.target.value })}
            className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600">
            <option value="NIFTY">NIFTY</option>
            <option value="BANKNIFTY">BANKNIFTY</option>
            <option value="FINNIFTY">FINNIFTY</option>
          </select>
          <select value={newAlert.condition} onChange={e => setNewAlert({ ...newAlert, condition: e.target.value })}
            className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600">
            <option value="ABOVE">Above</option>
            <option value="BELOW">Below</option>
          </select>
          <input type="number" placeholder="Value" value={newAlert.triggerValue}
            onChange={e => setNewAlert({ ...newAlert, triggerValue: e.target.value })}
            className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600" />
          <input type="text" placeholder="Message" value={newAlert.message}
            onChange={e => setNewAlert({ ...newAlert, message: e.target.value })}
            className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600" />
          <select value={newAlert.severity} onChange={e => setNewAlert({ ...newAlert, severity: e.target.value })}
            className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-600">
            <option value="HIGH">🔴 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>
          <button onClick={createAlert} className="bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600">
            Create
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['', 'PRICE', 'OI_CHANGE', 'IV_SPIKE', 'PNL_ALERT', 'MARGIN_WARNING'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs ${
              filter === f ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}>
            {f || 'All'}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="card p-4">
        {alerts.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No alerts</p>
        ) : (
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a._id} className={`flex items-center gap-3 p-3 rounded-lg ${
                a.isRead ? 'bg-gray-800' : 'bg-gray-800 border border-yellow-500 border-opacity-30'
              }`}>
                <span className="text-lg">{severityEmoji[a.severity]}</span>
                <div className="flex-1">
                  <p className={`text-sm ${a.isRead ? 'text-gray-400' : 'text-white'}`}>{a.message}</p>
                  <p className="text-xs text-gray-500">
                    {a.alertType} | {new Date(a.createdAt).toLocaleString()}
                    {a.isTriggered && ' | ✅ Triggered'}
                    {a.sentViaTelegram && ' | 📱 Telegram Sent'}
                  </p>
                </div>
                {!a.isRead && (
                  <button onClick={async () => {
                    await axios.put(`/api/alert/read/${a._id}`);
                    fetchAlerts();
                  }} className="text-xs text-blue-400 hover:text-blue-300">
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertsPage;