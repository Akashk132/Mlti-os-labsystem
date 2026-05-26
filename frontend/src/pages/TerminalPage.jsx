import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal as TerminalIcon, X, Server } from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function TerminalPage() {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const terminalRef = useRef(null);
  const socketRef = useRef(null);
  const termInstance = useRef(null);
  const [nodeData, setNodeData] = useState(null);

  useEffect(() => {
    // Fetch node info
    fetch(`http://localhost:8000/nodes`)
      .then(res => res.json())
      .then(data => {
        const target = data.nodes.find(n => n.id === nodeId);
        setNodeData(target);
      })
      .catch(err => console.error(err));
  }, [nodeId]);

  useEffect(() => {
    if (!terminalRef.current || termInstance.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#0f172a',
        foreground: '#f8fafc',
        cursor: '#818cf8',
        selectionBackground: 'rgba(255, 255, 255, 0.3)'
      },
      fontFamily: '"Fira Code", "Source Code Pro", monospace',
      fontSize: 14
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    termInstance.current = term;

    // Handle Resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    // Initialize WebSocket
    const ws = new WebSocket(`ws://localhost:8000/ws/terminal/${nodeId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      term.focus();
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    term.onData(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    ws.onclose = () => {
      term.write('\r\n\x1b[31m*** Connection Closed ***\x1b[0m\r\n');
    };

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
      termInstance.current = null;
    };
  }, [nodeId]);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center">
          <TerminalIcon className="h-5 w-5 text-indigo-500 mr-3" />
          <h2 className="text-lg font-bold text-slate-800">
            Interactive Remote Shell
          </h2>
          {nodeData && (
             <span className="ml-4 px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded-full flex items-center font-semibold">
               <Server className="h-3 w-3 mr-1" />
               {nodeData.hostname} ({nodeData.ip_address}) - {nodeData.os_type}
             </span>
          )}
        </div>
        <button 
          onClick={() => navigate('/nodes')}
          className="text-slate-400 hover:text-rose-500 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 bg-slate-900 p-4 relative">
        <div ref={terminalRef} className="h-full w-full absolute inset-0 p-4" />
      </div>
    </div>
  );
}
