// src/components/profileDetail/TabNavigation.tsx
import { BarChart3, Brain, MessageCircle } from 'lucide-react';

export type ProfileTab = 'overview' | 'analysis' | 'coach';

interface TabNavigationProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
  { id: 'analysis', label: 'Analysis', icon: <Brain size={16} /> },
  { id: 'coach', label: 'Coach', icon: <MessageCircle size={16} /> },
];

/**
 * Tab navigation for ProfileDetail page
 */
export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
