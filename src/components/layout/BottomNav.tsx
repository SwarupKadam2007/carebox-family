import React from 'react';
import { Home, History, Pill, Settings } from 'lucide-react';
import { ScreenTab } from '../../types';
import { useApp } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, setSubView } = useApp();

  const tabs: { id: ScreenTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'today', label: 'Today', icon: Home },
    { id: 'history', label: 'History', icon: History },
    { id: 'refills', label: 'Refills', icon: Pill },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tabId: ScreenTab) => {
    setSubView(null);
    setCurrentTab(tabId);
  };

  return (
    <nav
      aria-label="Bottom Navigation"
      className="bg-white/95 backdrop-blur-md border-t border-[#E5EAE9] px-4 py-2 flex justify-around items-center shrink-0 z-30"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = currentTab === id;
        return (
          <button
            key={id}
            id={`nav-tab-${id}`}
            onClick={() => handleTabClick(id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-[#2E7D79] font-semibold'
                : 'text-[#8E9E9C] hover:text-[#2E7D79] font-normal'
            }`}
          >
            <div className={`p-1 rounded-full transition-colors ${isActive ? 'bg-[#E8F3F1]' : ''}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            </div>
            <span className="text-[11px] tracking-tight mt-0.5">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
