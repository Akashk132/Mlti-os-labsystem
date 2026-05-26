import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Activity, Server, Clock, TerminalSquare, PlusCircle, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Nodes from './pages/Nodes';
import History from './pages/History';
import TerminalPage from './pages/TerminalPage';

function App() {
  const [showAddNode, setShowAddNode] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [formData, setFormData] = useState({
    hostname: '', ip_address: '', os_type: 'ubuntu', connection_method: 'ssh', username: '', password: '', node_group: 'DEFAULT LAB'
  });

  const handleAddNode = async (e) => {
    e.preventDefault();
    setIsTesting(true);
    try {
      const res = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Node added successfully!");
        setShowAddNode(false);
        setIsTesting(false);
        window.location.reload();
      } else {
        alert(`Error: ${data.detail || 'Failed to add node'}`);
        setIsTesting(false);
      }
    } catch (err) {
      alert("Failed to connect to the server.");
      setIsTesting(false);
    }
  };

  return (
    <Router>
      <div className="flex h-screen bg-slate-50 relative">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col z-10">
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <Server className="h-6 w-6 text-indigo-500 mr-3" />
            <span className="text-lg font-semibold text-white">DevOps Hybrid</span>
          </div>
          
          <nav className="flex-1 py-4">
            <ul className="space-y-1">
              <li>
                <Link to="/" className="flex items-center px-6 py-2.5 text-sm hover:bg-slate-800 hover:text-white transition-colors">
                  <Activity className="h-5 w-5 mr-3 text-slate-400" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/nodes" className="flex items-center px-6 py-2.5 text-sm hover:bg-slate-800 hover:text-white transition-colors">
                  <Server className="h-5 w-5 mr-3 text-slate-400" />
                  Node Inventory
                </Link>
              </li>
              <li>
                <Link to="/history" className="flex items-center px-6 py-2.5 text-sm hover:bg-slate-800 hover:text-white transition-colors">
                  <Clock className="h-5 w-5 mr-3 text-slate-400" />
                  Deployment History
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-0">
            <h1 className="text-xl font-medium text-slate-800">Infrastructure Control</h1>
            <button 
              onClick={() => setShowAddNode(true)}
              className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Node
            </button>
          </header>
          
          <div className="flex-1 overflow-auto p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/nodes" element={<Nodes />} />
              <Route path="/history" element={<History />} />
              <Route path="/terminal/:nodeId" element={<TerminalPage />} />
            </Routes>
          </div>
        </main>

        {/* Add Node Modal */}
        {showAddNode && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl w-[500px] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800">Onboard New Node</h3>
                <button onClick={() => setShowAddNode(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddNode} className="p-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hostname</label>
                    <input required type="text" className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="e.g. LAB-UBUNTU"
                      value={formData.hostname} onChange={e => setFormData({...formData, hostname: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">IP Address</label>
                    <input required type="text" className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="192.168.1.x"
                      value={formData.ip_address} onChange={e => setFormData({...formData, ip_address: e.target.value})} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">OS Type</label>
                    <select className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white"
                      value={formData.os_type} onChange={e => setFormData({...formData, os_type: e.target.value})}>
                      <option value="ubuntu">Ubuntu / Linux</option>
                      <option value="windows">Windows</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Connection</label>
                    <select className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white"
                      value={formData.connection_method} onChange={e => setFormData({...formData, connection_method: e.target.value})}>
                      <option value="ssh">SSH (Linux)</option>
                      <option value="winrm">WinRM (Windows)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                    <input required type="text" className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="admin"
                      value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input required type="password" className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="••••••••"
                      value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Node Group (Logical Assignment)</label>
                  <input required type="text" className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="e.g. AI LAB, NETWORKING LAB"
                    value={formData.node_group} onChange={e => setFormData({...formData, node_group: e.target.value})} />
                </div>
                
                <div className="mt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddNode(false)} disabled={isTesting} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={isTesting} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50">
                    {isTesting ? 'Validating Connection...' : 'Register Node'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;

