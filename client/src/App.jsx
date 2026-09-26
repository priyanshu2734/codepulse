import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ScanProvider } from './context/ScanContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import IssueExplorer from './pages/IssueExplorer';
import GraphView from './pages/GraphView';
import CommandPalette, { useCommandPalette } from './components/CommandPalette';

export default function App() {
  const [paletteOpen, setPaletteOpen] = useCommandPalette();

  return (
    <ScanProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="main-area">
          <TopBar onOpenPalette={() => setPaletteOpen(true)} />
          <main className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/issues" element={<IssueExplorer />} />
              <Route path="/graph" element={<GraphView />} />
            </Routes>
          </main>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </ScanProvider>
  );
}
