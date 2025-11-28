import React from 'react';
import { Activity, Download } from 'lucide-react';

interface HeaderProps {
  onInstall?: () => void;
  canInstall?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onInstall, canInstall }) => {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-600">
          <Activity size={28} strokeWidth={2.5} />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">NeuroCalm</h1>
        </div>
        <div className="flex items-center gap-4">
          {canInstall && (
            <button 
              onClick={onInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download size={14} />
              Install App
            </button>
          )}
          <span className="hidden sm:inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            System Online
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;