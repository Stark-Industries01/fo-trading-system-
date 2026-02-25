import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/option-chain', label: 'Option Chain', icon: '⛓️' },
  { path: '/charts', label: 'Charts', icon: '📈' },
  { path: '/fii-dii', label: 'FII/DII', icon: '🏦' },
  { path: '/suggestions', label: 'Suggestions', icon: '🤖' },
  { path: '/suggestion-history', label: 'History', icon: '📜' },
  { path: '/performance', label: 'Performance', icon: '🏆' },
  { path: '/trades', label: 'Trades', icon: '💰' },
  { path: '/journal', label: 'Journal', icon: '📔' },
  { path: '/alerts', label: 'Alerts', icon: '🔔' },
  { path: '/news', label: 'News', icon: '📰' },
  { path: '/scanner', label: 'Scanner', icon: '🔍' },
  { path: '/settings', label: 'Settings', icon: '⚙️' }
];

function Sidebar({ isOpen, toggle, alerts }) {
  const location = useLocation();
  const unreadAlerts = alerts ? alerts.filter(a => !a.isRead).length : 0;

  return (
    <div className={`fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-700 z-50 transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {isOpen && (
          <div>
            <h1 className="text-lg font-bold text-green-400">F&O Trading</h1>
            <p className="text-xs text-gray-400">System v1.0</p>
          </div>
        )}
        <button onClick={toggle} className="text-gray-400 hover:text-white text-xl">
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      {/* Menu */}
      <nav className="mt-4 overflow-y-auto" style={{ height: 'calc(100vh - 80px)' }}>
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-3 mx-2 rounded-lg mb-1 transition-all duration-200
              ${location.pathname === item.path
                ? 'bg-green-500 bg-opacity-20 text-green-400 border-l-4 border-green-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
          >
            <span className="text-xl">{item.icon}</span>
            {isOpen && (
              <span className="ml-3 text-sm font-medium">{item.label}</span>
            )}
            {item.path === '/alerts' && unreadAlerts > 0 && isOpen && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {unreadAlerts}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;