import React from 'react';
import { Activity } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-600">
          <Activity size={28} strokeWidth={2.5} />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">NeuroCalm</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            System Online
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
