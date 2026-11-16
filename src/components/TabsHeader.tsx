import React from 'react';
import { Crown } from 'lucide-react';

interface TabsHeaderProps {
  activeTab: 'HOME' | 'VIP_ROOM' | 'LOG';
  onTabChange: (tab: 'HOME' | 'VIP_ROOM' | 'LOG') => void;
  unreadLogsCount?: number;
}

export const TabsHeader: React.FC<TabsHeaderProps> = ({
  activeTab,
  onTabChange,
  unreadLogsCount = 0,
}) => {
  return (
    <div className="w-full bg-white/95 dark:bg-[#050B1A]/95 border-b border-slate-200 dark:border-blue-500/25 shadow-xs select-none">
      <div className="grid grid-cols-3 text-center">
        {/* HOME Tab */}
        <button
          onClick={() => onTabChange('HOME')}
          className={`py-3 text-xs sm:text-sm font-bold tracking-wider relative transition-colors focus:outline-none cursor-pointer ${
            activeTab === 'HOME'
              ? 'text-blue-600 dark:text-cyan-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          HOME
          {activeTab === 'HOME' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-t" />
          )}
        </button>

        {/* VIP ROOM Tab */}
        <button
          onClick={() => onTabChange('VIP_ROOM')}
          className={`py-3 text-xs sm:text-sm font-bold tracking-wider relative transition-colors focus:outline-none flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
            activeTab === 'VIP_ROOM'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>VIP ROOM</span>
          {activeTab === 'VIP_ROOM' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-emerald-400 rounded-t" />
          )}
        </button>

        {/* LOG Tab */}
        <button
          onClick={() => onTabChange('LOG')}
          className={`py-3 text-xs sm:text-sm font-bold tracking-wider relative transition-colors focus:outline-none flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'LOG'
              ? 'text-blue-600 dark:text-cyan-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>LOG</span>
          {unreadLogsCount > 0 && activeTab !== 'LOG' && (
            <span className="text-[10px] font-mono text-emerald-500">({unreadLogsCount})</span>
          )}
          {activeTab === 'LOG' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-emerald-400 rounded-t" />
          )}
        </button>
      </div>
    </div>
  );
};
