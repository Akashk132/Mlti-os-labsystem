import React, { useState, useEffect } from 'react';
import { Server, Terminal, Settings, X, Play, RefreshCw, Power, CheckSquare, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Nodes() {
  const [nodes, setNodes] = useState([]);
  const [manageNode, setManageNode] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState({ package_name: '', installation_method: 'apt' });
  const [groupBy, setGroupBy] = useState('All');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/nodes')
      .then(res => res.json())
      .then(data => setNodes(data.nodes || []))
      .catch(err => console.error("Error fetching nodes:", err));
  }, []);

  const handleAction = async (endpoint, payload) => {
    try {
      const res = await fetch(`http://localhost:8000/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Action triggered successfully!');
        setManageNode(null);
        setSelectedNodes([]);
        setShowBulkModal(false);
      }
    } catch (err) {
      alert('Failed to trigger action');
    }
  };

  const toggleSelect = (id) => {
    if (selectedNodes.includes(id)) {
      setSelectedNodes(selectedNodes.filter(n => n !== id));
    } else {
      setSelectedNodes([...selectedNodes, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedNodes.length === groupedNodes.length) {
      setSelectedNodes([]);
    } else {
      setSelectedNodes(groupedNodes.map(n => n.id));
    }
  };

  const uniqueGroups = ['All', ...new Set(nodes.map(n => n.node_group || 'DEFAULT LAB'))];
  const groupedNodes = groupBy === 'All' ? nodes : nodes.filter(n => (n.node_group || 'DEFAULT LAB') === groupBy);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Node Inventory</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md px-3 py-1.5 shadow-sm">
            <Layers className="h-4 w-4 mr-2 text-indigo-500" />
            <select className="bg-transparent outline-none cursor-pointer" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
              {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedNodes.length > 0 && (
        <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center">
            <CheckSquare className="h-5 w-5 text-indigo-600 mr-2" />
            <span className="text-sm font-semibold text-indigo-900">{selectedNodes.length} Node(s) Selected</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowBulkModal(true)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-700 transition">
              Deploy Software
            </button>
            <button onClick={() => { selectedNodes.forEach(id => handleAction('reboot', { node_id: id })) }} className="px-3 py-1.5 bg-white text-slate-700 border border-slate-300 text-xs font-semibold rounded hover:bg-slate-50 transition">
              Reboot All
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-12">
                <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4" 
                  checked={selectedNodes.length === groupedNodes.length && groupedNodes.length > 0} 
                  onChange={toggleSelectAll} 
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Node / IP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Group</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">OS Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Management</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {groupedNodes.map(n => (
              <tr key={n.id} className={`hover:bg-slate-50 ${selectedNodes.includes(n.id) ? 'bg-indigo-50/30' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4" 
                    checked={selectedNodes.includes(n.id)} 
                    onChange={() => toggleSelect(n.id)} 
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Server className="h-5 w-5 text-slate-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{n.hostname}</div>
                      <div className="text-sm text-slate-500">{n.ip_address}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {n.node_group || 'DEFAULT LAB'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                    {n.os_type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${n.status === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {n.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => navigate(`/terminal/${n.id}`)} className="text-indigo-600 hover:text-indigo-900 mr-4 inline-flex items-center">
                    <Terminal className="h-4 w-4 mr-1" /> Shell
                  </button>
                  <button onClick={() => setManageNode(n)} className="text-slate-600 hover:text-slate-900 inline-flex items-center">
                    <Settings className="h-4 w-4 mr-1" /> Manage
                  </button>
                </td>
              </tr>
            ))}
            {groupedNodes.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">No nodes found in this view.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showBulkModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-[500px] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Dynamic Bulk Deployment</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4 bg-slate-50">
               <div className="bg-white p-4 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">Deployment Configuration</h4>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Package / Command Name</label>
                    <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="e.g. docker-ce, python3, or a raw command" 
                      value={bulkData.package_name} onChange={e => setBulkData({...bulkData, package_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Installation Method</label>
                    <select className="w-full border border-slate-300 rounded p-2 text-sm bg-white" 
                      value={bulkData.installation_method} onChange={e => setBulkData({...bulkData, installation_method: e.target.value})}>
                      <option value="apt">APT (Ubuntu/Debian)</option>
                      <option value="pip">PIP (Python Packages)</option>
                      <option value="choco">Chocolatey (Windows)</option>
                      <option value="winget">Winget (Windows)</option>
                      <option value="command">Raw Command Execution</option>
                    </select>
                  </div>
               </div>
               
               <div className="text-xs text-slate-500">
                 This deployment will target <strong>{selectedNodes.length}</strong> node(s). The backend dynamically scales this over SSH and WinRM simultaneously.
               </div>
               
               <div className="mt-2 flex justify-end gap-3">
                 <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-md text-sm hover:bg-slate-50">Cancel</button>
                 <button 
                  onClick={() => handleAction('deploy/bulk', { node_ids: selectedNodes, package_name: bulkData.package_name, installation_method: bulkData.installation_method })}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition"
                  disabled={!bulkData.package_name}
                 >
                   Execute Bulk Deploy
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {manageNode && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-[500px] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Manage Node: {manageNode.hostname}</h3>
              <button onClick={() => setManageNode(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button 
                  onClick={() => handleAction('deploy', { node_id: manageNode.id, task: 'update_system' })}
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                >
                  <RefreshCw className="h-6 w-6 text-indigo-500 mb-2" />
                  <span className="text-sm font-medium text-slate-700">Update System</span>
                </button>
                <button 
                  onClick={() => handleAction('deploy', { node_id: manageNode.id, task: 'install_docker' })}
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                >
                  <Play className="h-6 w-6 text-indigo-500 mb-2" />
                  <span className="text-sm font-medium text-slate-700">Install Docker</span>
                </button>
                <button 
                  onClick={() => handleAction('restart-service', { node_id: manageNode.id, service_name: 'docker' })}
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <RefreshCw className="h-6 w-6 text-blue-500 mb-2" />
                  <span className="text-sm font-medium text-slate-700">Restart Docker</span>
                </button>
                <button 
                  onClick={() => handleAction('reboot', { node_id: manageNode.id })}
                  className="flex flex-col items-center justify-center p-4 border border-rose-200 rounded-lg hover:border-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <Power className="h-6 w-6 text-rose-500 mb-2" />
                  <span className="text-sm font-medium text-rose-700">Reboot Node</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
