import React, { useState, useEffect } from 'react';
import { Activity, Server as ServerIcon, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({ nodes: 0, online: 0 });
  const [recentHistory, setRecentHistory] = useState([]);

  useEffect(() => {
    // Fetch nodes
    fetch('http://localhost:8000/nodes')
      .then(res => res.json())
      .then(data => {
        const nodes = data.nodes || [];
        setStats({
          nodes: nodes.length,
          online: nodes.filter(n => n.status === 'online').length
        });
      })
      .catch(err => console.error(err));

    // Fetch history
    fetch('http://localhost:8000/deployment-history')
      .then(res => res.json())
      .then(data => setRecentHistory((data.history || []).slice(0, 5)))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Infrastructure Overview</h2>
        <a 
          href="http://localhost:3001" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-md text-sm transition-colors"
        >
          <Activity className="h-4 w-4 mr-2" />
          Open Grafana Monitoring
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
          <div className="p-4 bg-indigo-100 text-indigo-600 rounded-lg mr-4">
            <ServerIcon className="h-8 w-8" />
          </div>
          <div>
            <div className="text-slate-500 font-medium">Total Managed Nodes</div>
            <div className="text-3xl font-bold mt-1 text-slate-800">{stats.nodes}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-lg mr-4">
            <Activity className="h-8 w-8" />
          </div>
          <div>
            <div className="text-slate-500 font-medium">Online Hosts</div>
            <div className="text-3xl font-bold mt-1 text-emerald-500">{stats.online}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
          <div className="p-4 bg-rose-100 text-rose-600 rounded-lg mr-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div>
            <div className="text-slate-500 font-medium">Pending Alerts</div>
            <div className="text-3xl font-bold mt-1 text-rose-500">0</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Recent Audit Log</h3>
          <Link to="/history" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View All</Link>
        </div>
        <ul className="divide-y divide-slate-200 p-2">
          {recentHistory.map((log, i) => (
            <li key={i} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50 rounded-lg">
              <div>
                <span className="font-semibold text-sm text-slate-800 uppercase">{log.action}</span>
                <span className="text-slate-500 text-sm ml-2">on {log.node_id} ({log.os_type})</span>
              </div>
              <div className="flex items-center">
                <span className={`px-2 py-1 rounded text-xs font-semibold mr-4 ${log.result === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100'}`}>
                  {log.result}
                </span>
                <span className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            </li>
          ))}
          {recentHistory.length === 0 && (
             <li className="p-4 text-center text-slate-500 text-sm">No recent activities.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
