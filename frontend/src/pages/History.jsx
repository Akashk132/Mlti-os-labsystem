import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/deployment-history')
      .then(res => res.json())
      .then(data => setHistory(data.history || []))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Deployment Audit Log</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <ul className="divide-y divide-slate-200">
          {history.map((log, i) => (
            <li key={i} className="py-4 flex">
              <div className="mr-4 mt-1">
                <Clock className="text-slate-400 h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="text-sm font-semibold text-slate-800 uppercase">{log.action}</h4>
                  <span className="text-sm text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Triggered on <span className="font-semibold">{log.node_id}</span> ({log.os_type})
                </p>
                <div className="mt-2 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${log.result === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100'}`}>
                    {log.result}
                  </span>
                </div>
              </div>
            </li>
          ))}
          {history.length === 0 && (
             <li className="py-8 text-center text-slate-500">No deployment actions recorded yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
